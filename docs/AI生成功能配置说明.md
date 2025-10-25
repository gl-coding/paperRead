# AI生成功能配置说明

## 功能概述

在"语法文章"页面的新建文章模态框中，添加了AI提示词生成功能。用户可以输入提示词，系统会调用大模型API生成英文文章内容。

## 使用方法

1. 点击"新建文章"按钮
2. 在"🤖 AI 生成内容"区域输入提示词
3. 点击"✨ 生成内容"按钮
4. 等待生成完成后，内容会自动填充到文章内容框中

## 配置AI API

### 当前状态

目前系统返回的是**示例内容**，需要配置真实的AI API才能使用实际的生成功能。

### 配置步骤

#### 方法1: 使用 OpenAI API

1. **安装依赖**
```bash
pip install openai
```

2. **获取API密钥**
   - 访问 https://platform.openai.com/
   - 注册账号并获取API Key

3. **配置密钥**

在 `backend/settings.py` 中添加：
```python
# OpenAI API配置
OPENAI_API_KEY = 'your-api-key-here'
```

4. **修改代码**

在 `articles/views.py` 的 `generate_content` 方法中，取消注释OpenAI部分：

```python
import openai
from django.conf import settings

@action(detail=False, methods=['post'])
def generate_content(self, request):
    prompt = request.data.get('prompt', '').strip()
    
    if not prompt:
        return Response({
            'error': '提示词不能为空'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        openai.api_key = settings.OPENAI_API_KEY
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # 或使用 "gpt-4"
            messages=[
                {"role": "system", "content": "You are a helpful assistant that writes English articles for language learners. Write clear, well-structured articles."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        content = response.choices[0].message.content
        
        return Response({
            'content': content,
            'prompt': prompt
        })
    except Exception as e:
        return Response({
            'error': f'生成失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

#### 方法2: 使用 Anthropic Claude API

1. **安装依赖**
```bash
pip install anthropic
```

2. **获取API密钥**
   - 访问 https://console.anthropic.com/
   - 注册账号并获取API Key

3. **配置密钥**

在 `backend/settings.py` 中添加：
```python
# Anthropic Claude API配置
ANTHROPIC_API_KEY = 'your-api-key-here'
```

4. **修改代码**

```python
import anthropic
from django.conf import settings

@action(detail=False, methods=['post'])
def generate_content(self, request):
    prompt = request.data.get('prompt', '').strip()
    
    if not prompt:
        return Response({
            'error': '提示词不能为空'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-3-sonnet-20240229",  # 或使用其他模型
            max_tokens=2000,
            messages=[
                {"role": "user", "content": f"Write an English article for language learners based on this prompt: {prompt}"}
            ]
        )
        content = message.content[0].text
        
        return Response({
            'content': content,
            'prompt': prompt
        })
    except Exception as e:
        return Response({
            'error': f'生成失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

#### 方法3: 使用 DeepSeek API（推荐国内用户）

1. **安装依赖**
```bash
pip install openai  # DeepSeek兼容OpenAI SDK
```

2. **获取API密钥**
   - 访问 https://platform.deepseek.com/
   - 注册账号并获取API Key

3. **配置密钥**

在 `backend/settings.py` 中添加：
```python
# DeepSeek API配置
DEEPSEEK_API_KEY = 'sk-...'
DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
```

4. **修改代码**

```python
import openai
from django.conf import settings

@action(detail=False, methods=['post'])
def generate_content(self, request):
    prompt = request.data.get('prompt', '').strip()
    
    if not prompt:
        return Response({
            'error': '提示词不能为空'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        client = openai.OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL
        )
        
        response = client.chat.completions.create(
            model="deepseek-chat",  # 或 "deepseek-coder"
            messages=[
                {"role": "system", "content": "You are a helpful assistant that writes English articles for language learners."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        content = response.choices[0].message.content
        
        return Response({
            'content': content,
            'prompt': prompt
        })
    except Exception as e:
        return Response({
            'error': f'生成失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**DeepSeek优势：**
- 🚀 国内访问速度快
- 💰 价格实惠（比OpenAI便宜）
- 🇨🇳 中文支持优秀
- 🔧 兼容OpenAI API

#### 方法4: 使用其他AI API

您也可以集成其他AI服务：
- **Google Gemini API**
- **百度文心一言**
- **阿里通义千问**
- **自部署的本地大模型**

集成步骤类似：
1. 安装对应的SDK
2. 配置API密钥
3. 调用API并返回生成内容

## 提示词建议

为了获得更好的生成效果，建议提示词包含以下信息：

- **主题**: 文章的主要内容
- **难度**: 适合初级/中级/高级学习者
- **长度**: 大致的字数要求
- **风格**: 正式/非正式，科普/新闻等

### 示例提示词

**好的提示词：**
```
写一篇关于人工智能发展历史的英文文章，适合中级英语学习者，约500词，包含引言、主体和结论三部分
```

**不好的提示词：**
```
AI
```

## 安全建议

1. **不要在代码中硬编码API密钥**
   - 使用环境变量或配置文件
   - 将包含密钥的文件添加到 `.gitignore`

2. **设置使用限制**
   - 添加请求频率限制
   - 监控API使用量和成本
   - 考虑添加用户认证

3. **示例：使用环境变量**

```python
# backend/settings.py
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
```

创建 `.env` 文件（不要提交到Git）：
```
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 功能增强建议

1. **添加多种生成选项**
   - 选择文章类型（新闻、故事、科普等）
   - 选择难度级别
   - 自定义长度

2. **历史记录**
   - 保存用户的提示词历史
   - 保存生成的内容供后续编辑

3. **内容优化**
   - 添加语法检查
   - 词汇难度分析
   - 自动分段

4. **成本控制**
   - 添加每日生成次数限制
   - 记录API调用统计
   - 实现缓存机制

## 故障排除

### 问题1: 生成失败
**可能原因：**
- API密钥未配置或无效
- 网络连接问题
- API配额用完

**解决方法：**
- 检查API密钥是否正确
- 确认网络连接正常
- 查看API提供商的使用情况

### 问题2: 生成内容质量差
**可能原因：**
- 提示词不够清晰
- 模型选择不合适

**解决方法：**
- 改进提示词描述
- 尝试不同的模型
- 调整temperature等参数

## 版本历史

- **v1.0** (2025-10-24): 初始版本，支持AI生成文章内容

