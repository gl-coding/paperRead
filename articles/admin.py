from django.contrib import admin
from .models import Article, ReadingHistory, Annotation, GrammarArticle, UserGrammarArticle


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'category', 'word_count', 'created_at', 'is_active']
    list_filter = ['difficulty', 'category', 'is_active', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['word_count', 'created_at', 'updated_at']
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'content', 'source')
        }),
        ('分类信息', {
            'fields': ('difficulty', 'category')
        }),
        ('统计信息', {
            'fields': ('word_count', 'created_at', 'updated_at')
        }),
        ('状态', {
            'fields': ('is_active',)
        }),
    )


@admin.register(ReadingHistory)
class ReadingHistoryAdmin(admin.ModelAdmin):
    list_display = ['article', 'user_ip', 'read_at', 'read_duration']
    list_filter = ['read_at']
    search_fields = ['article__title', 'user_ip']
    readonly_fields = ['read_at']


@admin.register(Annotation)
class AnnotationAdmin(admin.ModelAdmin):
    list_display = ['word', 'color', 'article', 'user_ip', 'created_at']
    list_filter = ['color', 'created_at']
    search_fields = ['word', 'article__title', 'user_ip']
    readonly_fields = ['created_at']


@admin.register(GrammarArticle)
class GrammarArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'category', 'word_count', 'created_at', 'is_active', 'author']
    list_filter = ['difficulty', 'category', 'is_active', 'created_at']
    search_fields = ['title', 'content', 'author']
    readonly_fields = ['word_count', 'paragraph_count', 'created_at', 'updated_at']
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'content', 'source', 'author')
        }),
        ('分类信息', {
            'fields': ('difficulty', 'category')
        }),
        ('统计信息', {
            'fields': ('word_count', 'paragraph_count', 'created_at', 'updated_at')
        }),
        ('状态', {
            'fields': ('is_active',)
        }),
    )


@admin.register(UserGrammarArticle)
class UserGrammarArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'difficulty', 'category', 'word_count', 'created_at', 'is_active']
    list_filter = ['difficulty', 'category', 'is_active', 'created_at', 'author']
    search_fields = ['title', 'content', 'author']
    readonly_fields = ['word_count', 'paragraph_count', 'created_at', 'updated_at']
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'content', 'source', 'author')
        }),
        ('分类信息', {
            'fields': ('difficulty', 'category')
        }),
        ('统计信息', {
            'fields': ('word_count', 'paragraph_count', 'created_at', 'updated_at')
        }),
        ('状态', {
            'fields': ('is_active',)
        }),
    )
