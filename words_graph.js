// 全局变量
let currentWord = '';
let relatedWords = [];
let canvas, ctx;

// 示例数据 - 实际应用中应该从后端API获取
// related数组中每个元素现在是对象：{word: '单词', strength: 相似度(0-1)}
const wordDatabase = {
    'learn': {
        pos: '动词',
        meaning: '学习，学会',
        frequency: 156,
        related: [
            {word: 'study', strength: 0.95},
            {word: 'education', strength: 0.85},
            {word: 'knowledge', strength: 0.75},
            {word: 'practice', strength: 0.88},
            {word: 'teach', strength: 0.82},
            {word: 'skill', strength: 0.65},
            {word: 'training', strength: 0.78},
            {word: 'master', strength: 0.55}
        ]
    },
    'study': {
        pos: '动词/名词',
        meaning: '学习，研究',
        frequency: 132,
        related: [
            {word: 'learn', strength: 0.95},
            {word: 'research', strength: 0.90},
            {word: 'examine', strength: 0.70},
            {word: 'analyze', strength: 0.75},
            {word: 'investigate', strength: 0.68},
            {word: 'education', strength: 0.85},
            {word: 'academic', strength: 0.80}
        ]
    },
    'technology': {
        pos: '名词',
        meaning: '技术，科技',
        frequency: 245,
        related: [
            {word: 'innovation', strength: 0.92},
            {word: 'digital', strength: 0.88},
            {word: 'computer', strength: 0.85},
            {word: 'software', strength: 0.80},
            {word: 'science', strength: 0.75},
            {word: 'internet', strength: 0.82},
            {word: 'development', strength: 0.70},
            {word: 'modern', strength: 0.65},
            {word: 'system', strength: 0.58}
        ]
    },
    'innovation': {
        pos: '名词',
        meaning: '创新，革新',
        frequency: 189,
        related: [
            {word: 'technology', strength: 0.92},
            {word: 'creative', strength: 0.88},
            {word: 'invention', strength: 0.90},
            {word: 'progress', strength: 0.78},
            {word: 'development', strength: 0.82},
            {word: 'breakthrough', strength: 0.85},
            {word: 'novel', strength: 0.60}
        ]
    },
    'develop': {
        pos: '动词',
        meaning: '发展，开发',
        frequency: 198,
        related: [
            {word: 'create', strength: 0.85},
            {word: 'build', strength: 0.88},
            {word: 'improve', strength: 0.80},
            {word: 'growth', strength: 0.75},
            {word: 'expand', strength: 0.70},
            {word: 'design', strength: 0.82},
            {word: 'progress', strength: 0.78},
            {word: 'evolve', strength: 0.65}
        ]
    },
    'design': {
        pos: '动词/名词',
        meaning: '设计',
        frequency: 167,
        related: [
            {word: 'create', strength: 0.88},
            {word: 'plan', strength: 0.85},
            {word: 'develop', strength: 0.82},
            {word: 'build', strength: 0.78},
            {word: 'architecture', strength: 0.75},
            {word: 'style', strength: 0.70},
            {word: 'pattern', strength: 0.65},
            {word: 'aesthetic', strength: 0.60}
        ]
    },
    'business': {
        pos: '名词',
        meaning: '商业，生意',
        frequency: 287,
        related: [
            {word: 'commerce', strength: 0.92},
            {word: 'trade', strength: 0.88},
            {word: 'enterprise', strength: 0.85},
            {word: 'company', strength: 0.90},
            {word: 'market', strength: 0.95},
            {word: 'economy', strength: 0.80},
            {word: 'finance', strength: 0.82},
            {word: 'industry', strength: 0.78},
            {word: 'management', strength: 0.75}
        ]
    },
    'market': {
        pos: '名词',
        meaning: '市场',
        frequency: 234,
        related: [
            {word: 'business', strength: 0.95},
            {word: 'economy', strength: 0.88},
            {word: 'trade', strength: 0.90},
            {word: 'commerce', strength: 0.85},
            {word: 'customer', strength: 0.78},
            {word: 'demand', strength: 0.82},
            {word: 'supply', strength: 0.80},
            {word: 'sales', strength: 0.75}
        ]
    },
    'environment': {
        pos: '名词',
        meaning: '环境',
        frequency: 212,
        related: [
            {word: 'nature', strength: 0.90},
            {word: 'ecology', strength: 0.92},
            {word: 'climate', strength: 0.85},
            {word: 'sustainable', strength: 0.95},
            {word: 'pollution', strength: 0.78},
            {word: 'green', strength: 0.82},
            {word: 'conservation', strength: 0.88},
            {word: 'earth', strength: 0.75}
        ]
    },
    'sustainable': {
        pos: '形容词',
        meaning: '可持续的',
        frequency: 143,
        related: [
            {word: 'environment', strength: 0.95},
            {word: 'green', strength: 0.90},
            {word: 'renewable', strength: 0.88},
            {word: 'ecology', strength: 0.85},
            {word: 'conservation', strength: 0.82},
            {word: 'future', strength: 0.70},
            {word: 'responsible', strength: 0.75}
        ]
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取canvas元素
    canvas = document.getElementById('graphCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置canvas大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 绑定事件
    document.getElementById('searchBtn').addEventListener('click', searchWord);
    document.getElementById('wordSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWord();
        }
    });
    document.getElementById('randomBtn').addEventListener('click', showRandomWord);
    document.getElementById('closeDetails').addEventListener('click', hideDetails);
    
    // 初始化单词列表
    initWordList();
    
    // 默认展示一个单词
    const defaultWord = 'technology'; // 可以改为任何你想要的默认单词
    document.getElementById('wordSearch').value = defaultWord;
    displayWordGraph(defaultWord);
});

