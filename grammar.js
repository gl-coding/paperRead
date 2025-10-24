// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 全局变量
let wordsData = new Map(); // 存储单词及其频率
let currentFilter = 'annotated';
let currentArticleText = ''; // 存储当前文章文本
let currentArticleId = null; // 当前文章ID
let translationCache = new Map(); // 缓存翻译结果
let annotatedWords = new Map(); // 存储标注的单词及其颜色 {word: color}
let annotationMode = false; // 标注模式开关
let sentenceAnnotationMode = false; // 句子标注模式开关
let translationMode = false; // 翻译模式开关
let currentAnnotationColor = '#28a745'; // 当前选择的标注颜色（默认绿色）
let translatedWords = new Set(); // 存储已翻译的单词
let wordTranslations = new Map(); // 存储单词翻译缓存 {word: translation}
let annotatedSentences = new Map(); // 存储标注的句子 {sentenceId: color}
let annotationsHidden = false; // 标注隐藏状态
let translationsHidden = false; // 翻译隐藏状态

// 朗读相关变量
let readingSentences = []; // 当前页所有句子
let currentReadingIndex = -1; // 当前朗读的句子索引
let isReading = false; // 是否正在朗读
let readingPaused = false; // 是否暂停
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// 分页相关变量（全部使用后端分页）
let currentPage = 1; // 当前页码
let totalPages = 1; // 总页数
let paragraphsPerPage = 8; // 每页段落数
let currentParagraphCount = 0; // 当前文章段落总数

// 目录相关变量
let catalogData = {}; // 存储文章目录数据 {category: [articles]}

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
const sentenceAnnotationModeToggle = document.getElementById('sentenceAnnotationModeToggle');
const translationModeToggle = document.getElementById('translationModeToggle');
const colorPicker = document.getElementById('colorPicker');
const colorBtns = document.querySelectorAll('.color-btn');
const filterRadios = document.querySelectorAll('input[name="filter"]');
const paginationControls = document.getElementById('paginationControls');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const paginationInfo = document.getElementById('paginationInfo');
const catalogTree = document.getElementById('catalogTree');
const refreshCatalog = document.getElementById('refreshCatalog');

// 以下元素仅在阅读文章页存在，这里保留引用避免报错
const tabBtns = document.querySelectorAll('.tab-btn') || [];
const sentenceList = document.getElementById('sentenceList');
const sentencesCount = document.getElementById('sentencesCount');
const readingSentenceList = document.getElementById('readingSentenceList');
const playAllBtn = document.getElementById('playAllBtn');
const pauseReadingBtn = document.getElementById('pauseReadingBtn');
const stopReadingBtn = document.getElementById('stopReadingBtn');
const readingRate = document.getElementById('readingRate');
const rateValue = document.getElementById('rateValue');
const readingProgress = document.getElementById('readingProgress');

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
sentenceAnnotationModeToggle.addEventListener('change', toggleSentenceAnnotationMode);
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

// Tab切换事件（仅在有Tab按钮时绑定）
if (tabBtns && tabBtns.length > 0) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });
}

// 朗读控制事件（仅在元素存在时绑定）
if (playAllBtn) playAllBtn.addEventListener('click', startReadingAll);
if (pauseReadingBtn) pauseReadingBtn.addEventListener('click', togglePauseReading);
if (stopReadingBtn) stopReadingBtn.addEventListener('click', stopReading);
if (readingRate && rateValue) {
    readingRate.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value);
        rateValue.textContent = rate.toFixed(1) + 'x';
        if (currentUtterance) {
            currentUtterance.rate = rate;
        }
    });
}

// 分页按钮事件
prevPageBtn.addEventListener('click', goToPreviousPage);
nextPageBtn.addEventListener('click', goToNextPage);

// 保存阅读进度
function saveReadingProgress(articleId, page) {
    const username = getUsername();
    const key = `paperread_reading_progress_${username}_${articleId}`;
    const progressData = {
        currentPage: page,
        totalPages: totalPages,
        lastReadAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(progressData));
}

