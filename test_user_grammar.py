#!/usr/bin/env python3
"""测试用户语法文章功能"""
import os
import django
import sys

# 设置Django环境
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from articles.models import UserGrammarArticle

def test_user_grammar_articles():
    """测试用户语法文章"""
    print("=" * 60)
    print("测试用户语法文章功能")
    print("=" * 60)
    
    # 1. 查看当前所有用户语法文章
    all_articles = UserGrammarArticle.objects.all()
    print(f"\n📊 总共有 {all_articles.count()} 篇用户语法文章")
    
    if all_articles.exists():
        print("\n文章列表：")
        for article in all_articles:
            print(f"  - ID: {article.id}")
            print(f"    标题: {article.title}")
            print(f"    作者: {article.author}")
            print(f"    难度: {article.difficulty}")
            print(f"    分类: {article.category or '未分类'}")
            print(f"    字数: {article.word_count}")
            print(f"    创建时间: {article.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print()
    
    # 2. 按作者分组统计
    authors = UserGrammarArticle.objects.values_list('author', flat=True).distinct()
    print(f"\n👥 共有 {len(authors)} 个用户创建了文章：")
    for author in authors:
        count = UserGrammarArticle.objects.filter(author=author).count()
        print(f"  - {author}: {count} 篇")
    
    # 3. 创建测试文章（如果没有的话）
    test_users = ['guest', 'user1', 'user2']
    for username in test_users:
        existing = UserGrammarArticle.objects.filter(author=username).first()
        if not existing:
            article = UserGrammarArticle.objects.create(
                title=f"{username}的语法笔记",
                content=f"This is a grammar note by {username}.\n\nPresent Perfect Tense is used for actions that happened at an unspecified time before now.",
                difficulty='intermediate',
                category='时态',
                author=username
            )
            print(f"\n✅ 为 {username} 创建了测试文章（ID: {article.id}）")
    
    # 4. 验证每个用户只能看到自己的文章
    print("\n" + "=" * 60)
    print("验证数据隔离")
    print("=" * 60)
    for username in test_users:
        user_articles = UserGrammarArticle.objects.filter(author=username)
        print(f"\n用户 '{username}' 的文章：")
        if user_articles.exists():
            for article in user_articles:
                print(f"  ✓ {article.title}")
        else:
            print("  （无）")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)
    print("\n💡 提示：")
    print("1. 确保前端localStorage中设置了正确的用户名：")
    print("   localStorage.setItem('paperread_username', 'guest')")
    print("\n2. 检查浏览器开发者工具的Network标签")
    print("   查看API请求是否正确发送到 /api/user-grammar-articles/")
    print("\n3. 查看API响应中的author字段是否正确")

if __name__ == '__main__':
    test_user_grammar_articles()