// 调整canvas大小
function resizeCanvas() {
    const container = document.querySelector('.graph-words');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // 如果有当前单词，重新绘制
    if (currentWord) {
        drawGraph();
    }
}

// 搜索单词
function searchWord() {
    const input = document.getElementById('wordSearch');
    const word = input.value.trim().toLowerCase();
    
    if (!word) {
        alert('请输入一个单词');
        return;
    }
    
    if (wordDatabase[word]) {
        displayWordGraph(word);
    } else {
        alert('未找到该单词，请尝试其他单词\n\n可用单词示例：learn, technology, business, design, environment');
    }
}

// 显示随机单词
function showRandomWord() {
    const words = Object.keys(wordDatabase);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    document.getElementById('wordSearch').value = randomWord;
    displayWordGraph(randomWord);
}

// 显示单词关系图
function displayWordGraph(word) {
    currentWord = word;
    const data = wordDatabase[word];
    relatedWords = data.related; // 现在是对象数组
    
    // 隐藏占位符
    document.getElementById('placeholder').style.display = 'none';
    
    // 绘制图形
    drawGraph();
    
    // 显示单词详情
    showDetails(word, data);
    
    // 更新单词列表中的选中状态
    updateActiveWordItem(word);
}

// 绘制关系图
function drawGraph() {
    const container = document.querySelector('.graph-words');
    const wordsContainer = document.getElementById('graphWords');
    
    // 清空容器
    wordsContainer.innerHTML = '';
    
    // 清空canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算中心点
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 创建中心单词节点
    const currentNode = createWordNode(currentWord, centerX, centerY, true);
    wordsContainer.appendChild(currentNode);
    
    // 计算相关单词的位置（圆形分布）
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    const angleStep = (2 * Math.PI) / relatedWords.length;
    
    // 先创建所有节点
    const nodes = [];
    relatedWords.forEach((item, index) => {
        const angle = angleStep * index - Math.PI / 2; // 从顶部开始
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // 创建相关单词节点
        const node = createWordNode(item.word, x, y, false, index, item.strength);
        wordsContainer.appendChild(node);
        nodes.push({ x, y, angle, strength: item.strength });
    });
    
    // 等待DOM更新后绘制连接线
    setTimeout(() => {
        // 获取中心节点的实际尺寸
        const currentRect = currentNode.getBoundingClientRect();
        const currentRadius = Math.max(currentRect.width, currentRect.height) / 2;
        
        relatedWords.forEach((item, index) => {
            const nodeData = nodes[index];
            
            // 计算连接线的起点（从中心节点边缘开始）
            const startX = centerX + (currentRadius + 5) * Math.cos(nodeData.angle);
            const startY = centerY + (currentRadius + 5) * Math.sin(nodeData.angle);
            
            // 计算连接线的终点（到相关节点边缘）
            const relatedNode = wordsContainer.children[index + 1];
            const relatedRect = relatedNode.getBoundingClientRect();
            const relatedRadius = Math.max(relatedRect.width, relatedRect.height) / 2;
            
            const endX = nodeData.x - (relatedRadius + 5) * Math.cos(nodeData.angle);
            const endY = nodeData.y - (relatedRadius + 5) * Math.sin(nodeData.angle);
            
            // 绘制连接线，传入相似度
            drawConnection(startX, startY, endX, endY, nodeData.strength);
        });
    }, 50);
}

