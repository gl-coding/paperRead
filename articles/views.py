from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Article, ReadingHistory, Annotation, Favorite, GrammarArticle, UserGrammarArticle
from .serializers import (
    ArticleSerializer, ArticleListSerializer,
    ReadingHistorySerializer, AnnotationSerializer,
    GrammarArticleSerializer, GrammarArticleListSerializer,
    UserGrammarArticleSerializer, UserGrammarArticleListSerializer
)


def get_client_ip(request):
    """获取客户端IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_identifier(request):
    """获取用户标识（优先使用用户名，其次使用IP）"""
    # 优先从查询参数获取用户名
    username = request.query_params.get('username', None)
    if username:
        return username
    
    # 尝试从POST数据获取用户名
    username = request.data.get('username', None)
    if username:
        return username
    
    # 降级使用IP地址（向后兼容）
    return get_client_ip(request)


class ArticleViewSet(viewsets.ModelViewSet):
    """文章视图集"""
    queryset = Article.objects.filter(is_active=True)
    serializer_class = ArticleSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        return ArticleSerializer
    
    def get_serializer_context(self):
        """添加额外的context信息到序列化器"""
        context = super().get_serializer_context()
        # 添加用户名到context，用于获取阅读历史
        context['username'] = self.request.query_params.get('username', None)
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 推荐筛选
        is_recommended = self.request.query_params.get('is_recommended', None)
        if is_recommended == 'true':
            queryset = queryset.filter(is_recommended=True)
        
        # 收藏筛选
        is_favorite = self.request.query_params.get('is_favorite', None)
        if is_favorite == 'true':
            username = self.request.query_params.get('username', 'guest')
            # 获取该用户收藏的文章ID列表
            favorite_article_ids = Favorite.objects.filter(
                username=username
            ).values_list('article_id', flat=True).distinct()
            queryset = queryset.filter(id__in=favorite_article_ids)
        
        # 在读筛选（已读文章）
        is_read = self.request.query_params.get('is_read', None)
        if is_read == 'true':
            username = self.request.query_params.get('username', 'guest')
            # 获取该用户已读的文章ID列表
            read_article_ids = ReadingHistory.objects.filter(
                username=username
            ).values_list('article_id', flat=True).distinct()
            queryset = queryset.filter(id__in=read_article_ids)
        
        # 搜索功能
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # 难度筛选
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # 分类筛选
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # 作者筛选（用于"我的"文章）
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author=author)
        
        return queryset

    @action(detail=True, methods=['post'])
    def record_reading(self, request, pk=None):
        """记录阅读历史"""
        article = self.get_object()
        user_ip = get_client_ip(request)
        username = get_user_identifier(request)
        read_duration = request.data.get('read_duration', 0)
        
        # 使用get_or_create避免重复记录，更新阅读时间和时长
        reading_history, created = ReadingHistory.objects.update_or_create(
            article=article,
            username=username,
            defaults={
                'user_ip': user_ip,
                'read_duration': read_duration
            }
        )
        
        return Response({
            'status': 'reading recorded',
            'created': created
        })

    @action(detail=True, methods=['get'])
    def annotations(self, request, pk=None):
        """获取文章的标注（支持用户名）"""
        article = self.get_object()
        user_identifier = get_user_identifier(request)
        
        annotations = Annotation.objects.filter(
            article=article,
            user_ip=user_identifier
        )
        serializer = AnnotationSerializer(annotations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def save_annotations(self, request, pk=None):
        """保存标注（支持用户名）"""
        article = self.get_object()
        user_identifier = get_user_identifier(request)
        annotations_data = request.data.get('annotations', [])
        
        # 删除旧标注
        Annotation.objects.filter(article=article, user_ip=user_identifier).delete()
        
        # 保存新标注
        for ann in annotations_data:
            Annotation.objects.create(
                article=article,
                user_ip=user_identifier,  # 虽然字段名是user_ip，但现在存储的是用户标识
                word=ann['word'],
                color=ann['color']
            )
        
        return Response({'status': 'annotations saved'})

    @action(detail=True, methods=['get'])
    def content_paginated(self, request, pk=None):
        """分页获取文章内容（使用存储的段落数据）"""
        article = self.get_object()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 8))
        
        # 使用存储的段落数据（如果没有则实时分割并保存）
        if not article.paragraphs or len(article.paragraphs) == 0:
            # 兼容旧数据：实时分割并保存
            paragraphs = [p.strip() for p in article.content.split('\n\n') if p.strip()]
            article.paragraphs = paragraphs
            article.paragraph_count = len(paragraphs)
            article.save()
        else:
            paragraphs = article.paragraphs
        
        # 使用Django的分页器
        paginator = Paginator(paragraphs, page_size)
        
        try:
            page_obj = paginator.get_page(page)
        except Exception:
            page_obj = paginator.get_page(1)
        
        return Response({
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_paragraphs': len(paragraphs),
            'paragraphs': list(page_obj),
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            # 基本文章信息
            'article_id': article.id,
            'article_title': article.title,
            'word_count': article.word_count,
            'paragraph_count': article.paragraph_count
        })
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """收藏/取消收藏文章"""
        article = self.get_object()
        username = get_user_identifier(request)
        
        # 检查是否已收藏
        favorite = Favorite.objects.filter(
            article=article,
            username=username
        ).first()
        
        if favorite:
            # 已收藏，则取消收藏
            favorite.delete()
            return Response({
                'status': 'unfavorited',
                'is_favorited': False,
                'message': '已取消收藏'
            })
        else:
            # 未收藏，则添加收藏
            Favorite.objects.create(
                article=article,
                username=username
            )
            return Response({
                'status': 'favorited',
                'is_favorited': True,
                'message': '已收藏'
            })
    
    @action(detail=True, methods=['get'])
    def check_favorite(self, request, pk=None):
        """检查文章是否已收藏"""
        article = self.get_object()
        username = get_user_identifier(request)
        
        is_favorited = Favorite.objects.filter(
            article=article,
            username=username
        ).exists()
        
        return Response({
            'is_favorited': is_favorited
        })
    
    @action(detail=False, methods=['post'])
    def generate_content(self, request):
        """使用AI生成文章内容"""
        prompt = request.data.get('prompt', '').strip()
        ai_config = request.data.get('ai_config', {})
        
        if not prompt:
            return Response({
                'error': '提示词不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            content = None
            
            # 获取AI配置
            provider = ai_config.get('provider', '')
            api_key = ai_config.get('apiKey', '')
            custom_url = ai_config.get('customUrl', '')
            
            # 如果有真实的API配置，尝试调用
            if provider and api_key:
                try:
                    if provider in ['openai', 'deepseek']:
                        # OpenAI/DeepSeek兼容API
                        import openai
                        
                        # 配置客户端
                        if provider == 'deepseek':
                            client = openai.OpenAI(
                                api_key=api_key,
                                base_url='https://api.deepseek.com'
                            )
                            model = 'deepseek-chat'
                        else:
                            client = openai.OpenAI(api_key=api_key)
                            model = 'gpt-3.5-turbo'
                        
                        # 调用API
                        response = client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that writes English articles for language learners. Write clear, well-structured articles."},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=2000,
                            temperature=0.7
                        )
                        content = response.choices[0].message.content
                        
                    elif provider == 'claude':
                        # Anthropic Claude API
                        import anthropic
                        client = anthropic.Anthropic(api_key=api_key)
                        message = client.messages.create(
                            model="claude-3-sonnet-20240229",
                            max_tokens=2000,
                            messages=[
                                {"role": "user", "content": f"Write an English article for language learners based on this prompt: {prompt}"}
                            ]
                        )
                        content = message.content[0].text
                        
                    elif provider == 'custom' and custom_url:
                        # 自定义API（OpenAI兼容）
                        import openai
                        client = openai.OpenAI(
                            api_key=api_key,
                            base_url=custom_url
                        )
                        response = client.chat.completions.create(
                            model='gpt-3.5-turbo',
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that writes English articles."},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=2000
                        )
                        content = response.choices[0].message.content
                        
                except ImportError:
                    # SDK未安装，返回提示
                    content = f"""⚠️ AI SDK Not Installed

