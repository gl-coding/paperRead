// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 全局变量
let wordsData = new Map(); // 存储单词及其频率
let currentFilter = 'all';
let currentArticleText = ''; // 存储当前文章文本
let currentArticleId = null; // 当前文章ID
let translationCache = new Map(); // 缓存翻译结果
let annotatedWords = new Map(); // 存储标注的单词及其颜色 {word: color}
let annotationMode = false; // 标注模式开关
let translationMode = false; // 翻译模式开关
let currentAnnotationColor = '#28a745'; // 当前选择的标注颜色（默认绿色）
let translatedWords = new Set(); // 存储已翻译的单词
let wordTranslations = new Map(); // 存储单词翻译缓存 {word: translation}
let annotationsHidden = false; // 标注隐藏状态
let translationsHidden = false; // 翻译隐藏状态

// DOM元素
const articleDisplay = document.getElementById('articleDisplay');
const wordList = document.getElementById('wordList');
const wordCount = document.getElementById('wordCount');
const uniqueWordCount = document.getElementById('uniqueWordCount');
const translateBtn = document.getElementById('translateBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const toggleAnnotationsBtn = document.getElementById('toggleAnnotationsBtn');
const toggleTranslationsBtn = document.getElementById('toggleTranslationsBtn');
const annotationModeToggle = document.getElementById('annotationModeToggle');
const translationModeToggle = document.getElementById('translationModeToggle');
const colorPicker = document.getElementById('colorPicker');
const colorBtns = document.querySelectorAll('.color-btn');
const filterRadios = document.querySelectorAll('input[name="filter"]');

// 示例文章
const sampleArticle = `The Importance of Artificial Intelligence in Modern Society

Artificial intelligence has become an integral part of our daily lives. From smartphones to smart homes, AI technology is transforming the way we interact with the world around us. Machine learning algorithms can now recognize patterns, make predictions, and even understand human language with remarkable accuracy.

In healthcare, AI systems are helping doctors diagnose diseases more quickly and accurately. These systems can analyze medical images, identify potential health risks, and suggest treatment options. The technology is not meant to replace human doctors, but rather to augment their capabilities and improve patient outcomes.

The business world has also embraced artificial intelligence. Companies use AI to analyze customer behavior, optimize supply chains, and automate routine tasks. This allows employees to focus on more creative and strategic work, ultimately leading to increased productivity and innovation.

However, the rise of AI also brings important ethical considerations. Questions about privacy, bias in algorithms, and the impact on employment must be carefully addressed. As we continue to develop and deploy AI systems, it is crucial that we do so responsibly and with consideration for all members of society.

Education is another field where AI is making significant contributions. Personalized learning platforms can adapt to individual student needs, providing customized content and feedback. This approach has the potential to make education more accessible and effective for learners of all backgrounds.

Looking forward, the future of artificial intelligence appears boundless. As technology continues to advance, we can expect AI to play an even more prominent role in solving complex global challenges, from climate change to space exploration. The key is to harness this powerful technology in ways that benefit humanity as a whole.`;

// 事件监听器
translateBtn.addEventListener('click', handleTranslate);
clearAllBtn.addEventListener('click', handleClearAll);
toggleAnnotationsBtn.addEventListener('click', toggleAnnotationsVisibility);
toggleTranslationsBtn.addEventListener('click', toggleTranslationsVisibility);
annotationModeToggle.addEventListener('change', toggleAnnotationMode);
translationModeToggle.addEventListener('change', toggleTranslationMode);

// 颜色选择器事件
colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除其他按钮的active类
        colorBtns.forEach(b => b.classList.remove('active'));
        // 添加active类到当前按钮
        btn.classList.add('active');
        // 更新当前颜色
        currentAnnotationColor = btn.dataset.color;
    });
});

filterRadios.forEach(radio => {
    radio.addEventListener('change', handleFilterChange);
});

// 显示文章内容
function displayArticleContent(text) {
    if (!text || !text.trim()) {
        clearArticle();
        return;
    }
    
    // 保存当前文章文本
    currentArticleText = text;
    
    // 隐藏之前的翻译
    hideTranslation();
    
    // 启用翻译按钮
    translateBtn.disabled = false;
    
    // 提取单词
    extractWords(text);
    
    // 显示文章
    displayArticle(text);
    
    // 更新侧边栏
    updateWordList();
    updateStats();
}

