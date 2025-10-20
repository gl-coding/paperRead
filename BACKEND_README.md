# 英文文章阅读器 - Django后端

## 📚 功能概述

这是一个基于Django + Django REST Framework的后端API，用于管理英文文章和用户阅读数据。

### 主要功能

1. **文章管理**
   - 增删改查文章
   - 文章分类和难度分级
   - 自动统计单词数
   - 搜索和筛选功能

2. **阅读历史**
   - 记录用户阅读时间
   - 追踪阅读时长

3. **标注管理**
   - 保存用户的彩色标注
   - 按用户IP区分数据

## 🗄️ 数据库模型

### Article (文章)
- `title`: 标题
- `content`: 文章内容
- `source`: 来源
- `difficulty`: 难度（初级/中级/高级）
- `category`: 分类
- `word_count`: 单词数（自动计算）
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `is_active`: 是否启用

### ReadingHistory (阅读历史)
- `article`: 关联文章
- `user_ip`: 用户IP
- `read_at`: 阅读时间
- `read_duration`: 阅读时长（秒）

### Annotation (标注)
- `article`: 关联文章
- `user_ip`: 用户IP
- `word`: 单词
- `color`: 标注颜色
- `created_at`: 创建时间

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 数据库迁移

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. 创建超级用户

```bash
python manage.py createsuperuser
```

### 4. 运行开发服务器

```bash
python manage.py runserver
```

服务器将运行在：http://localhost:8000

## 📡 API端点

### 文章相关

- `GET /api/articles/` - 获取文章列表
- `POST /api/articles/` - 创建文章
- `GET /api/articles/{id}/` - 获取文章详情
- `PUT /api/articles/{id}/` - 更新文章
- `DELETE /api/articles/{id}/` - 删除文章
- `POST /api/articles/{id}/record_reading/` - 记录阅读历史
- `GET /api/articles/{id}/annotations/` - 获取文章标注
- `POST /api/articles/{id}/save_annotations/` - 保存文章标注

### 查询参数

- `search`: 搜索标题或内容
- `difficulty`: 筛选难度（beginner/intermediate/advanced）
- `category`: 筛选分类
- `page`: 页码
- `page_size`: 每页数量

### 阅读历史

- `GET /api/history/` - 获取当前用户的阅读历史

### 标注管理

- `GET /api/annotations/` - 获取当前用户的所有标注
- `POST /api/annotations/` - 创建标注
- `DELETE /api/annotations/{id}/` - 删除标注

## 🔧 API使用示例

### 获取文章列表

```javascript
fetch('http://localhost:8000/api/articles/')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 获取文章详情

```javascript
fetch('http://localhost:8000/api/articles/1/')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 记录阅读

```javascript
fetch('http://localhost:8000/api/articles/1/record_reading/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    read_duration: 300  // 阅读了300秒
  })
});
```

### 保存标注

```javascript
fetch('http://localhost:8000/api/articles/1/save_annotations/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    annotations: [
      { word: 'intelligence', color: '#28a745' },
      { word: 'technology', color: '#ffc107' }
    ]
  })
});
```

### 获取文章的标注

```javascript
fetch('http://localhost:8000/api/articles/1/annotations/')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🎯 管理后台

访问 http://localhost:8000/admin/ 可以管理：
- 文章
- 阅读历史
- 用户标注

## 📝 创建示例文章

可以通过管理后台或API创建文章。示例：

```python
# 通过Django shell创建
python manage.py shell

from articles.models import Article

article = Article.objects.create(
    title="The Future of AI",
    content="Artificial intelligence is rapidly evolving...",
    difficulty="intermediate",
    category="Technology"
)
```

## 🔐 安全配置

生产环境需要修改：

1. `settings.py` 中的 `SECRET_KEY`
2. `DEBUG = False`
3. 配置 `ALLOWED_HOSTS`
4. 配置具体的 CORS 域名（不要用 `CORS_ALLOW_ALL_ORIGINS = True`）

## 📊 数据库

默认使用 SQLite，生产环境建议使用 PostgreSQL 或 MySQL。

修改 `settings.py` 中的 `DATABASES` 配置即可。

## 🛠️ 开发建议

1. 使用虚拟环境
2. 定期备份数据库
3. 编写API文档
4. 添加单元测试
5. 配置日志系统

## 📞 联系方式

如有问题，请查看Django和DRF官方文档。