To use {provider.upper()} API, please install the required package:

For OpenAI/DeepSeek:
pip install openai

For Claude:
pip install anthropic

---

Your prompt was: "{prompt}"

Please install the SDK and restart the server to use real AI generation."""
                
                except Exception as api_error:
                    # API调用失败，返回错误信息和示例内容
                    content = f"""⚠️ AI API Error: {str(api_error)}

Showing sample content instead...

---

# Sample Article

Based on your prompt: "{prompt}"

## Introduction

This is a sample article structure. The actual content would be generated by the AI based on your prompt.

## Main Content

Your prompt requested information about: {prompt[:100]}...

Here you would find detailed, well-structured content addressing your topic.

## Conclusion

To use real AI generation, please:
1. Ensure your API key is correct
2. Check your API account has sufficient credits
3. Verify your network connection

---

Note: This is sample content shown because the AI API call failed."""
            
            # 如果没有配置或调用失败，返回示例内容
            if not content:
                content = f"""# Sample Generated Article

**Your prompt:** {prompt}

## Introduction

This is a **sample article** generated for demonstration purposes. To use real AI generation, please:

1. Go to **Personal Center** (个人中心)
2. Configure your **AI API** settings
3. Choose a provider (OpenAI, Claude, DeepSeek, etc.)
4. Enter your API key
5. Save the configuration