// 获取阅读进度
function getReadingProgress(articleId) {
    const username = getUsername();
    const key = `paperread_reading_progress_${username}_${articleId}`;
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            return data.currentPage || 1;
        } catch (e) {
            // 兼容旧格式（直接存储的数字）
            return parseInt(savedData) || 1;
        }
    }
    
    // 尝试读取旧格式的key
    const oldKey = `reading_progress_${username}_${articleId}`;
    const oldData = localStorage.getItem(oldKey);
    if (oldData) {
        return parseInt(oldData) || 1;
    }
    
    return 1;
}

// 加载文章内容（全部使用后端分页）
async function loadArticleContent(articleId, page = 1) {
    try {
        paragraphsPerPage = parseInt(localStorage.getItem('maxParagraphs') || '8');
        
        const response = await fetch(
            `${API_BASE_URL}/articles/${articleId}/content_paginated/?page=${page}&page_size=${paragraphsPerPage}`
        );
        
        if (!response.ok) {
            throw new Error('获取分页内容失败');
        }
        
        const data = await response.json();
        
        // 更新分页信息
        currentPage = data.current_page;
        totalPages = data.total_pages;
        
        // 组装段落为文本
        const text = data.paragraphs.join('\n\n');
        currentArticleText = text;
        
        // 隐藏之前的翻译
        hideTranslation();
        
        // 启用翻译按钮
        translateBtn.disabled = false;
        
        // 提取单词（只提取当前页的单词）
        extractWords(text);
        
        // 显示当前页内容
        displayPagedContent(data.paragraphs);
        
        // 更新分页控件
        updatePaginationControls();
        
        // 更新侧边栏
        updateWordList();
        updateStats();
        
        // 清空朗读数据（换页后需要重新初始化）
        // 注意：displayPagedContent中会自动加载句子标注
        if (isReading) {
            stopReading();
        }
        readingSentences = [];
        
        // 如果当前在句子tab，刷新句子列表
        const sentencesTab = document.getElementById('sentencesTab');
        if (sentencesTab && sentencesTab.classList.contains('active')) {
            updateSentenceList();
        }
        
        // 如果当前在朗读tab，刷新朗读列表
        const readingTab = document.getElementById('readingTab');
        if (readingTab && readingTab.classList.contains('active')) {
            initReadingList();
        }
        
        // 保存阅读进度
        saveReadingProgress(articleId, currentPage);
        
    } catch (error) {
        console.error('后端分页加载失败:', error);
        alert('加载文章内容失败，请重试');
    }
}

// 显示分页内容
function displayPagedContent(paragraphs) {
    articleDisplay.innerHTML = '';
    
    let sentenceIdCounter = 0;
    
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        
        // 将段落按句子分割（按 . ! ? 等标点符号）
        const sentences = splitIntoSentences(paragraph);
        
        let paragraphHTML = '';
        sentences.forEach(sentence => {
            if (sentence.trim()) {
                const sentenceId = `sentence_${sentenceIdCounter++}`;
                
                // 将句子中的单词包装
                const wrappedSentence = sentence.replace(/\b[a-zA-Z]+\b/g, (word) => {
                    return `<span class="word" data-word="${word.toLowerCase()}">${word}</span>`;
                });
                
                // 用span包装整个句子
                paragraphHTML += `<span class="sentence" data-sentence-id="${sentenceId}">${wrappedSentence}</span>`;
            }
        });
        
        p.innerHTML = paragraphHTML;
        articleDisplay.appendChild(p);
    });
    
    // 为单词添加点击事件
    document.querySelectorAll('.word').forEach(wordElement => {
        wordElement.addEventListener('click', (e) => {
            const word = wordElement.dataset.word;
            
            if (annotationMode) {
                toggleAnnotation(word);
            } else if (sentenceAnnotationMode) {
                // 找到单词所在的句子
                const sentenceElement = wordElement.closest('.sentence');
                if (sentenceElement) {
                    const sentenceId = sentenceElement.dataset.sentenceId;
                    toggleSentenceAnnotation(sentenceId);
                }
            } else if (translationMode) {
                toggleWordTranslation(word);
            } else {
                highlightWord(word);
            }
        });
    });
    
    // 加载句子标注
    loadSentenceAnnotationsFromLocal();
    
    // 恢复标注和翻译
    restoreAnnotations();
    restoreSentenceAnnotations();
    restoreWordTranslations();
    
    // 滚动到顶部
    articleDisplay.scrollTop = 0;
}

