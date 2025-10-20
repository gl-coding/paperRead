from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