## Main Content

Once you've configured a real AI API, the system will generate actual content based on your prompt. The content will be:

- Professionally written
- Tailored to your specific prompt
- Suitable for language learners
- Well-structured and informative

### Example Topics

For grammar articles, you might request:
- Explanations of tenses
- Common grammar mistakes
- Usage of prepositions
- Sentence structures

## Conclusion

This sample demonstrates the article structure. Configure your AI API to generate real content!

---

💡 **Tip:** DeepSeek is recommended for Chinese users - fast, affordable, and excellent Chinese support."""
            
            return Response({
                'content': content,
                'prompt': prompt,
                'provider': provider if provider else 'demo'
            })
            
        except Exception as e:
            return Response({
                'error': f'生成失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReadingHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """阅读历史视图集（只读）"""
    queryset = ReadingHistory.objects.all()
    serializer_class = ReadingHistorySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_ip = get_client_ip(self.request)
        return queryset.filter(user_ip=user_ip)


class AnnotationViewSet(viewsets.ModelViewSet):
    """标注视图集"""
    queryset = Annotation.objects.all()
    serializer_class = AnnotationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_ip = get_client_ip(self.request)
        return queryset.filter(user_ip=user_ip)


class GrammarArticleViewSet(viewsets.ModelViewSet):
    """语法文章视图集（系统管理）"""
    queryset = GrammarArticle.objects.filter(is_active=True)
    serializer_class = GrammarArticleSerializer

    def get_serializer_class(self):
        """根据action返回不同的序列化器"""
        if self.action == 'list':
            return GrammarArticleListSerializer
        return GrammarArticleSerializer

    def get_queryset(self):
        """支持筛选和搜索"""
        queryset = super().get_queryset()
        
        # 搜索
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(category__icontains=search)
            )
        
        # 难度筛选
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # 分类筛选
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset

    @action(detail=False, methods=['post'])
    def generate_content(self, request):
        """使用AI生成语法文章内容"""
        prompt = request.data.get('prompt', '').strip()
        ai_config = request.data.get('ai_config', {})
        
        if not prompt:
            return Response({
                'error': '提示词不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            content = None
            
            # 获取AI配置
            provider = ai_config.get('provider', '')
            api_key = ai_config.get('apiKey', '')
            custom_url = ai_config.get('customUrl', '')
            
            # 如果有真实的API配置，尝试调用
            if provider and api_key:
                try:
                    if provider in ['openai', 'deepseek']:
                        # OpenAI/DeepSeek兼容API
                        import openai
                        
                        # 配置客户端
                        if provider == 'deepseek':
                            client = openai.OpenAI(
                                api_key=api_key,
                                base_url='https://api.deepseek.com'
                            )
                            model = 'deepseek-chat'
                        else:
                            client = openai.OpenAI(api_key=api_key)
                            model = 'gpt-3.5-turbo'
                        
                        # 调用API
                        response = client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that writes English grammar articles for language learners. Write clear, well-structured grammar explanations with examples."},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=2000,
                            temperature=0.7
                        )
                        content = response.choices[0].message.content
                        
                    elif provider == 'claude':
                        # Anthropic Claude API
                        import anthropic
                        client = anthropic.Anthropic(api_key=api_key)
                        message = client.messages.create(
                            model="claude-3-sonnet-20240229",
                            max_tokens=2000,
                            messages=[
                                {"role": "user", "content": f"Write an English grammar article for language learners based on this prompt: {prompt}"}
                            ]
                        )
                        content = message.content[0].text
                        
                    elif provider == 'custom' and custom_url:
                        # 自定义API（OpenAI兼容）
                        import openai
                        client = openai.OpenAI(
                            api_key=api_key,
                            base_url=custom_url
                        )
                        response = client.chat.completions.create(
                            model='gpt-3.5-turbo',
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that writes English grammar articles."},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=2000
                        )
                        content = response.choices[0].message.content
                        
                except ImportError:
                    # SDK未安装，返回提示
                    content = f"""⚠️ AI SDK Not Installed

