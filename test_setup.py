#!/usr/bin/env python
"""
测试系统设置是否正确
运行此脚本检查Django配置和依赖项
"""

import sys
import os

def test_django_import():
    """测试Django是否已安装"""
    try:
        import django
        print(f"✅ Django 已安装 (版本: {django.get_version()})")
        return True
    except ImportError:
        print("❌ Django 未安装")
        print("   请运行: pip install Django")
        return False

def test_rest_framework():
    """测试Django REST Framework是否已安装"""
    try:
        import rest_framework
        print(f"✅ Django REST Framework 已安装 (版本: {rest_framework.__version__})")
        return True
    except ImportError:
        print("❌ Django REST Framework 未安装")
        print("   请运行: pip install djangorestframework")
        return False

def test_cors_headers():
    """测试django-cors-headers是否已安装"""
    try:
        import corsheaders
        print(f"✅ django-cors-headers 已安装")
        return True
    except ImportError:
        print("❌ django-cors-headers 未安装")
        print("   请运行: pip install django-cors-headers")
        return False

def test_django_setup():
    """测试Django项目配置"""
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        import django
        django.setup()
        print("✅ Django 项目配置正确")
        return True
    except Exception as e:
        print(f"❌ Django 项目配置错误: {e}")
        return False

def test_models():
    """测试模型是否可以导入"""
    try:
        from articles.models import Article, ReadingHistory, Annotation
        print("✅ 数据模型导入成功")
        return True
    except Exception as e:
        print(f"❌ 数据模型导入失败: {e}")
        return False

def test_database():
    """测试数据库连接"""
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ 数据库连接成功")
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        print("   可能需要运行: python manage.py migrate")
        return False

def main():
    print("=" * 50)
    print("🔍 检查系统设置")
    print("=" * 50)
    print()
    
    results = []
    
    # 检查依赖
    print("📦 检查依赖包...")
    results.append(test_django_import())
    results.append(test_rest_framework())
    results.append(test_cors_headers())
    print()
    
    # 如果依赖都安装了，继续检查Django配置
    if all(results):
        print("⚙️  检查Django配置...")
        results.append(test_django_setup())
        
        if results[-1]:
            results.append(test_models())
            results.append(test_database())
        print()
    
    # 总结
    print("=" * 50)
    if all(results):
        print("✅ 所有检查通过！系统配置正确。")
        print()
        print("🎉 可以开始使用了！")
        print()
        print("下一步：")
        print("1. 运行: python manage.py runserver")
        print("2. 用浏览器打开: articles_manager.html")
    else:
        print("❌ 部分检查未通过，请按照上述提示修复。")
        print()
        print("如果需要安装所有依赖，运行：")
        print("pip install -r requirements.txt")
        print()
        print("如果需要初始化数据库，运行：")
        print("python manage.py makemigrations")
        print("python manage.py migrate")
    print("=" * 50)

if __name__ == '__main__':
    main()

