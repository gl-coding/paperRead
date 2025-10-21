#!/usr/bin/env python
"""
添加示例文章到数据库
运行此脚本将自动创建几篇英文文章用于展示
"""

import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from articles.models import Article

# 示例文章数据
SAMPLE_ARTICLES = [
    {
        'title': 'The Future of Artificial Intelligence',
        'content': '''Artificial intelligence has become an integral part of our daily lives. From smartphones to smart homes, AI technology is transforming the way we interact with the world around us. Machine learning algorithms can now recognize patterns, make predictions, and even understand human language with remarkable accuracy.

In healthcare, AI systems are helping doctors diagnose diseases more quickly and accurately. These systems can analyze medical images, identify potential health risks, and suggest treatment options. The technology is not meant to replace human doctors, but rather to augment their capabilities and improve patient outcomes.

The business world has also embraced artificial intelligence. Companies use AI to analyze customer behavior, optimize supply chains, and automate routine tasks. This allows employees to focus on more creative and strategic work, ultimately leading to increased productivity and innovation.

However, the rise of AI also brings important ethical considerations. Questions about privacy, bias in algorithms, and the impact on employment must be carefully addressed. As we continue to develop and deploy AI systems, it is crucial that we do so responsibly and with consideration for all members of society.

Education is another field where AI is making significant contributions. Personalized learning platforms can adapt to individual student needs, providing customized content and feedback. This approach has the potential to make education more accessible and effective for learners of all backgrounds.

Looking forward, the future of artificial intelligence appears boundless. As technology continues to advance, we can expect AI to play an even more prominent role in solving complex global challenges, from climate change to space exploration. The key is to harness this powerful technology in ways that benefit humanity as a whole.''',
        'difficulty': 'intermediate',
        'category': 'Technology',
        'source': 'Tech Insights Magazine'
    },
    {
        'title': 'Climate Change and Our Planet',
        'content': '''Climate change is one of the most pressing challenges facing our planet today. Rising global temperatures, melting ice caps, and extreme weather events are clear indicators that our climate is changing at an unprecedented rate. Scientific evidence shows that human activities, particularly the burning of fossil fuels, are the primary drivers of this change.

The effects of climate change are far-reaching and affect every corner of the globe. Rising sea levels threaten coastal communities, while droughts and floods disrupt agriculture and food security. Biodiversity is at risk as species struggle to adapt to rapidly changing conditions. The impacts are not just environmental – they have significant economic and social consequences as well.

Addressing climate change requires collective action on a global scale. Governments, businesses, and individuals all have a role to play. Transitioning to renewable energy sources, such as solar and wind power, is crucial for reducing greenhouse gas emissions. Energy efficiency improvements in buildings and transportation can also make a significant difference.

Innovation and technology offer hope for the future. Electric vehicles, carbon capture technologies, and sustainable agriculture practices are being developed and implemented around the world. However, technological solutions alone are not enough – we must also change our consumption patterns and lifestyles.

Education and awareness are key to driving change. When people understand the causes and consequences of climate change, they are more likely to take action. Schools, media, and community organizations all play important roles in spreading this knowledge and inspiring action.

The time to act is now. While the challenge is daunting, there are many reasons for optimism. Renewable energy costs are falling, public awareness is growing, and more countries are committing to ambitious climate goals. By working together, we can create a sustainable future for generations to come.''',
        'difficulty': 'intermediate',
        'category': 'Environment',
        'source': 'Environmental Studies Journal'
    },
    {
        'title': 'The Power of Reading',
        'content': '''Reading is one of the most valuable skills a person can develop. It opens doors to new worlds, ideas, and perspectives. Through books, we can travel to distant lands, learn about different cultures, and understand experiences very different from our own.

The benefits of reading extend far beyond entertainment. Research shows that regular reading improves vocabulary, enhances concentration, and strengthens critical thinking skills. When we read, our brains form new neural connections, which can help maintain cognitive function as we age.

Reading also plays a crucial role in developing empathy. When we immerse ourselves in a character's experiences, we learn to see the world through their eyes. This practice of perspective-taking can make us more understanding and compassionate individuals in our daily lives.

In today's digital age, the way we read is changing. E-books, audiobooks, and online articles offer convenient alternatives to traditional printed books. While these formats have their advantages, studies suggest that deep reading – the kind of focused, sustained attention we give to physical books – remains uniquely valuable.

For children, reading is especially important. Early exposure to books helps develop language skills and sets the foundation for academic success. Parents who read to their children regularly are giving them a gift that will benefit them throughout their lives.

Developing a reading habit doesn't have to be difficult. Start with topics that interest you, set aside dedicated reading time each day, and don't be afraid to put down a book that doesn't engage you. The key is to find joy in reading, making it a lifelong companion rather than a chore.''',
        'difficulty': 'beginner',
        'category': 'Education',
        'source': 'Learning Today'
    },
    {
        'title': 'The Digital Revolution in Business',
        'content': '''The digital revolution has fundamentally transformed the business landscape. Companies that once relied on traditional brick-and-mortar operations now find themselves competing in an increasingly digital marketplace. E-commerce platforms have made it possible for businesses of all sizes to reach customers around the world.

Data has become the new currency in the digital economy. Organizations collect vast amounts of information about customer preferences, market trends, and operational efficiency. Those who can effectively analyze and act on this data gain a significant competitive advantage. Big data analytics and business intelligence tools have become essential components of modern business strategy.

Cloud computing has revolutionized how businesses operate. Instead of investing in expensive on-premise infrastructure, companies can now access powerful computing resources on demand. This shift has lowered barriers to entry for startups and enabled established companies to scale more efficiently.

Social media has changed the way businesses communicate with customers. Platforms like Facebook, Twitter, and Instagram provide direct channels for engagement, marketing, and customer service. However, this increased connectivity also means that companies must be more responsive and transparent than ever before.

Automation and robotics are transforming manufacturing and service industries. While some fear job displacement, others see opportunities for workers to focus on higher-value tasks. The key is ensuring that workforce training and education keep pace with technological change.

Cybersecurity has become a critical concern as businesses become more digital. Data breaches and cyber attacks can have devastating consequences. Companies must invest in robust security measures and develop comprehensive strategies to protect their digital assets.

The future of business will be shaped by emerging technologies such as artificial intelligence, blockchain, and the Internet of Things. Organizations that embrace innovation and remain adaptable will be best positioned to thrive in this rapidly evolving environment.''',
        'difficulty': 'advanced',
        'category': 'Business',
        'source': 'Business Innovation Review'
    },
    {
        'title': 'Healthy Eating Habits',
        'content': '''Good nutrition is the foundation of a healthy life. What we eat affects not only our physical health but also our mental well-being and energy levels. Developing healthy eating habits doesn't have to be complicated or restrictive – it's about making informed choices and finding balance.

A balanced diet includes a variety of foods from all food groups. Fruits and vegetables should make up a large portion of our daily intake, providing essential vitamins, minerals, and fiber. Whole grains are better choices than refined grains, as they contain more nutrients and help maintain stable blood sugar levels.

Protein is essential for building and repairing tissues. Good sources include lean meats, fish, eggs, beans, and nuts. It's important to vary protein sources to get a range of nutrients. For those following vegetarian or vegan diets, combining different plant-based proteins ensures adequate amino acid intake.

Hydration is often overlooked but is crucial for health. Water helps regulate body temperature, transport nutrients, and remove waste products. Most people should aim to drink about eight glasses of water per day, though individual needs vary based on activity level and climate.

Meal planning can make healthy eating easier and more sustainable. Preparing meals at home allows better control over ingredients and portion sizes. It also tends to be more economical than eating out frequently. Setting aside time each week to plan meals and prepare ingredients can save time and reduce stress during busy weekdays.

Mindful eating – paying attention to what and how we eat – can help prevent overeating and improve digestion. This means eating slowly, savoring each bite, and listening to hunger and fullness cues. Avoiding distractions like television or smartphones during meals helps us stay present and enjoy our food more fully.

Remember, healthy eating is about progress, not perfection. Small, sustainable changes are more effective than drastic diets that are hard to maintain. Focus on adding nutritious foods rather than just restricting unhealthy ones, and be patient with yourself as you develop new habits.''',
        'difficulty': 'beginner',
        'category': 'Health',
        'source': 'Wellness Today'
    },
    {
        'title': 'The Art of Time Management',
        'content': '''Time is our most valuable resource, yet many of us struggle to use it effectively. Good time management isn't about doing more things – it's about doing the right things and doing them well. By developing better time management skills, we can reduce stress, increase productivity, and create more space for what truly matters.

The first step in effective time management is understanding how you currently spend your time. Keep a time log for a week, recording activities and how long they take. This often reveals surprising patterns and highlights areas where time might be wasted. Common time-wasters include excessive social media use, unnecessary meetings, and poor planning.

Prioritization is crucial. Not all tasks are equally important or urgent. The Eisenhower Matrix is a helpful tool that categorizes tasks into four quadrants: urgent and important, important but not urgent, urgent but not important, and neither urgent nor important. Focus your energy on tasks that are important, whether or not they're urgent.

Goal setting provides direction and motivation. Break large goals into smaller, manageable tasks. This makes them less overwhelming and provides a clear path forward. Setting specific, measurable, achievable, relevant, and time-bound (SMART) goals increases the likelihood of success.

Learn to say no. Taking on too many commitments leads to stress and poor performance. It's important to recognize your limits and protect your time for high-priority activities. Saying no to less important requests allows you to say yes to what truly matters.

Use tools and systems to support your time management efforts. Digital calendars, task management apps, and reminder systems can help keep you organized. However, the specific tools matter less than consistently using them. Find a system that works for you and stick with it.

Finally, remember to schedule time for rest and renewal. Continuous work without breaks leads to burnout and decreased productivity. Regular breaks, adequate sleep, and time for hobbies and relationships are essential for long-term success and well-being.''',
        'difficulty': 'intermediate',
        'category': 'Productivity',
        'source': 'Success Magazine'
    }
]

