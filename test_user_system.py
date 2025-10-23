#!/usr/bin/env python
"""
用户系统功能测试
测试用户名在后端的保存和加载
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from articles.models import Article, Annotation


def test_user_annotations():
    """测试不同用户的标注隔离"""
    
    print("=" * 60)
    print("🧪 用户系统功能测试")
    print("=" * 60)
    
    # 获取第一篇文章
    article = Article.objects.first()
    if not article:
        print("❌ 没有找到文章，请先添加文章")
        return
    
    print(f"\n📖 测试文章: {article.title}")
    print(f"   ID: {article.id}")
    
    # 清除测试数据
    Annotation.objects.filter(user_ip__in=['UserA', 'UserB', 'UserC']).delete()
    print("\n🧹 已清除旧的测试数据")
    
    # 用户A的标注
    print("\n👤 用户A标注单词...")
    Annotation.objects.create(
        article=article,
        user_ip='UserA',  # 存储用户名
        word='important',
        color='#28a745'  # 绿色
    )
    Annotation.objects.create(
        article=article,
        user_ip='UserA',
        word='technology',
        color='#ffc107'  # 黄色
    )
    print("   ✅ UserA 标注了: important (绿色), technology (黄色)")
    
    # 用户B的标注
    print("\n👤 用户B标注单词...")
    Annotation.objects.create(
        article=article,
        user_ip='UserB',
        word='important',
        color='#ff5722'  # 红色
    )
    Annotation.objects.create(
        article=article,
        user_ip='UserB',
        word='computer',
        color='#2196f3'  # 蓝色
    )
    print("   ✅ UserB 标注了: important (红色), computer (蓝色)")
    
    # 用户C的标注
    print("\n👤 用户C标注单词...")
    Annotation.objects.create(
        article=article,
        user_ip='UserC',
        word='learning',
        color='#9c27b0'  # 紫色
    )
    print("   ✅ UserC 标注了: learning (紫色)")
    
    # 验证数据隔离
    print("\n" + "=" * 60)
    print("🔍 验证数据隔离")
    print("=" * 60)
    
    # 查询UserA的标注
    userA_annotations = Annotation.objects.filter(
        article=article,
        user_ip='UserA'
    )
    print(f"\n👤 UserA 的标注 ({userA_annotations.count()} 个):")
    for ann in userA_annotations:
        print(f"   - {ann.word}: {ann.color}")
    
    # 查询UserB的标注
    userB_annotations = Annotation.objects.filter(
        article=article,
        user_ip='UserB'
    )
    print(f"\n👤 UserB 的标注 ({userB_annotations.count()} 个):")
    for ann in userB_annotations:
        print(f"   - {ann.word}: {ann.color}")
    
    # 查询UserC的标注
    userC_annotations = Annotation.objects.filter(
        article=article,
        user_ip='UserC'
    )
    print(f"\n👤 UserC 的标注 ({userC_annotations.count()} 个):")
    for ann in userC_annotations:
        print(f"   - {ann.word}: {ann.color}")
    
    # 验证隔离性
    print("\n" + "=" * 60)
    print("✅ 数据隔离验证")
    print("=" * 60)
    
    assertions = []
    
    # 验证1: UserA应该有2个标注
    if userA_annotations.count() == 2:
        print("✅ UserA 有 2 个标注")
        assertions.append(True)
    else:
        print(f"❌ UserA 应该有 2 个标注，实际有 {userA_annotations.count()} 个")
        assertions.append(False)
    
    # 验证2: UserB应该有2个标注
    if userB_annotations.count() == 2:
        print("✅ UserB 有 2 个标注")
        assertions.append(True)
    else:
        print(f"❌ UserB 应该有 2 个标注，实际有 {userB_annotations.count()} 个")
        assertions.append(False)
    
    # 验证3: UserC应该有1个标注
    if userC_annotations.count() == 1:
        print("✅ UserC 有 1 个标注")
        assertions.append(True)
    else:
        print(f"❌ UserC 应该有 1 个标注，实际有 {userC_annotations.count()} 个")
        assertions.append(False)
    
    # 验证4: important单词对于不同用户有不同颜色
    userA_important = userA_annotations.filter(word='important').first()
    userB_important = userB_annotations.filter(word='important').first()
    
    if userA_important and userB_important:
        if userA_important.color != userB_important.color:
            print(f"✅ 同一单词 'important' 在不同用户下有不同颜色")
            print(f"   UserA: {userA_important.color}")
            print(f"   UserB: {userB_important.color}")
            assertions.append(True)
        else:
            print(f"❌ 同一单词 'important' 在不同用户下颜色相同")
            assertions.append(False)
    else:
        print("❌ 未找到 important 标注")
        assertions.append(False)
    
    # 验证5: technology只在UserA中存在
    if userA_annotations.filter(word='technology').exists():
        if not userB_annotations.filter(word='technology').exists():
            print("✅ technology 只在 UserA 中存在")
            assertions.append(True)
        else:
            print("❌ technology 不应该在 UserB 中存在")
            assertions.append(False)
    else:
        print("❌ UserA 中应该有 technology")
        assertions.append(False)
    
    # 总结
    print("\n" + "=" * 60)
    print("📊 测试总结")
    print("=" * 60)
    
    passed = sum(assertions)
    total = len(assertions)
    
    print(f"\n通过: {passed}/{total}")
    
    if all(assertions):
        print("\n🎉 所有测试通过！用户系统工作正常！")
    else:
        print(f"\n⚠️  有 {total - passed} 个测试失败")
    
    # 清理测试数据
    print("\n🧹 清理测试数据...")
    Annotation.objects.filter(user_ip__in=['UserA', 'UserB', 'UserC']).delete()
    print("✅ 清理完成")
    
    print("\n" + "=" * 60)
    print("测试结束")
    print("=" * 60)


if __name__ == '__main__':
    test_user_annotations()