// 将文本按句子分割
function splitIntoSentences(text) {
    // 按句子结束符分割（. ! ? ; :）后面跟空格或结尾
    // 保留标点符号
    const sentences = [];
    const regex = /[^.!?;]+[.!?;]+\s*/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        sentences.push(match[0]);
    }
    
    // 如果有剩余文本（没有结束符的）
    const lastIndex = sentences.join('').length;
    if (lastIndex < text.length) {
        sentences.push(text.substring(lastIndex));
    }
    
    return sentences.length > 0 ? sentences : [text];
}

// 清空文章
function clearArticle() {
    articleDisplay.innerHTML = '<p class="placeholder-text">📚 请从文章列表选择文章开始阅读</p>';
    wordsData.clear();
    currentArticleText = '';
    currentArticleId = null;
    annotatedWords.clear(); // 清空单词标注
    annotatedSentences.clear(); // 清空句子标注
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

// 前端分页函数已移除，全部使用后端分页

// 更新分页控件
function updatePaginationControls() {
    if (totalPages > 1) {
        paginationControls.style.display = 'flex';
        paginationInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
        
        // 更新按钮状态
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    } else {
        paginationControls.style.display = 'none';
    }
}

// 上一页
function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadArticleContent(currentArticleId, currentPage);
    }
}

// 下一页
function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadArticleContent(currentArticleId, currentPage);
    }
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
        // 关闭其他模式（互斥）
        if (sentenceAnnotationMode) {
            sentenceAnnotationMode = false;
            sentenceAnnotationModeToggle.checked = false;
        }
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