// 清空文章
function clearArticle() {
    articleDisplay.innerHTML = '<p class="placeholder-text">📚 请从文章列表选择文章开始阅读</p>';
    wordsData.clear();
    currentArticleText = '';
    currentArticleId = null;
    annotatedWords.clear(); // 清空标注
    translatedWords.clear(); // 清空翻译
    wordTranslations.clear(); // 清空翻译缓存
    hideTranslation();
    translateBtn.disabled = true;
    updateWordList();
    updateStats();
}

// 提取单词
function extractWords(text) {
    wordsData.clear();
    
    // 使用正则表达式提取单词（只保留字母）
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    
    // 统计频率
    words.forEach(word => {
        if (word.length > 1) { // 忽略单字母
            wordsData.set(word, (wordsData.get(word) || 0) + 1);
        }
    });
}

// 显示文章（将单词变为可点击）
function displayArticle(text) {
    // 将文本按段落分割
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    articleDisplay.innerHTML = '';
    
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        
        // 将段落中的单词包装
        const wrappedText = paragraph.replace(/\b[a-zA-Z]+\b/g, (word) => {
            return `<span class="word" data-word="${word.toLowerCase()}">${word}</span>`;
        });
        
        p.innerHTML = wrappedText;
        articleDisplay.appendChild(p);
    });
    
    // 为单词添加点击事件
    document.querySelectorAll('.word').forEach(wordElement => {
        wordElement.addEventListener('click', () => {
            const word = wordElement.dataset.word;
            
            if (annotationMode) {
                // 标注模式：标注单词
                toggleAnnotation(word);
            } else if (translationMode) {
                // 翻译模式：翻译单词
                toggleWordTranslation(word);
            } else {
                // 普通模式：高亮单词
                highlightWord(word);
            }
        });
    });
    
    // 恢复标注和翻译
    restoreAnnotations();
    restoreWordTranslations();
}