To use {provider.upper()} API, please install the required package:

For OpenAI/DeepSeek:
pip install openai

For Claude:
pip install anthropic

---

Your prompt was: "{prompt}"

Please install the SDK and restart the server to use real AI generation."""
                
                except Exception as api_error:
                    # API调用失败，返回错误信息和示例内容
                    content = f"""⚠️ AI API Error: {str(api_error)}

Showing sample content instead...

---

# Sample Grammar Article

Based on your prompt: "{prompt}"

## Grammar Point

This section would explain the grammar concept in detail.

## Usage and Rules

Clear explanation of when and how to use this grammar point.

## Examples

1. Correct usage examples
2. Common mistakes to avoid
3. Practice exercises

---

Note: This is sample content shown because the AI API call failed."""
            
            # 如果没有配置或调用失败，返回示例内容
            if not content:
                content = f"""# Sample Grammar Article

**Your prompt:** {prompt}

## Overview

This is a **sample grammar article** for demonstration purposes. To use real AI generation, please configure your AI API in the Personal Center.

## How to Configure

1. Go to **Personal Center** (个人中心)
2. Configure your **AI API** settings
3. Choose a provider (OpenAI, Claude, DeepSeek, etc.)
4. Enter your API key
5. Save the configuration

## What You'll Get

Once configured, the system will generate professional grammar articles including:

- Clear explanations of grammar rules
- Practical examples and usage scenarios
- Common mistakes and how to avoid them
- Practice exercises for learners

---

