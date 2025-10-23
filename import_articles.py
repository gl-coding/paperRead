#!/usr/bin/env python
"""
文章导入脚本
支持单个文件或批量导入文章/书籍到数据库

使用方法：
1. 导入单个文件：
   python import_articles.py --file article.txt

2. 批量导入目录：
   python import_articles.py --dir ./articles/

3. 指定元数据：
   python import_articles.py --file book.txt --title "书名" --category "技术" --difficulty advanced

4. 自动检测书籍章节：
   python import_articles.py --file book.txt --detect-chapters
"""
import os
import sys
import django
import argparse
import re
from pathlib import Path

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from articles.models import Article


class ArticleImporter:
    """文章导入器"""
    
    DIFFICULTY_CHOICES = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '高级'
    }
    
    def __init__(self):
        self.imported_count = 0
        self.failed_count = 0
        self.skipped_count = 0
    
    def read_file(self, file_path):
        """读取文件内容，自动检测编码"""
        encodings = ['utf-8', 'gbk', 'gb2312', 'utf-16']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"✓ 使用编码 {encoding} 成功读取文件")
                return content
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"✗ 读取文件失败: {e}")
                return None
        
        print(f"✗ 无法识别文件编码，尝试的编码: {encodings}")
        return None
    
    def extract_title(self, content, filename):
        """从内容或文件名提取标题"""
        # 尝试从第一行提取标题
        lines = content.strip().split('\n')
        if lines:
            first_line = lines[0].strip()
            # 如果第一行很短且不像段落，可能是标题
            if len(first_line) < 100 and not first_line.endswith('.'):
                return first_line
        
        # 使用文件名作为标题
        return Path(filename).stem.replace('_', ' ').replace('-', ' ').title()
    
    def detect_category(self, content, title):
        """自动检测文章分类"""
        keywords = {
            '技术': ['technology', 'programming', 'software', 'computer', 'AI', 'machine learning'],
            '科学': ['science', 'research', 'study', 'experiment'],
            '商业': ['business', 'marketing', 'management', 'economy'],
            '健康': ['health', 'medical', 'wellness', 'fitness'],
            '教育': ['education', 'learning', 'teaching', 'study'],
            '文学': ['literature', 'novel', 'story', 'fiction'],
            '新闻': ['news', 'report', 'current', 'event'],
        }
        
        text = (content + ' ' + title).lower()
        
        for category, words in keywords.items():
            for word in words:
                if word.lower() in text:
                    return category
        
        return '其他'
    
    def detect_difficulty(self, content):
        """自动检测文章难度"""
        # 简单的难度判断：基于词汇复杂度和句子长度
        words = re.findall(r'\b[a-zA-Z]+\b', content)
        if not words:
            return 'intermediate'
        
        # 平均单词长度
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        if avg_word_length < 5:
            return 'beginner'
        elif avg_word_length < 6.5:
            return 'intermediate'
        else:
            return 'advanced'
    
    def clean_content(self, content):
        """清理文章内容"""
        # 移除多余的空行
        content = re.sub(r'\n{3,}', '\n\n', content)
        # 移除首尾空白
        content = content.strip()
        return content
    
    def import_article(self, file_path, title=None, category=None, difficulty=None, source=None):
        """导入单篇文章"""
        print(f"\n{'='*60}")
        print(f"📖 正在导入: {file_path}")
        print(f"{'='*60}")
        
        # 读取文件
        content = self.read_file(file_path)
        if not content:
            print(f"✗ 跳过文件: {file_path}")
            self.failed_count += 1
            return False
        
        # 清理内容
        content = self.clean_content(content)
        
        # 提取或使用指定的元数据
        article_title = title or self.extract_title(content, file_path)
        article_category = category or self.detect_category(content, article_title)
        article_difficulty = difficulty or self.detect_difficulty(content)
        article_source = source or f"导入自: {Path(file_path).name}"
        
        # 检查是否已存在
        existing = Article.objects.filter(title=article_title).first()
        if existing:
            print(f"⚠ 文章已存在: {article_title}")
            choice = input("是否覆盖? (y/n): ").lower()
            if choice != 'y':
                print(f"✗ 已跳过")
                self.skipped_count += 1
                return False
            else:
                existing.delete()
                print(f"✓ 已删除旧版本")
        
        # 创建文章
        try:
            article = Article.objects.create(
                title=article_title,
                content=content,
                category=article_category,
                difficulty=article_difficulty,
                source=article_source
            )
            
            print(f"\n✓ 导入成功!")
            print(f"  标题: {article.title}")
            print(f"  分类: {article.category}")
            print(f"  难度: {self.DIFFICULTY_CHOICES.get(article.difficulty, article.difficulty)}")
            print(f"  单词数: {article.word_count}")
            print(f"  段落数: {article.paragraph_count}")
            print(f"  ID: {article.id}")
            
            self.imported_count += 1
            return True
            
        except Exception as e:
            print(f"✗ 导入失败: {e}")
            self.failed_count += 1
            return False
    
    def import_directory(self, dir_path, pattern='*.txt', **kwargs):
        """批量导入目录中的文章"""
        dir_path = Path(dir_path)
        
        if not dir_path.exists():
            print(f"✗ 目录不存在: {dir_path}")
            return
        
        # 查找所有匹配的文件
        files = list(dir_path.glob(pattern))
        
        if not files:
            print(f"✗ 未找到匹配的文件: {dir_path}/{pattern}")
            return
        
        print(f"\n找到 {len(files)} 个文件")
        print(f"{'='*60}\n")
        
        for file_path in files:
            self.import_article(str(file_path), **kwargs)
        
        self.print_summary()
    
    def detect_and_import_book_chapters(self, file_path, **kwargs):
        """检测书籍章节并分章节导入"""
        print(f"\n📚 检测书籍章节: {file_path}")
        
        content = self.read_file(file_path)
        if not content:
            return
        
        # 尝试按章节分割
        # 常见章节标记: Chapter 1, 第一章, CHAPTER ONE, etc.
        chapter_patterns = [
            r'Chapter\s+\d+',
            r'CHAPTER\s+\d+',
            r'第[一二三四五六七八九十百]+章',
            r'\d+\.\s+[A-Z]',  # 1. Introduction
        ]
        
        chapters = []
        for pattern in chapter_patterns:
            matches = list(re.finditer(pattern, content, re.IGNORECASE))
            if len(matches) > 1:  # 至少2章才认为是书籍
                print(f"✓ 检测到 {len(matches)} 个章节 (模式: {pattern})")
                
                for i, match in enumerate(matches):
                    start = match.start()
                    end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
                    chapter_content = content[start:end].strip()
                    chapter_title = match.group()
                    
                    chapters.append({
                        'title': chapter_title,
                        'content': chapter_content
                    })
                break
        
        if not chapters:
            print(f"⚠ 未检测到章节标记，作为单篇文章导入")
            return self.import_article(file_path, **kwargs)
        
        # 导入各章节
        book_title = kwargs.get('title', Path(file_path).stem)
        
        for i, chapter in enumerate(chapters, 1):
            chapter_kwargs = kwargs.copy()
            chapter_kwargs['title'] = f"{book_title} - {chapter['title']}"
            
            # 临时保存章节内容
            temp_file = f"/tmp/chapter_{i}.txt"
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(chapter['content'])
            
            self.import_article(temp_file, **chapter_kwargs)
            os.remove(temp_file)
        
        self.print_summary()
    
    def print_summary(self):
        """打印导入摘要"""
        total = self.imported_count + self.failed_count + self.skipped_count
        
        print(f"\n{'='*60}")
        print(f"📊 导入摘要")
        print(f"{'='*60}")
        print(f"  总计: {total}")
        print(f"  ✓ 成功: {self.imported_count}")
        print(f"  ✗ 失败: {self.failed_count}")
        print(f"  ⊗ 跳过: {self.skipped_count}")
        print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='导入文章或书籍到数据库',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 导入单个文件
  python import_articles.py --file article.txt
  
  # 导入并指定元数据
  python import_articles.py --file article.txt --title "文章标题" --category "技术" --difficulty advanced
  
  # 批量导入目录
  python import_articles.py --dir ./articles/ --category "科学"
  
  # 导入书籍（自动检测章节）
  python import_articles.py --file book.txt --detect-chapters --title "书名"
        """
    )
    
    # 输入源
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--file', '-f', help='单个文件路径')
    input_group.add_argument('--dir', '-d', help='目录路径（批量导入）')
    
    # 元数据
    parser.add_argument('--title', '-t', help='文章标题（不指定则自动提取）')
    parser.add_argument('--category', '-c', help='文章分类（不指定则自动检测）')
    parser.add_argument('--difficulty', choices=['beginner', 'intermediate', 'advanced'],
                       help='难度级别（不指定则自动判断）')
    parser.add_argument('--source', '-s', help='文章来源')
    
    # 批量导入选项
    parser.add_argument('--pattern', '-p', default='*.txt',
                       help='文件匹配模式（仅用于目录导入，默认: *.txt）')
    
    # 书籍选项
    parser.add_argument('--detect-chapters', action='store_true',
                       help='自动检测并按章节导入书籍')
    
    args = parser.parse_args()
    
    importer = ArticleImporter()
    
    # 准备参数
    kwargs = {}
    if args.title:
        kwargs['title'] = args.title
    if args.category:
        kwargs['category'] = args.category
    if args.difficulty:
        kwargs['difficulty'] = args.difficulty
    if args.source:
        kwargs['source'] = args.source
    
    # 执行导入
    if args.file:
        if args.detect_chapters:
            importer.detect_and_import_book_chapters(args.file, **kwargs)
        else:
            importer.import_article(args.file, **kwargs)
            importer.print_summary()
    elif args.dir:
        importer.import_directory(args.dir, pattern=args.pattern, **kwargs)


if __name__ == '__main__':
    main()

