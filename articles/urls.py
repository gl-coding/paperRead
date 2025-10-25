from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArticleViewSet, ReadingHistoryViewSet, AnnotationViewSet,
    GrammarArticleViewSet, UserGrammarArticleViewSet
)

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'history', ReadingHistoryViewSet)
router.register(r'annotations', AnnotationViewSet)
router.register(r'grammar-articles', GrammarArticleViewSet)
router.register(r'user-grammar-articles', UserGrammarArticleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