💡 **Tip:** DeepSeek is recommended for Chinese users - fast, affordable, and excellent grammar content generation."""
            
            return Response({
                'content': content,
                'prompt': prompt,
                'provider': provider if provider else 'demo'
            })
            
        except Exception as e:
            return Response({
                'error': f'生成失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def content_paginated(self, request, pk=None):
        """分页获取语法文章内容"""
        article = self.get_object()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 8))
        
        # 使用存储的段落数据
        if not article.paragraphs or len(article.paragraphs) == 0:
            # 实时分割并保存
            paragraphs = [p.strip() for p in article.content.split('\n\n') if p.strip()]
            article.paragraphs = paragraphs
            article.paragraph_count = len(paragraphs)
            article.save()
        else:
            paragraphs = article.paragraphs
        
        # 使用Django的分页器
        paginator = Paginator(paragraphs, page_size)
        
        try:
            page_obj = paginator.get_page(page)
        except Exception:
            page_obj = paginator.get_page(1)
        
        return Response({
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_paragraphs': len(paragraphs),
            'paragraphs': list(page_obj),
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'article_id': article.id,
            'article_title': article.title,
            'word_count': article.word_count,
            'paragraph_count': article.paragraph_count
        })

    @action(detail=True, methods=['post'])
    def record_reading(self, request, pk=None):
        """记录语法文章阅读历史（暂不实现，返回成功状态）"""
        # TODO: 创建GrammarReadingHistory模型来记录语法文章的阅读历史
        # 目前ReadingHistory模型只支持Article，不支持GrammarArticle
        return Response({
            'status': 'reading recorded',
            'created': False,
            'note': 'Grammar article reading history not yet implemented'
        })


class UserGrammarArticleViewSet(viewsets.ModelViewSet):
    """用户语法文章视图集"""
    queryset = UserGrammarArticle.objects.filter(is_active=True)
    serializer_class = UserGrammarArticleSerializer

    def get_serializer_class(self):
        """根据action返回不同的序列化器"""
        if self.action == 'list':
            return UserGrammarArticleListSerializer
        return UserGrammarArticleSerializer

    def get_queryset(self):
        """支持筛选和搜索，只显示当前用户的文章"""
        queryset = super().get_queryset()
        
        # 获取用户标识
        username = get_user_identifier(self.request)
        queryset = queryset.filter(author=username)
        
        # 搜索
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(category__icontains=search)
            )
        
        # 难度筛选
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # 分类筛选
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset

    def perform_create(self, serializer):
        """创建时自动设置作者"""
        # 优先使用请求中的author字段，如果没有则使用用户标识
        if 'author' not in self.request.data:
            username = get_user_identifier(self.request)
            serializer.save(author=username)
        else:
            serializer.save()

    def perform_update(self, serializer):
        """更新时保持作者"""
        # 允许更新，但不强制覆盖author
        serializer.save()

    @action(detail=False, methods=['post'])
    def generate_content(self, request):
        """使用AI生成用户语法文章内容"""
        # 与GrammarArticleViewSet的generate_content相同
        prompt = request.data.get('prompt', '').strip()
        ai_config = request.data.get('ai_config', {})
        
        if not prompt:
            return Response({
                'error': '提示词不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            content = None
            
            # 获取AI配置
            provider = ai_config.get('provider', '')
            api_key = ai_config.get('apiKey', '')
            custom_url = ai_config.get('customUrl', '')
            
            # 如果有真实的API配置，尝试调用
            if provider and api_key:
                try:
                    if provider in ['openai', 'deepseek']:
                        # OpenAI/DeepSeek兼容API
                        import openai
                        
                        # 配置客户端
                        if provider == 'deepseek':
                            client = openai.OpenAI(
                                api_key=api_key,
                                base_url='https://api.deepseek.com'
                            )
                            model = 'deepseek-chat'
                        else:
                            client = openai.OpenAI(api_key=api_key)
                            model = 'gpt-3.5-turbo'
                        
                        # 调用API
                        response = client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that writes English grammar articles for language learners. Write clear, well-structured grammar explanations with examples."},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=2000,
                            temperature=0.7
                        )
                        content = response.choices[0].message.content
                        
                    elif provider == 'claude':
                        # Anthropic Claude API
                        import anthropic
                        client = anthropic.Anthropic(api_key=api_key)
                        message = client.messages.create(
                            model="claude-3-sonnet-20240229",
                            max_tokens=2000,
                            messages=[
                                {"role": "user", "content": f"Write an English grammar article for language learners based on this prompt: {prompt}"}
                            ]
                        )
                        content = message.content[0].text
                        
                    elif provider == 'custom' and custom_url:
                        # 自定义API（OpenAI兼容）
                        import openai
                        client = openai.OpenAI(
                            api_key=api_key,
                            base_url=custom_url
                        )
                        response = client.chat.completions.create(
                            model='gpt-3.5-turbo',
                            messages=[
                                {"role": "system", "content": "You are a helpful assistant that writes English grammar articles."},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=2000
                        )
                        content = response.choices[0].message.content
                        
                except ImportError:
                    # SDK未安装，返回提示
                    content = f"""⚠️ AI SDK Not Installed

To use {provider.upper()} API, please install the required package:

For OpenAI/DeepSeek:
pip install openai

For Claude:
pip install anthropic

---

Your prompt was: "{prompt}"

Please install the SDK and restart the server to use real AI generation."""
                
                except Exception as api_error:
                    # API调用失败，返回错误信息和示例内容
                    content = f"""⚠️ AI API Error: {str(api_error)}

Showing sample content instead...

---

# Sample Grammar Article

Based on your prompt: "{prompt}"

## Grammar Point

This section would explain the grammar concept in detail.

## Usage and Rules

Clear explanation of when and how to use this grammar point.

## Examples

1. Correct usage examples
2. Common mistakes to avoid
3. Practice exercises

---

Note: This is sample content shown because the AI API call failed."""
            
            # 如果没有配置或调用失败，返回示例内容
            if not content:
                content = f"""# Sample Grammar Article

**Your prompt:** {prompt}

## Overview

This is a **sample grammar article** for demonstration purposes. To use real AI generation, please configure your AI API in the Personal Center.

## How to Configure

1. Go to **Personal Center** (个人中心)
2. Configure your **AI API** settings
3. Choose a provider (OpenAI, Claude, DeepSeek, etc.)
4. Enter your API key
5. Save the configuration

## What You'll Get

Once configured, the system will generate professional grammar articles including:

- Clear explanations of grammar rules
- Practical examples and usage scenarios
- Common mistakes and how to avoid them
- Practice exercises for learners

---

💡 **Tip:** DeepSeek is recommended for Chinese users - fast, affordable, and excellent grammar content generation."""
            
            return Response({
                'content': content,
                'prompt': prompt,
                'provider': provider if provider else 'demo'
            })
            
        except Exception as e:
            return Response({
                'error': f'生成失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