// 普通高亮模式
function highlightWord(word) {
    // 移除所有高亮
    document.querySelectorAll('.word.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });
    
    // 高亮选中的单词
    document.querySelectorAll(`.word[data-word="${word}"]`).forEach(el => {
        // 如果单词已被标注，不添加高亮（避免覆盖标注颜色）
        if (!annotatedWords.has(word)) {
            el.classList.add('highlighted');
        }
    });
}

// 切换标注模式
function toggleAnnotationMode(e) {
    annotationMode = e.target.checked;
    
    if (annotationMode) {
        // 关闭翻译模式（互斥）
        if (translationMode) {
            translationMode = false;
            translationModeToggle.checked = false;
        }
        // 显示颜色选择器
        colorPicker.style.display = 'flex';
        // 移除所有普通高亮
        document.querySelectorAll('.word.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    } else {
        // 隐藏颜色选择器
        colorPicker.style.display = 'none';
    }
}

// 切换翻译模式
function toggleTranslationMode(e) {
    translationMode = e.target.checked;
    
    if (translationMode) {
        // 关闭标注模式（互斥）
        if (annotationMode) {
            annotationMode = false;
            annotationModeToggle.checked = false;
            // 隐藏颜色选择器
            colorPicker.style.display = 'none';
        }
    } else {
        // 移除所有普通高亮
        document.querySelectorAll('.word.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    }
}

// 切换标注显示/隐藏
function toggleAnnotationsVisibility() {
    annotationsHidden = !annotationsHidden;
    
    if (annotationsHidden) {
        // 隐藏标注
        articleDisplay.classList.add('hide-annotations');
        toggleAnnotationsBtn.textContent = '显示标注';
    } else {
        // 显示标注
        articleDisplay.classList.remove('hide-annotations');
        toggleAnnotationsBtn.textContent = '隐藏标注';
    }
}

// 切换翻译显示/隐藏
function toggleTranslationsVisibility() {
    translationsHidden = !translationsHidden;
    
    if (translationsHidden) {
        // 隐藏翻译
        articleDisplay.classList.add('hide-translations');
        toggleTranslationsBtn.textContent = '显示翻译';
    } else {
        // 显示翻译
        articleDisplay.classList.remove('hide-translations');
        toggleTranslationsBtn.textContent = '隐藏翻译';
    }
}

// 标注/取消标注单词
function toggleAnnotation(word) {
    if (annotatedWords.has(word)) {
        // 如果已标注，取消标注
        annotatedWords.delete(word);
    } else {
        // 标注单词，使用当前选择的颜色
        annotatedWords.set(word, currentAnnotationColor);
    }
    
    // 更新显示
    applyAnnotations();
    
    // 更新侧边栏列表（重要：这样才能在"按标注"排序时更新顺序）
    updateWordList();
    
    // 保存到服务器
    saveAnnotationsToServer();
}

// 应用标注样式
function applyAnnotations() {
    // 移除所有标注样式
    document.querySelectorAll('.word.annotated').forEach(el => {
        el.classList.remove('annotated');
        el.style.backgroundColor = '';
    });
    
    // 应用新的标注
    annotatedWords.forEach((color, word) => {
        document.querySelectorAll(`.word[data-word="${word}"]`).forEach(el => {
            el.classList.add('annotated');
            el.style.backgroundColor = color;
        });
    });
    
    // 更新侧边栏
    updateSidebarHighlight();
}

// 恢复标注（在重新渲染文章后）
function restoreAnnotations() {
    if (annotatedWords.size > 0) {
        applyAnnotations();
    }
}


// 翻译功能
async function toggleWordTranslation(word) {
    if (translatedWords.has(word)) {
        // 取消翻译
        translatedWords.delete(word);
        removeWordTranslation(word);
    } else {
        // 添加翻译
        translatedWords.add(word);
        await fetchAndShowTranslation(word);
    }
}

// 查询并显示单词翻译
async function fetchAndShowTranslation(word) {
    // 检查缓存
    if (wordTranslations.has(word)) {
        showWordTranslation(word, wordTranslations.get(word));
        return;
    }
    
    try {
        // 使用MyMemory Translation API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            const translation = data.responseData.translatedText;
            wordTranslations.set(word, translation);
            showWordTranslation(word, translation);
        } else {
            wordTranslations.set(word, '(翻译失败)');
            showWordTranslation(word, '(翻译失败)');
        }
    } catch (error) {
        console.error('翻译失败:', error);
        wordTranslations.set(word, '(翻译失败)');
        showWordTranslation(word, '(翻译失败)');
    }
}

// 显示单词翻译在单词后面
function showWordTranslation(word, translation) {
    document.querySelectorAll(`.word[data-word="${word}"]`).forEach(el => {
        // 检查是否已经有翻译
        const nextEl = el.nextSibling;
        if (nextEl && nextEl.classList && nextEl.classList.contains('word-translation')) {
            nextEl.remove();
        }
        
        // 创建翻译元素
        const transSpan = document.createElement('span');
        transSpan.className = 'word-translation';
        transSpan.textContent = ` (${translation})`;
        
        // 插入到单词后面
        el.parentNode.insertBefore(transSpan, el.nextSibling);
    });
}

// 移除单词翻译
function removeWordTranslation(word) {
    document.querySelectorAll(`.word[data-word="${word}"]`).forEach(el => {
        const nextEl = el.nextSibling;
        if (nextEl && nextEl.classList && nextEl.classList.contains('word-translation')) {
            nextEl.remove();
        }
    });
}

// 恢复所有单词翻译（重新渲染后）
function restoreWordTranslations() {
    translatedWords.forEach(word => {
        if (wordTranslations.has(word)) {
            showWordTranslation(word, wordTranslations.get(word));
        }
    });
}

// 清除所有翻译
function clearAllTranslations() {
    translatedWords.forEach(word => {
        removeWordTranslation(word);
    });
    
    translatedWords.clear();
}

// 清除所有标注和翻译
function handleClearAll() {
    if (!currentArticleText) {
        return;
    }
    
    // 检查是否有内容需要清除
    if (annotatedWords.size === 0 && translatedWords.size === 0) {
        return;
    }
    
    // 清除所有标注
    annotatedWords.clear();
    applyAnnotations();
    
    // 清除所有翻译
    translatedWords.forEach(word => {
        removeWordTranslation(word);
    });
    translatedWords.clear();
    
    // 更新侧边栏
    updateWordList();
    
    // 保存到服务器
    if (currentArticleId) {
        saveAnnotationsToServer();
    }
}

// 更新侧边栏高亮
function updateSidebarHighlight() {
    document.querySelectorAll('.word-item').forEach(item => {
        item.style.background = '';
        item.style.color = '';
        item.style.transform = '';
        item.style.borderLeft = '';
        
        const itemWord = item.dataset.word;
        
        // 如果单词被标注了
        if (annotatedWords.has(itemWord)) {
            const color = annotatedWords.get(itemWord);
            item.style.background = color;
            item.style.color = 'white';
            item.style.transform = 'translateX(5px)';
            item.style.borderLeft = `4px solid ${color}`;
        }
    });
}

// 更新单词列表
function updateWordList() {
    if (wordsData.size === 0) {
        wordList.innerHTML = '<p class="empty-state">暂无单词</p>';
        return;
    }
    
    // 获取排序后的单词
    let sortedWords = Array.from(wordsData.entries());
    
    // 应用筛选
    if (currentFilter === 'alpha') {
        sortedWords.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (currentFilter === 'frequency') {
        sortedWords.sort((a, b) => b[1] - a[1]);
    } else if (currentFilter === 'annotated') {
        // 按标注排序：已标注的单词排在前面，最新标注的排在最前
        // 获取标注单词的顺序（Map保持插入顺序）
        const annotatedWordsArray = Array.from(annotatedWords.keys());
        
        sortedWords.sort((a, b) => {
            const aAnnotated = annotatedWords.has(a[0]);
            const bAnnotated = annotatedWords.has(b[0]);
            
            if (aAnnotated && !bAnnotated) return -1;
            if (!aAnnotated && bAnnotated) return 1;
            
            // 如果都已标注，按标注顺序排序（最新的在前）
            if (aAnnotated && bAnnotated) {
                const aIndex = annotatedWordsArray.indexOf(a[0]);
                const bIndex = annotatedWordsArray.indexOf(b[0]);
                return bIndex - aIndex; // 倒序，最新的（索引大的）在前
            }
            
            // 如果都未标注，按字母顺序
            return a[0].localeCompare(b[0]);
        });
    }
    
    // 渲染单词列表
    wordList.innerHTML = '';
    
    if (sortedWords.length === 0) {
        wordList.innerHTML = '<p class="empty-state">未找到匹配的单词</p>';
        return;
    }
    
    sortedWords.forEach(([word, frequency]) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.dataset.word = word;
        wordItem.innerHTML = `
            <span class="word-text">${word}</span>
            <span class="word-frequency">${frequency}</span>
        `;
        
        wordItem.addEventListener('click', () => {
            if (annotationMode) {
                // 标注模式：标注单词
                toggleAnnotation(word);
            } else if (translationMode) {
                // 翻译模式：翻译单词
                toggleWordTranslation(word);
            } else {
                // 普通模式：高亮单词
                highlightWord(word);
            }
        });
        
        wordList.appendChild(wordItem);
    });
    
    // 恢复标注状态的高亮
    updateSidebarHighlight();
}

// 更新统计信息
function updateStats() {
    const total = Array.from(wordsData.values()).reduce((sum, freq) => sum + freq, 0);
    wordCount.textContent = `总词数: ${total}`;
    uniqueWordCount.textContent = `不同单词: ${wordsData.size}`;
}

// 处理筛选变化
function handleFilterChange(e) {
    currentFilter = e.target.value;
    updateWordList();
}

// 翻译功能
async function handleTranslate() {
    if (!currentArticleText) {
        alert('请先输入文章内容');
        return;
    }
    
    // 如果已经显示翻译，则隐藏
    const existingTranslations = document.querySelectorAll('.translation-line');
    if (existingTranslations.length > 0) {
        existingTranslations.forEach(el => el.remove());
        translateBtn.textContent = '翻译中文';
        translateBtn.classList.remove('active');
        return;
    }
    
    // 检查缓存
    let translatedParagraphs;
    if (translationCache.has(currentArticleText)) {
        translatedParagraphs = translationCache.get(currentArticleText);
        displayInlineTranslation(translatedParagraphs);
        translateBtn.textContent = '隐藏翻译';
        translateBtn.classList.add('active');
        return;
    }
    
    // 显示加载状态
    translateBtn.disabled = true;
    translateBtn.textContent = '翻译中...';
    
    try {
        // 使用免费的翻译API（MyMemory Translation API）
        translatedParagraphs = await translateText(currentArticleText);
        
        // 缓存翻译结果
        translationCache.set(currentArticleText, translatedParagraphs);
        
        // 显示内联翻译
        displayInlineTranslation(translatedParagraphs);
        
        translateBtn.textContent = '隐藏翻译';
        translateBtn.classList.add('active');
        translateBtn.disabled = false;
    } catch (error) {
        console.error('翻译错误:', error);
        alert('翻译失败：网络连接问题或API限额已用完。\n\n建议：\n1. 使用浏览器内置翻译功能\n2. 复制文本到其他翻译工具\n3. 稍后重试');
        translateBtn.disabled = false;
        translateBtn.textContent = '翻译中文';
    }
}

// 调用翻译API - 返回段落数组
async function translateText(text) {
    // 将长文本分段翻译
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    const translations = [];
    
    for (let para of paragraphs) {
        if (!para.trim()) continue;
        
        // 使用MyMemory Translation API（免费，每天限额）
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(para)}&langpair=en|zh-CN`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.responseStatus === 200 && data.responseData) {
                translations.push({
                    original: para,
                    translated: data.responseData.translatedText
                });
            } else {
                translations.push({
                    original: para,
                    translated: '（翻译失败）'
                });
            }
            
            // 避免请求过快
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
            console.error('段落翻译失败:', err);
            translations.push({
                original: para,
                translated: '（翻译失败）'
            });
        }
    }
    
    return translations;
}

// 显示内联翻译（在原文下方）
function displayInlineTranslation(translatedParagraphs) {
    const allParagraphs = articleDisplay.querySelectorAll('p');
    
    // 为每个段落添加翻译
    translatedParagraphs.forEach((item, index) => {
        if (index < allParagraphs.length) {
            const translationDiv = document.createElement('div');
            translationDiv.className = 'translation-line';
            translationDiv.textContent = item.translated;
            
            // 在原文段落后插入翻译
            allParagraphs[index].parentNode.insertBefore(
                translationDiv, 
                allParagraphs[index].nextSibling
            );
        }
    });
}

// 隐藏翻译（已整合到 handleTranslate 中）
function hideTranslation() {
    const existingTranslations = document.querySelectorAll('.translation-line');
    existingTranslations.forEach(el => el.remove());
    translateBtn.textContent = '翻译中文';
    translateBtn.classList.remove('active');
}

// 离线简易翻译（词对词翻译，仅作为备用）
function showOfflineTranslation() {
    // 这是一个简化版本，显示原文段落结构
    const paragraphs = currentArticleText.split('\n\n').filter(p => p.trim());
    translationDisplay.innerHTML = '';
    
    paragraphs.forEach(para => {
        const p = document.createElement('p');
        p.textContent = `[原文段落] ${para.substring(0, 50)}...`;
        p.style.color = '#666';
        p.style.fontStyle = 'italic';
        translationDisplay.appendChild(p);
    });
    
    const note = document.createElement('div');
    note.style.cssText = 'margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;';
    note.innerHTML = `
        <p style="margin: 0;"><strong>提示：</strong></p>
        <p style="margin: 5px 0 0 0;">由于网络限制，无法提供完整翻译。建议：</p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>使用浏览器内置的网页翻译功能</li>
            <li>复制文本到百度翻译、Google翻译等工具</li>
            <li>使用浏览器扩展插件进行翻译</li>
        </ul>
    `;
    translationDisplay.appendChild(note);
}

// 从URL加载文章
async function loadArticleFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let articleId = urlParams.get('article');
    
    // 如果URL中没有指定文章ID，则加载第一篇文章
    if (!articleId) {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/?page_size=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    articleId = data.results[0].id;
                }
            }
        } catch (error) {
            console.error('获取默认文章失败:', error);
        }
    }
    
    if (articleId) {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${articleId}/`);
            if (response.ok) {
                const article = await response.json();
                currentArticleId = article.id;
                displayArticleContent(article.content);
                
                // 加载用户的标注
                await loadAnnotationsFromServer(articleId);
            } else {
                console.error('加载文章失败');
            }
        } catch (error) {
            console.error('加载文章失败:', error);
        }
    }
}

// 从服务器加载标注
async function loadAnnotationsFromServer(articleId) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}/annotations/`);
        if (response.ok) {
            const annotations = await response.json();
            
            // 恢复标注
            annotatedWords.clear();
            annotations.forEach(ann => {
                annotatedWords.set(ann.word, ann.color);
            });
            
            // 应用标注
            if (annotatedWords.size > 0) {
                applyAnnotations();
            }
        }
    } catch (error) {
        console.error('加载标注失败:', error);
    }
}

// 保存标注到服务器
async function saveAnnotationsToServer() {
    if (!currentArticleId) return;
    
    try {
        const annotations = Array.from(annotatedWords.entries()).map(([word, color]) => ({
            word,
            color
        }));
        
        await fetch(`${API_BASE_URL}/articles/${currentArticleId}/save_annotations/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ annotations })
        });
    } catch (error) {
        console.error('保存标注失败:', error);
    }
}

// 页面加载时的初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('英文文章阅读器已加载');
    
    // 初始禁用翻译按钮
    translateBtn.disabled = true;
    
    // 从URL加载文章
    await loadArticleFromURL();
});