// 切换句子标注模式
function toggleSentenceAnnotationMode(e) {
    sentenceAnnotationMode = e.target.checked;
    
    if (sentenceAnnotationMode) {
        // 关闭其他模式（互斥）
        if (annotationMode) {
            annotationMode = false;
            annotationModeToggle.checked = false;
        }
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

// 标注/取消标注句子
function toggleSentenceAnnotation(sentenceId) {
    if (annotatedSentences.has(sentenceId)) {
        // 如果已标注，取消标注
        annotatedSentences.delete(sentenceId);
    } else {
        // 标注句子，使用当前选择的颜色
        annotatedSentences.set(sentenceId, currentAnnotationColor);
    }
    
    // 更新显示
    applySentenceAnnotations();
    
    // 保存到本地存储
    saveSentenceAnnotationsToLocal();
    
    // 如果句子tab是激活状态，更新句子列表
    const sentencesTab = document.getElementById('sentencesTab');
    if (sentencesTab && sentencesTab.classList.contains('active')) {
        updateSentenceList();
    }
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

// 应用句子标注样式
function applySentenceAnnotations() {
    // 移除所有句子标注样式
    document.querySelectorAll('.sentence.sentence-annotated').forEach(el => {
        el.classList.remove('sentence-annotated');
        el.style.borderBottom = '';
        el.style.backgroundColor = '';
    });
    
    // 应用新的句子标注
    annotatedSentences.forEach((color, sentenceId) => {
        const sentenceElement = document.querySelector(`.sentence[data-sentence-id="${sentenceId}"]`);
        if (sentenceElement) {
            sentenceElement.classList.add('sentence-annotated');
            // 使用下划线和淡背景色来标注句子
            sentenceElement.style.borderBottom = `3px solid ${color}`;
            // 添加半透明背景色
            const rgbaColor = hexToRgba(color, 0.1);
            sentenceElement.style.backgroundColor = rgbaColor;
        }
    });
}

// 恢复句子标注（在重新渲染文章后）
function restoreSentenceAnnotations() {
    if (annotatedSentences.size > 0) {
        applySentenceAnnotations();
    }
}

// 十六进制颜色转rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 保存句子标注到本地存储
function saveSentenceAnnotationsToLocal() {
    if (!currentArticleId) return;
    
    const username = getUsername();
    const key = `sentence_annotations_${username}_${currentArticleId}_page${currentPage}`;
    
    const annotations = Array.from(annotatedSentences.entries()).map(([sentenceId, color]) => ({
        sentenceId,
        color
    }));
    
    localStorage.setItem(key, JSON.stringify(annotations));
}

// 从本地存储加载句子标注
function loadSentenceAnnotationsFromLocal() {
    if (!currentArticleId) return;
    
    const username = getUsername();
    const key = `sentence_annotations_${username}_${currentArticleId}_page${currentPage}`;
    
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            const annotations = JSON.parse(saved);
            annotatedSentences.clear();
            annotations.forEach(ann => {
                annotatedSentences.set(ann.sentenceId, ann.color);
            });
        } catch (e) {
            console.error('加载句子标注失败:', e);
        }
    } else {
        annotatedSentences.clear();
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
    if (annotatedWords.size === 0 && annotatedSentences.size === 0 && translatedWords.size === 0) {
        return;
    }
    
    // 清除所有单词标注
    annotatedWords.clear();
    applyAnnotations();
    
    // 清除所有句子标注
    annotatedSentences.clear();
    applySentenceAnnotations();
    saveSentenceAnnotationsToLocal();
    
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

// Tab切换函数（简化版 - 目录专用页面）
function switchTab(tabName) {
    // 英语语法页面只有目录，无需切换
    console.log('当前页面只显示文章目录');
}

// 更新句子列表
function updateSentenceList() {
    // 英语语法页面不需要句子列表
    if (!sentenceList || !sentencesCount) return;
    
    if (annotatedSentences.size === 0) {
        sentenceList.innerHTML = '<p class="empty-state">暂无标注的句子</p>';
        sentencesCount.textContent = '已标注 0 个句子';
        return;
    }
    
    sentencesCount.textContent = `已标注 ${annotatedSentences.size} 个句子`;
    
    let html = '';
    annotatedSentences.forEach((color, sentenceId) => {
        const sentenceElement = document.querySelector(`.sentence[data-sentence-id="${sentenceId}"]`);
        if (sentenceElement) {
            const sentenceText = sentenceElement.textContent;
            html += `
                <div class="sentence-item" data-sentence-id="${sentenceId}">
                    <div class="sentence-item-text">${sentenceText}</div>
                    <div class="sentence-item-footer">
                        <div class="sentence-item-color" style="background: ${color};" title="标注颜色"></div>
                        <button class="sentence-item-delete" onclick="deleteSentenceAnnotation('${sentenceId}')">删除</button>
                    </div>
                </div>
            `;
        }
    });
    
    sentenceList.innerHTML = html;
    
    // 为句子项添加点击事件（滚动到对应句子）
    document.querySelectorAll('.sentence-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // 如果点击的是删除按钮，不触发滚动
            if (e.target.classList.contains('sentence-item-delete')) {
                return;
            }
            
            const sentenceId = item.dataset.sentenceId;
            const sentenceElement = document.querySelector(`.sentence[data-sentence-id="${sentenceId}"]`);
            if (sentenceElement) {
                sentenceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 高亮闪烁效果
                sentenceElement.style.animation = 'highlight-flash 1s ease';
                setTimeout(() => {
                    sentenceElement.style.animation = '';
                }, 1000);
            }
        });
    });
}

