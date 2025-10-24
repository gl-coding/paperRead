from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Article, ReadingHistory, Annotation, Favorite
from .serializers import (
    ArticleSerializer, ArticleListSerializer,
    ReadingHistorySerializer, AnnotationSerializer
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
