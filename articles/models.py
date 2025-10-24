from django.db import models
from django.utils import timezone
import json


class Article(models.Model):
    """英文文章模型"""
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='文章内容')
    source = models.CharField(max_length=200, blank=True, null=True, verbose_name='来源')
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('beginner', '初级'),
            ('intermediate', '中级'),
            ('advanced', '高级'),
        ],
        default='intermediate',
        verbose_name='难度'
    )
    category = models.CharField(max_length=50, blank=True, null=True, verbose_name='分类')
    word_count = models.IntegerField(default=0, verbose_name='单词数')
    paragraph_count = models.IntegerField(default=0, verbose_name='段落数')
    paragraphs = models.JSONField(default=list, blank=True, verbose_name='段落数据')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_recommended = models.BooleanField(default=False, verbose_name='是否推荐')

    class Meta:
        db_table = 'articles'
        verbose_name = '文章'
        verbose_name_plural = '文章'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # 自动计算单词数和段落数，并存储段落数据
        if self.content:
            import re
            words = re.findall(r'\b[a-zA-Z]+\b', self.content)
            self.word_count = len(words)
            # 分割并存储段落
            paragraphs_list = [p.strip() for p in self.content.split('\n\n') if p.strip()]
            self.paragraph_count = len(paragraphs_list)
            self.paragraphs = paragraphs_list  # 存储段落数组
        super().save(*args, **kwargs)


class ReadingHistory(models.Model):
    """阅读历史记录"""
    article = models.ForeignKey(Article, on_delete=models.CASCADE, verbose_name='文章')
    user_ip = models.GenericIPAddressField(verbose_name='用户IP')
    username = models.CharField(max_length=50, default='guest', verbose_name='用户名')
    read_at = models.DateTimeField(default=timezone.now, verbose_name='阅读时间')
    read_duration = models.IntegerField(default=0, verbose_name='阅读时长(秒)')

    class Meta:
        db_table = 'reading_history'
        verbose_name = '阅读历史'
        verbose_name_plural = '阅读历史'
        ordering = ['-read_at']
        unique_together = [['article', 'username']]

    def __str__(self):
        return f"{self.username} - {self.article.title}"


class Annotation(models.Model):
    """用户标注记录"""
    article = models.ForeignKey(Article, on_delete=models.CASCADE, verbose_name='文章')
    user_ip = models.GenericIPAddressField(verbose_name='用户IP')
    word = models.CharField(max_length=100, verbose_name='单词')
    color = models.CharField(max_length=20, verbose_name='标注颜色')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')

    class Meta:
        db_table = 'annotations'
        verbose_name = '标注'
        verbose_name_plural = '标注'
        unique_together = [['article', 'user_ip', 'word']]

    def __str__(self):
        return f"{self.word} - {self.color}"


class Favorite(models.Model):
    """用户收藏文章"""
    article = models.ForeignKey(Article, on_delete=models.CASCADE, verbose_name='文章')
    username = models.CharField(max_length=50, default='guest', verbose_name='用户名')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='收藏时间')

    class Meta:
        db_table = 'favorites'
        verbose_name = '收藏'
        verbose_name_plural = '收藏'
        ordering = ['-created_at']
        unique_together = [['article', 'username']]

    def __str__(self):
        return f"{self.username} - {self.article.title}"