// 删除句子标注
window.deleteSentenceAnnotation = function(sentenceId) {
    annotatedSentences.delete(sentenceId);
    applySentenceAnnotations();
    saveSentenceAnnotationsToLocal();
    updateSentenceList();
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
                currentParagraphCount = article.paragraph_count || 0;
                
                // 获取上次阅读的页码
                const savedPage = getReadingProgress(articleId);
                
                // 使用后端分页加载文章内容（跳转到上次阅读的页面）
                await loadArticleContent(articleId, savedPage);
                
                // 加载用户的标注
                await loadAnnotationsFromServer(articleId);
                
                // 记录阅读历史
                await recordReadingHistory(articleId);
                
                // 如果不是第一页，显示提示
                if (savedPage > 1) {
                    showReadingProgressNotification(savedPage);
                }
            } else {
                console.error('加载文章失败');
            }
        } catch (error) {
            console.error('加载文章失败:', error);
        }
    }
}

// 显示阅读进度恢复提示
function showReadingProgressNotification(page) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">📖</span>
            <div>
                <div style="font-weight: bold; margin-bottom: 3px;">继续阅读</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">已跳转到第 ${page} 页</div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentElement) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 从服务器加载标注
async function loadAnnotationsFromServer(articleId) {
    try {
        const username = getUsername();
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}/annotations/?username=${encodeURIComponent(username)}`);
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
            
            // 更新侧边栏单词列表，确保按标注排序时标注词条置顶
            updateWordList();
        }
    } catch (error) {
        console.error('加载标注失败:', error);
    }
}

// 保存标注到服务器
async function saveAnnotationsToServer() {
    if (!currentArticleId) return;
    
    try {
        const username = getUsername();
        const annotations = Array.from(annotatedWords.entries()).map(([word, color]) => ({
            word,
            color
        }));
        
        const response = await fetch(`${API_BASE_URL}/articles/${currentArticleId}/save_annotations/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                annotations,
                username 
            })
        });
        
        if (!response.ok) {
            throw new Error('保存标注失败');
        }
        console.log('标注已保存');
    } catch (error) {
        console.error('保存标注失败:', error);
    }
}

// 记录阅读历史
async function recordReadingHistory(articleId) {
    try {
        const username = getUsername();
        
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}/record_reading/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username,
                read_duration: 0 // 可以后续扩展记录实际阅读时长
            })
        });
        
        if (!response.ok) {
            throw new Error('记录阅读历史失败');
        }
        console.log('阅读历史已记录');
    } catch (error) {
        console.error('记录阅读历史失败:', error);
    }
}

// ========== 朗读功能 ==========

// 初始化朗读列表（获取当前页所有句子）
function initReadingList() {
    // 英语语法页面不需要朗读列表
    if (!readingSentenceList) return;
    
    readingSentences = [];
    
    // 获取当前页面所有句子元素
    const sentenceElements = document.querySelectorAll('.sentence');
    sentenceElements.forEach((element, index) => {
        const sentenceText = element.textContent.trim();
        if (sentenceText) {
            readingSentences.push({
                index: index,
                text: sentenceText,
                element: element
            });
        }
    });
    
    updateReadingList();
}

// 更新朗读句子列表UI
function updateReadingList() {
    // 英语语法页面不需要朗读列表
    if (!readingSentenceList) return;
    
    if (readingSentences.length === 0) {
        readingSentenceList.innerHTML = '<p class="empty-state">暂无句子</p>';
        return;
    }
    
    let html = '';
    readingSentences.forEach((sentence, index) => {
        const isCurrentClass = index === currentReadingIndex ? 'current' : '';
        const isPlayedClass = index < currentReadingIndex && currentReadingIndex !== -1 ? 'played' : '';
        html += `
            <div class="reading-sentence-item ${isCurrentClass} ${isPlayedClass}" data-index="${index}">
                <div class="reading-sentence-text">${sentence.text}</div>
                <div class="reading-sentence-controls">
                    <button class="reading-sentence-btn" onclick="readSingleSentence(${index})">
                        🔊 朗读
                    </button>
                </div>
            </div>
        `;
    });
    
    readingSentenceList.innerHTML = html;
}

