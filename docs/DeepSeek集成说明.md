# DeepSeek AI 集成说明

## 简介

DeepSeek 是一个国产AI大模型服务，提供与 OpenAI 兼容的 API 接口。特别适合国内用户使用。

## 🌟 主要优势

### 1. **国内访问速度快** 🚀
- 服务器部署在国内
- 无需科学上网
- 响应速度比国外服务快

### 2. **价格实惠** 💰
- 比 OpenAI GPT-4 便宜约 90%
- 比 Claude 便宜约 80%
- 提供免费额度供测试使用

### 3. **中文支持优秀** 🇨🇳
- 针对中文场景优化
- 理解中文提示词更准确
- 生成的中英混合内容质量高

### 4. **API 兼容性好** 🔧
- 完全兼容 OpenAI SDK
- 无需额外学习新API
- 迁移成本低

## 📦 快速开始

### 第1步：获取API密钥

1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册并登录账号（支持国内手机号）
3. 进入"API Keys"页面
4. 点击"创建新密钥"
5. 复制生成的 API Key（格式：`sk-...`）

### 第2步：在个人中心配置

1. 打开项目的**个人中心**页面
2. 找到"🤖 AI API 配置"区域
3. 选择服务商：**DeepSeek (国产大模型)**
4. 输入API密钥
5. 点击"测试连接"验证
6. 点击"保存配置"

### 第3步：使用AI生成功能

1. 前往"语法文章"页面
2. 点击"新建文章"
3. 在"🤖 AI 生成内容"区域输入提示词
4. 点击"生成内容"

## 🔧 后端集成（可选）

如果需要在后端直接集成 DeepSeek，可以参考以下配置：

### 安装依赖

```bash
pip install openai  # DeepSeek 兼容 OpenAI SDK
```

### 配置环境变量

在 `.env` 文件中添加：

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 代码示例

```python
import openai
import os

# 配置 DeepSeek
client = openai.OpenAI(
    api_key=os.getenv('DEEPSEEK_API_KEY'),
    base_url=os.getenv('DEEPSEEK_BASE_URL')
)

# 调用 API
response = client.chat.completions.create(
    model="deepseek-chat",  # 或 "deepseek-coder" 用于代码生成
    messages=[
        {
            "role": "system", 
            "content": "You are a helpful assistant that writes English articles for language learners."
        },
        {
            "role": "user", 
            "content": "写一篇关于人工智能的英文文章，适合中级学习者"
        }
    ],
    max_tokens=2000,
    temperature=0.7
)

content = response.choices[0].message.content
print(content)
```

## 🎯 推荐使用场景

### 适合使用 DeepSeek 的情况

✅ 国内用户，需要快速稳定的访问  
✅ 预算有限，希望降低 AI 调用成本  
✅ 需要处理大量中英混合内容  
✅ 文章生成、内容创作类场景  

### 可能需要其他服务的情况

❌ 需要最顶尖的推理能力（考虑 GPT-4 或 Claude）  
❌ 处理复杂的多轮对话任务  
❌ 需要特定领域的专业知识  

## 💡 提示词技巧

### 好的提示词示例

```
写一篇关于可再生能源的英文文章，要求：
1. 适合中级英语学习者（词汇难度B2级别）
2. 包含引言、主体（太阳能、风能、水能）和结论
3. 约600词
4. 使用正式的学术风格
```

### 提高生成质量的技巧

1. **明确目标读者**：指定适合初级/中级/高级学习者
2. **给出结构要求**：说明需要的段落结构
3. **限定长度**：指定大致字数范围
4. **指定风格**：正式/非正式、学术/新闻等

## 📊 价格对比

| 服务商 | 输入价格（/1M tokens） | 输出价格（/1M tokens） |
|--------|----------------------|----------------------|
| **DeepSeek** | ¥1 | ¥2 |
| OpenAI GPT-4 | ¥70 | ¥210 |
| Claude 3.5 | ¥21 | ¥105 |

*价格可能变动，以官网为准*

## ❓ 常见问题

### Q1: DeepSeek 与 OpenAI 的区别？

**A:** DeepSeek 在中文理解、价格、访问速度上有优势，OpenAI 在英文能力和复杂推理上更强。对于英文文章生成场景，两者差异不大。

### Q2: 可以同时配置多个AI服务吗？

**A:** 目前一次只能使用一个AI服务。您可以随时在个人中心切换不同的服务商。

### Q3: API 密钥安全吗？

**A:** API密钥仅存储在您的浏览器本地（localStorage），不会上传到服务器。建议定期更换密钥。

### Q4: 免费额度用完后怎么办？

**A:** 需要在 DeepSeek 平台充值。最低充值金额通常为 ¥10-20。

### Q5: 生成的文章质量如何？

**A:** 对于英语学习文章生成，DeepSeek 的质量很好。但建议生成后进行人工审阅和修改。

## 📚 相关资源

- [DeepSeek 官方网站](https://www.deepseek.com/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [价格页面](https://platform.deepseek.com/pricing)
- [使用教程](https://platform.deepseek.com/docs)

## 🆘 技术支持

如果遇到问题：

1. 查看 [AI生成功能配置说明.md](./AI生成功能配置说明.md)
2. 检查 API 密钥是否正确
3. 确认账户余额是否充足
4. 查看浏览器控制台的错误信息

---

**更新日期**: 2025-10-25  
**版本**: v1.0

