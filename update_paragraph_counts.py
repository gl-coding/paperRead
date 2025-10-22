#!/usr/bin/env python
"""
更新所有现有文章的段落数
运行方式: python update_paragraph_counts.py
"""
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from articles.models import Article

def update_paragraph_counts():
    """更新所有文章的段落数据（包含段落数组）"""
    articles = Article.objects.all()
    total = articles.count()
    updated = 0
    
    print(f"开始更新 {total} 篇文章的段落数据...")
    print("-" * 50)
    
    for article in articles:
        if article.content:
            paragraphs = [p.strip() for p in article.content.split('\n\n') if p.strip()]
            article.paragraph_count = len(paragraphs)
            article.paragraphs = paragraphs  # 存储段落数组
            article.save()
            updated += 1
            print(f"✓ [{updated}/{total}] {article.title[:40]}... 段落数: {len(paragraphs)}, 已存储段落数据")
        else:
            print(f"⊗ [{updated}/{total}] {article.title[:40]}... (无内容)")
    
    print("-" * 50)
    print(f"✅ 更新完成！共更新 {updated} 篇文章")
    print(f"   所有文章的段落数据已存储到数据库")

if __name__ == '__main__':
    update_paragraph_counts()

