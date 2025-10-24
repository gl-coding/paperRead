from rest_framework import serializers
from .models import Article, ReadingHistory, Annotation


class ArticleSerializer(serializers.ModelSerializer):
    """文章序列化器"""
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'source', 'difficulty',
            'category', 'word_count', 'paragraph_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['word_count', 'paragraph_count', 'created_at', 'updated_at']


class ArticleListSerializer(serializers.ModelSerializer):
    """文章列表序列化器（简化版）"""
    content_preview = serializers.SerializerMethodField()
    reading_info = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content_preview', 'source', 
            'difficulty', 'category', 'word_count', 'paragraph_count', 'created_at',
            'reading_info', 'is_favorited'
        ]

    def get_content_preview(self, obj):
        """返回内容预览（前200个字符）"""
        if obj.content:
            return obj.content[:200] + '...' if len(obj.content) > 200 else obj.content
        return ''
    
    def get_reading_info(self, obj):
        """返回阅读历史信息（如果有）"""
        # 从context中获取用户名
        username = self.context.get('username', None)
        if not username:
            return None
        
        try:
            from .models import ReadingHistory
            history = ReadingHistory.objects.filter(
                article=obj,
                username=username
            ).first()
            
            if history:
                # 从localStorage获取的当前阅读页码会在前端处理
                # 这里只返回后端记录的信息
                return {
                    'read_at': history.read_at.isoformat() if history.read_at else None,
                    'read_duration': history.read_duration,
                }
        except Exception as e:
            print(f"获取阅读信息失败: {e}")
        
        return None
    
    def get_is_favorited(self, obj):
        """返回是否已收藏"""
        # 从context中获取用户名
        username = self.context.get('username', None)
        if not username:
            return False
        
        try:
            from .models import Favorite
            return Favorite.objects.filter(
                article=obj,
                username=username
            ).exists()
        except Exception as e:
            print(f"检查收藏状态失败: {e}")
        
        return False


class ReadingHistorySerializer(serializers.ModelSerializer):
    """阅读历史序列化器"""
    article_title = serializers.CharField(source='article.title', read_only=True)

    class Meta:
        model = ReadingHistory
        fields = ['id', 'article', 'article_title', 'user_ip', 'read_at', 'read_duration']
        read_only_fields = ['read_at']


class AnnotationSerializer(serializers.ModelSerializer):
    """标注序列化器"""
    class Meta:
        model = Annotation
        fields = ['id', 'article', 'user_ip', 'word', 'color', 'created_at']
        read_only_fields = ['created_at']

