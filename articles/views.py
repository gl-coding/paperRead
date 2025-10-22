from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Article, ReadingHistory, Annotation
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


class ArticleViewSet(viewsets.ModelViewSet):
    """文章视图集"""
    queryset = Article.objects.filter(is_active=True)
    serializer_class = ArticleSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        return ArticleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
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
        read_duration = request.data.get('read_duration', 0)
        
        ReadingHistory.objects.create(
            article=article,
            user_ip=user_ip,
            read_duration=read_duration
        )
        
        return Response({'status': 'reading recorded'})

    @action(detail=True, methods=['get'])
    def annotations(self, request, pk=None):
        """获取文章的标注"""
        article = self.get_object()
        user_ip = get_client_ip(request)
        
        annotations = Annotation.objects.filter(
            article=article,
            user_ip=user_ip
        )
        serializer = AnnotationSerializer(annotations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def save_annotations(self, request, pk=None):
        """保存标注"""
        article = self.get_object()
        user_ip = get_client_ip(request)
        annotations_data = request.data.get('annotations', [])
        
        # 删除旧标注
        Annotation.objects.filter(article=article, user_ip=user_ip).delete()
        
        # 保存新标注
        for ann in annotations_data:
            Annotation.objects.create(
                article=article,
                user_ip=user_ip,
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
