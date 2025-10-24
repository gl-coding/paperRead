#!/usr/bin/env python
"""测试"在读"tab功能"""

import os
import sys
import django

# 设置Django环境
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from articles.models import Article, ReadingHistory
from django.utils import timezone

def test_reading_history():
    """测试阅读历史功能"""
    print("=" * 60)
    print("测试阅读历史功能")
    print("=" * 60)
    
    # 1. 检查是否有文章
    articles = Article.objects.filter(is_active=True)[:3]
    print(f"\n✅ 找到 {articles.count()} 篇文章")
    
    if not articles.exists():
        print("❌ 没有文章，请先添加文章")
        return False
    
    # 2. 为测试用户创建阅读历史
    test_username = "guest"
    print(f"\n📖 为用户 '{test_username}' 创建阅读历史...")
    
    for article in articles:
        history, created = ReadingHistory.objects.update_or_create(
            article=article,
            username=test_username,
            defaults={
                'user_ip': '127.0.0.1',
                'read_duration': 0
            }
        )
        
        status = "新建" if created else "更新"
        print(f"   {status}: {article.title[:40]}")
    
    # 3. 查询阅读历史
    print(f"\n📊 用户 '{test_username}' 的阅读历史:")
    histories = ReadingHistory.objects.filter(username=test_username).order_by('-read_at')
    
    for i, history in enumerate(histories[:5], 1):
        time_diff = timezone.now() - history.read_at
        if time_diff.seconds < 60:
            time_str = "刚刚"
        elif time_diff.seconds < 3600:
            time_str = f"{time_diff.seconds // 60}分钟前"
        else:
            time_str = f"{time_diff.seconds // 3600}小时前"
        
        print(f"   {i}. {history.article.title[:40]} - {time_str}")
    
    # 4. 测试序列化器
    print(f"\n🔍 测试序列化器...")
    from articles.serializers import ArticleListSerializer
    
    article = articles.first()
    serializer = ArticleListSerializer(
        article, 
        context={'username': test_username}
    )
    data = serializer.data
    
    print(f"   文章: {data['title']}")
    print(f"   阅读信息: {data.get('reading_info')}")
    
    if data.get('reading_info'):
        print("   ✅ 阅读信息正常返回")
    else:
        print("   ⚠️ 阅读信息为空")
    
    # 5. 统计
    total_articles = Article.objects.filter(is_active=True).count()
    read_articles = ReadingHistory.objects.filter(username=test_username).count()
    
    print(f"\n📈 统计信息:")
    print(f"   总文章数: {total_articles}")
    print(f"   已读文章数: {read_articles}")
    print(f"   阅读进度: {read_articles}/{total_articles} ({read_articles*100//max(total_articles,1)}%)")
    
    print("\n" + "=" * 60)
    print("✅ 测试完成！")
    print("=" * 60)
    print("\n💡 下一步:")
    print("1. 打开浏览器访问: http://localhost:8000/articles_manager.html")
    print("2. 切换到 '📖 在读' tab")
    print("3. 应该能看到阅读时间和进度信息")
    print("\n")
    
    return True

if __name__ == '__main__':
    test_reading_history()