// 开始朗读所有句子
function startReadingAll() {
    // 英语语法页面不支持朗读
    if (!playAllBtn || !pauseReadingBtn || !stopReadingBtn) return;
    
    if (readingSentences.length === 0) {
        alert('当前页没有可朗读的句子');
        return;
    }
    
    isReading = true;
    readingPaused = false;
    currentReadingIndex = 0;
    
    // 更新按钮显示
    playAllBtn.style.display = 'none';
    pauseReadingBtn.style.display = 'flex';
    stopReadingBtn.style.display = 'flex';
    
    // 开始朗读
    readNextSentence();
}

// 朗读下一个句子
function readNextSentence() {
    if (!isReading || readingPaused || currentReadingIndex >= readingSentences.length) {
        if (currentReadingIndex >= readingSentences.length) {
            // 全部朗读完成
            stopReading();
            readingProgress.textContent = '✅ 朗读完成！';
        }
        return;
    }
    
    const sentence = readingSentences[currentReadingIndex];
    const rate = parseFloat(readingRate.value);
    
    // 更新进度
    readingProgress.textContent = `正在朗读 ${currentReadingIndex + 1} / ${readingSentences.length}`;
    
    // 更新UI
    updateReadingList();
    
    // 滚动到对应句子并高亮
    if (sentence.element) {
        sentence.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sentence.element.style.animation = 'highlight-flash 2s ease infinite';
    }
    
    // 创建语音
    currentUtterance = new SpeechSynthesisUtterance(sentence.text);
    currentUtterance.rate = rate;
    currentUtterance.lang = 'en-US';
    
    currentUtterance.onend = () => {
        // 移除高亮
        if (sentence.element) {
            sentence.element.style.animation = '';
        }
        
        // 继续下一个句子
        currentReadingIndex++;
        readNextSentence();
    };
    
    currentUtterance.onerror = (event) => {
        console.error('朗读错误:', event);
        if (sentence.element) {
            sentence.element.style.animation = '';
        }
        currentReadingIndex++;
        readNextSentence();
    };
    
    speechSynthesis.speak(currentUtterance);
}

// 朗读单个句子
window.readSingleSentence = function(index) {
    const sentence = readingSentences[index];
    if (!sentence) return;
    
    // 停止当前朗读
    speechSynthesis.cancel();
    
    const rate = parseFloat(readingRate.value);
    
    // 滚动并高亮
    if (sentence.element) {
        sentence.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sentence.element.style.animation = 'highlight-flash 2s ease infinite';
    }
    
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.rate = rate;
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
        if (sentence.element) {
            sentence.element.style.animation = '';
        }
    };
    
    utterance.onerror = () => {
        if (sentence.element) {
            sentence.element.style.animation = '';
        }
    };
    
    speechSynthesis.speak(utterance);
}

// 暂停/继续朗读
function togglePauseReading() {
    if (!isReading) return;
    
    readingPaused = !readingPaused;
    
    if (readingPaused) {
        speechSynthesis.pause();
        pauseReadingBtn.querySelector('.btn-text').textContent = '继续';
        pauseReadingBtn.querySelector('.btn-icon').textContent = '▶️';
        readingProgress.textContent = '⏸️ 已暂停';
    } else {
        speechSynthesis.resume();
        pauseReadingBtn.querySelector('.btn-text').textContent = '暂停';
        pauseReadingBtn.querySelector('.btn-icon').textContent = '⏸️';
        readingProgress.textContent = `正在朗读 ${currentReadingIndex + 1} / ${readingSentences.length}`;
        readNextSentence();
    }
}

