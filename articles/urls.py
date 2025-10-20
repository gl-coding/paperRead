from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, ReadingHistoryViewSet, AnnotationViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'history', ReadingHistoryViewSet)
router.register(r'annotations', AnnotationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