// 创建单词节点
function createWordNode(word, x, y, isCurrent, index = 0, strength = 1) {
    const node = document.createElement('div');
    
    if (isCurrent) {
        node.className = 'word-node current';
    } else {
        // 根据相似度设置不同的class
        let strengthClass = 'strength-low';
        if (strength >= 0.8) {
            strengthClass = 'strength-high';
        } else if (strength >= 0.65) {
            strengthClass = 'strength-medium';
        }
        node.className = `word-node related ${strengthClass}`;
        node.style.setProperty('--index', index);
    }
    
    node.textContent = word;
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    
    // 添加点击事件
    node.addEventListener('click', function() {
        if (wordDatabase[word]) {
            displayWordGraph(word);
            document.getElementById('wordSearch').value = word;
        }
    });
    
    return node;
}

// 绘制连接线
function drawConnection(x1, y1, x2, y2, strength) {
    // 根据相似度选择颜色
    let color1, color2, alpha;
    if (strength >= 0.8) {
        color1 = '#06beb6';
        color2 = '#48b1bf';
        alpha = 0.4;
    } else if (strength >= 0.65) {
        color1 = '#a18cd1';
        color2 = '#fbc2eb';
        alpha = 0.35;
    } else {
        color1 = '#ffa751';
        color2 = '#ffe259';
        alpha = 0.3;
    }
    
    // 使用渐变色
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, color2);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // 绘制箭头
    drawArrow(x1, y1, x2, y2, color2);
}

// 绘制箭头
function drawArrow(x1, y1, x2, y2, color) {
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // 箭头位置在线的70%处
    const arrowX = x1 + (x2 - x1) * 0.7;
    const arrowY = y1 + (y2 - y1) * 0.7;
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
        arrowX - headlen * Math.cos(angle - Math.PI / 6),
        arrowY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
        arrowX - headlen * Math.cos(angle + Math.PI / 6),
        arrowY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
}

// 显示单词详情
function showDetails(word, data) {
    document.getElementById('detailsWord').textContent = word;
    document.getElementById('detailsPOS').textContent = data.pos;
    document.getElementById('detailsMeaning').textContent = data.meaning;
    document.getElementById('detailsFreq').textContent = data.frequency;
    document.getElementById('detailsRelated').textContent = data.related.length;
    
    const detailsPanel = document.getElementById('wordDetails');
    detailsPanel.style.display = 'block';
}

// 隐藏详情面板
function hideDetails() {
    document.getElementById('wordDetails').style.display = 'none';
}


// 初始化单词列表
function initWordList() {
    const wordListContainer = document.getElementById('wordList');
    wordListContainer.innerHTML = '';
    
    // 按频率排序单词
    const sortedWords = Object.entries(wordDatabase).sort((a, b) => {
        return b[1].frequency - a[1].frequency;
    });
    
    // 创建单词列表项
    sortedWords.forEach(([word, data]) => {
        const wordItem = createWordListItem(word, data);
        wordListContainer.appendChild(wordItem);
    });
}

// 创建单词列表项
function createWordListItem(word, data) {
    const item = document.createElement('div');
    item.className = 'word-item';
    item.dataset.word = word;
    
    item.innerHTML = `
        <div class="word-item-header">
            <span class="word-item-word">${word}</span>
            <span class="word-item-badge">${data.pos}</span>
        </div>
        <div class="word-item-meaning">${data.meaning}</div>
        <div class="word-item-stats">
            <span>📊 ${data.frequency}次</span>
            <span>🔗 ${data.related.length}个</span>
        </div>
    `;
    
    // 点击事件
    item.addEventListener('click', function() {
        document.getElementById('wordSearch').value = word;
        displayWordGraph(word);
        updateActiveWordItem(word);
    });
    
    return item;
}

// 更新活动单词项
function updateActiveWordItem(word) {
    // 移除所有active类
    document.querySelectorAll('.word-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 添加active类到当前单词
    const activeItem = document.querySelector(`.word-item[data-word="${word}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        // 滚动到可见区域
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 处理窗口大小变化
window.addEventListener('resize', function() {
    if (currentWord) {
        drawGraph();
    }
});

