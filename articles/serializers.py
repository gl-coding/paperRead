from rest_framework import serializers
from .models import Article, ReadingHistory, Annotation


class ArticleSerializer(serializers.ModelSerializer):
    """文章序列化器"""
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'source', 'difficulty',
            'category', 'word_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['word_count', 'created_at', 'updated_at']


class ArticleListSerializer(serializers.ModelSerializer):
    """文章列表序列化器（简化版）"""
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content_preview', 'source', 
            'difficulty', 'category', 'word_count', 'created_at'
        ]

    def get_content_preview(self, obj):
        """返回内容预览（前200个字符）"""
        if obj.content:
            return obj.content[:200] + '...' if len(obj.content) > 200 else obj.content
        return ''


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

