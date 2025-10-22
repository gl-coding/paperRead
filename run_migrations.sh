#!/bin/bash
# 运行数据库迁移脚本

echo "==================================="
echo "开始运行数据库迁移..."
echo "==================================="

# 激活虚拟环境（如果有）
# source venv/bin/activate

# 创建迁移文件
echo ""
echo "步骤 1: 创建迁移文件..."
python manage.py makemigrations

# 应用迁移
echo ""
echo "步骤 2: 应用迁移..."
python manage.py migrate

echo ""
echo "==================================="
echo "迁移完成！"
echo "==================================="
echo ""
echo "现在可以运行服务器："
echo "  python manage.py runserver"
echo ""