def add_sample_articles():
    """添加示例文章到数据库"""
    print("=" * 60)
    print("添加示例文章到数据库")
    print("=" * 60)
    print()
    
    # 检查是否已有文章
    existing_count = Article.objects.count()
    print(f"当前数据库中有 {existing_count} 篇文章")
    
    if existing_count > 0:
        response = input("\n数据库中已有文章，是否继续添加示例文章？(y/n): ")
        if response.lower() != 'y':
            print("已取消操作")
            return
    
    print("\n开始添加示例文章...\n")
    
    added = 0
    for article_data in SAMPLE_ARTICLES:
        try:
            # 检查是否已存在相同标题的文章
            if Article.objects.filter(title=article_data['title']).exists():
                print(f"⏭️  跳过: {article_data['title']} (已存在)")
                continue
            
            # 创建文章
            article = Article.objects.create(**article_data)
            print(f"✅ 添加: {article.title}")
            print(f"   - 分类: {article.category}")
            print(f"   - 难度: {article.get_difficulty_display()}")
            print(f"   - 单词数: {article.word_count}")
            print()
            added += 1
            
        except Exception as e:
            print(f"❌ 失败: {article_data['title']}")
            print(f"   错误: {str(e)}\n")
    
    print("=" * 60)
    print(f"✨ 完成！成功添加 {added} 篇文章")
    print(f"📊 数据库中现在共有 {Article.objects.count()} 篇文章")
    print("=" * 60)
    print()
    print("下一步：")
    print("1. 运行: python manage.py runserver")
    print("2. 用浏览器打开: articles_manager.html")
    print("3. 查看文章列表和卡片效果！")
    print()

if __name__ == '__main__':
    try:
        add_sample_articles()
    except KeyboardInterrupt:
        print("\n\n操作已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 发生错误: {str(e)}")
        sys.exit(1)