// 停止朗读
function stopReading() {
    isReading = false;
    readingPaused = false;
    speechSynthesis.cancel();
    
    // 移除所有高亮
    document.querySelectorAll('.sentence').forEach(el => {
        el.style.animation = '';
    });
    
    // 重置索引
    currentReadingIndex = -1;
    
    // 更新按钮显示（仅在元素存在时）
    if (playAllBtn) playAllBtn.style.display = 'flex';
    if (pauseReadingBtn) {
        pauseReadingBtn.style.display = 'none';
        // 重置暂停按钮文本
        const btnText = pauseReadingBtn.querySelector('.btn-text');
        const btnIcon = pauseReadingBtn.querySelector('.btn-icon');
        if (btnText) btnText.textContent = '暂停';
        if (btnIcon) btnIcon.textContent = '⏸️';
    }
    if (stopReadingBtn) stopReadingBtn.style.display = 'none';
    
    // 更新进度
    if (readingProgress) readingProgress.textContent = '等待播放...';
    
    // 更新列表
    updateReadingList();
}

// ============ 文章目录功能 ============

// 加载文章目录
async function loadCatalog() {
    try {
        catalogTree.innerHTML = '<p class="empty-state">加载中...</p>';
        
        const response = await fetch(`${API_BASE_URL}/articles/?page_size=100`);
        
        if (!response.ok) {
            throw new Error('加载文章列表失败');
        }
        
        const data = await response.json();
        const articles = data.results || [];
        
        // 按类别分组
        catalogData = {};
        articles.forEach(article => {
            const category = article.category || '未分类';
            if (!catalogData[category]) {
                catalogData[category] = [];
            }
            catalogData[category].push(article);
        });
        
        // 渲染目录
        displayCatalog();
        
    } catch (error) {
        console.error('加载目录失败:', error);
        catalogTree.innerHTML = '<p class="empty-state">加载失败，请刷新重试</p>';
    }
}

// 显示文章目录
function displayCatalog() {
    if (Object.keys(catalogData).length === 0) {
        catalogTree.innerHTML = '<p class="empty-state">暂无文章</p>';
        return;
    }
    
    let html = '';
    
    // 遍历每个类别
    Object.keys(catalogData).sort().forEach(category => {
        const articles = catalogData[category];
        const categoryId = `category-${category.replace(/\s+/g, '-')}`;
        
        html += `
            <div class="catalog-category">
                <div class="category-header" onclick="toggleCategory('${categoryId}')">
                    <span class="category-toggle" id="${categoryId}-toggle">▶</span>
                    <span class="category-name">${category}</span>
                    <span class="category-count">${articles.length}</span>
                </div>
                <div class="article-list" id="${categoryId}">
        `;
        
        // 遍历该类别下的文章
        articles.forEach(article => {
            const isActive = currentArticleId === article.id ? 'active' : '';
            html += `
                <div class="article-item ${isActive}" onclick="selectArticle(${article.id})">
                    <div class="article-title">${escapeHtml(article.title)}</div>
                    <div class="article-meta">
                        <span>📊 ${article.word_count || 0} 词</span>
                        <span>📄 ${article.paragraph_count || 0} 段</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    catalogTree.innerHTML = html;
}

// 切换类别展开/收起
function toggleCategory(categoryId) {
    const list = document.getElementById(categoryId);
    const toggle = document.getElementById(`${categoryId}-toggle`);
    
    if (list.classList.contains('expanded')) {
        list.classList.remove('expanded');
        toggle.classList.remove('expanded');
    } else {
        list.classList.add('expanded');
        toggle.classList.add('expanded');
    }
}

// 选择文章
function selectArticle(articleId) {
    // 更新当前文章ID
    currentArticleId = articleId;
    
    // 更新活动状态
    document.querySelectorAll('.article-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.article-item').classList.add('active');
    
    // 加载文章内容
    loadArticleContent(articleId, 1);
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 刷新目录按钮事件
if (refreshCatalog) {
    refreshCatalog.addEventListener('click', loadCatalog);
}

// 页面加载时的初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('英语语法页面已加载');
    
    // 初始禁用翻译按钮
    translateBtn.disabled = true;
    
    // 加载文章目录
    await loadCatalog();
    
    // 从URL加载文章
    await loadArticleFromURL();
});

