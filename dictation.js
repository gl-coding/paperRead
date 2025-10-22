// 全局变量
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let isAnswered = false;
let completedIndices = new Set(); // 记录已完成的题目
let currentFilter = 'all'; // 当前筛选类型

// 题库数据（添加音标）
const questionBank = [
    // 单词
    { type: 'word', chinese: '学习', english: 'learn', phonetic: '/lɜːn/' },
    { type: 'word', chinese: '技术', english: 'technology', phonetic: '/tekˈnɒlədʒi/' },
    { type: 'word', chinese: '创新', english: 'innovation', phonetic: '/ˌɪnəˈveɪʃn/' },
    { type: 'word', chinese: '发展', english: 'develop', phonetic: '/dɪˈveləp/' },
    { type: 'word', chinese: '设计', english: 'design', phonetic: '/dɪˈzaɪn/' },
    { type: 'word', chinese: '商业', english: 'business', phonetic: '/ˈbɪznəs/' },
    { type: 'word', chinese: '市场', english: 'market', phonetic: '/ˈmɑːkɪt/' },
    { type: 'word', chinese: '环境', english: 'environment', phonetic: '/ɪnˈvaɪrənmənt/' },
    { type: 'word', chinese: '可持续的', english: 'sustainable', phonetic: '/səˈsteɪnəbl/' },
    { type: 'word', chinese: '知识', english: 'knowledge', phonetic: '/ˈnɒlɪdʒ/' },
    
    // 短语
    { type: 'phrase', chinese: '人工智能', english: 'artificial intelligence', phonetic: '/ˌɑːtɪˈfɪʃl ɪnˈtelɪdʒəns/' },
    { type: 'phrase', chinese: '机器学习', english: 'machine learning', phonetic: '/məˈʃiːn ˈlɜːnɪŋ/' },
    { type: 'phrase', chinese: '大数据', english: 'big data', phonetic: '/bɪɡ ˈdeɪtə/' },
    { type: 'phrase', chinese: '云计算', english: 'cloud computing', phonetic: '/klaʊd kəmˈpjuːtɪŋ/' },
    { type: 'phrase', chinese: '物联网', english: 'internet of things', phonetic: '/ˈɪntənet əv θɪŋz/' },
    { type: 'phrase', chinese: '可再生能源', english: 'renewable energy', phonetic: '/rɪˈnjuːəbl ˈenədʒi/' },
    { type: 'phrase', chinese: '气候变化', english: 'climate change', phonetic: '/ˈklaɪmət tʃeɪndʒ/' },
    { type: 'phrase', chinese: '全球化', english: 'globalization', phonetic: '/ˌɡləʊbəlaɪˈzeɪʃn/' },
    { type: 'phrase', chinese: '经济增长', english: 'economic growth', phonetic: '/ˌiːkəˈnɒmɪk ɡrəʊθ/' },
    { type: 'phrase', chinese: '社会责任', english: 'social responsibility', phonetic: '/ˈsəʊʃl rɪˌspɒnsəˈbɪləti/' },
    
    // 句子
    { type: 'sentence', chinese: '学习是一个持续的过程', english: 'Learning is a continuous process', phonetic: '/ˈlɜːnɪŋ ɪz ə kənˈtɪnjuəs ˈprəʊses/' },
    { type: 'sentence', chinese: '技术改变了我们的生活', english: 'Technology has changed our lives', phonetic: '/tekˈnɒlədʒi hæz tʃeɪndʒd aʊə laɪvz/' },
    { type: 'sentence', chinese: '创新驱动发展', english: 'Innovation drives development', phonetic: '/ˌɪnəˈveɪʃn draɪvz dɪˈveləpmənt/' },
    { type: 'sentence', chinese: '保护环境是每个人的责任', english: 'Protecting the environment is everyone\'s responsibility', phonetic: '/prəˈtektɪŋ ði ɪnˈvaɪrənmənt ɪz ˈevriwʌnz rɪˌspɒnsəˈbɪləti/' },
    { type: 'sentence', chinese: '教育是成功的关键', english: 'Education is the key to success', phonetic: '/ˌedjuˈkeɪʃn ɪz ðə kiː tuː səkˈses/' }
];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定事件
    document.getElementById('startBtn').addEventListener('click', startPractice);
    document.getElementById('submitBtn').addEventListener('click', submitAnswer);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('skipBtn').addEventListener('click', skipQuestion);
    document.getElementById('restartBtn').addEventListener('click', restartPractice);
    document.getElementById('hintBtn').addEventListener('click', showPhonetic);
    document.getElementById('speakBtn').addEventListener('click', speakEnglish);
    
    // 筛选标签事件
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            currentFilter = this.dataset.type;
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderWordList();
        });
    });
    
    // 初始化词条列表
    initializeWordList();
    
    // 侧边栏切换事件
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarExpandBtn').addEventListener('click', toggleSidebar);
    
    // 清空重答按钮
    document.getElementById('clearBtn').addEventListener('click', clearAndRetry);
});

// 开始练习
function startPractice() {
    // 不打乱题目顺序，保持原始顺序
    questions = [...questionBank];
    currentIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    completedIndices.clear();
    
    // 隐藏开始按钮，显示其他控件
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'inline-flex';
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('questionTools').style.display = 'flex';
    
    // 显示第一题
    showQuestion();
    updateStats();
    updateWordListStatus();
}

// 创建单词输入框
function createWordInputs(answer) {
    const container = document.getElementById('wordInputs');
    container.innerHTML = '';
    
    // 将答案拆分成单词（支持空格、连字符、撇号等）
    const words = answer.match(/[a-zA-Z]+('[a-z]+)?|[^\w\s]/g) || [];
    
    words.forEach((word, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'word-input-wrapper';
        
        // 标点符号不需要输入框
        if (/^[^\w\s]$/.test(word)) {
            const punctuation = document.createElement('span');
            punctuation.className = 'punctuation-mark';
            punctuation.textContent = word;
            punctuation.style.fontSize = '1.5rem';
            punctuation.style.color = '#667eea';
            punctuation.style.fontWeight = 'bold';
            wrapper.appendChild(punctuation);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'word-input';
            input.dataset.index = index;
            input.dataset.correctWord = word.toLowerCase();
            input.style.width = `${Math.max(word.length * 18, 60)}px`;
            input.autocomplete = 'off';
            input.spellcheck = false;
            
            // 添加输入事件
            input.addEventListener('input', function() {
                checkSubmitEnabled();
                showClearButton();
                checkWordCorrect(this);
            });
            
            // 添加回车键提交
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    submitAnswer();
                }
            });
            
            // 添加自动跳转到下一个输入框
            input.addEventListener('input', function(e) {
                const currentLength = this.value.length;
                const expectedLength = word.length;
                
                // 如果输入长度接近单词长度，自动跳到下一个
                if (currentLength >= expectedLength) {
                    const allInputs = container.querySelectorAll('.word-input');
                    const currentInputIndex = Array.from(allInputs).indexOf(this);
                    if (currentInputIndex < allInputs.length - 1) {
                        allInputs[currentInputIndex + 1].focus();
                    }
                }
            });
            
            wrapper.appendChild(input);
        }
        
        container.appendChild(wrapper);
    });
    
    // 聚焦第一个输入框
    const firstInput = container.querySelector('.word-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// 检查是否可以提交
function checkSubmitEnabled() {
    const inputs = document.querySelectorAll('.word-input');
    const allFilled = Array.from(inputs).every(input => input.value.trim().length > 0);
    document.getElementById('submitBtn').disabled = !allFilled || isAnswered;
}

// 显示清空按钮
function showClearButton() {
    const inputs = document.querySelectorAll('.word-input');
    const hasInput = Array.from(inputs).some(input => input.value.trim().length > 0);
    document.getElementById('clearBtn').style.display = hasInput && !isAnswered ? 'inline-flex' : 'none';
}

// 检查单个单词是否正确并显示对钩
function checkWordCorrect(input) {
    const wrapper = input.parentElement;
    const userWord = input.value.trim();
    const correctWord = input.dataset.correctWord;
    
    // 移除之前的对钩
    const existingCheck = wrapper.querySelector('.word-check-mark');
    if (existingCheck) {
        existingCheck.remove();
    }
    
    // 如果输入正确，显示对钩
    if (userWord.toLowerCase() === correctWord && userWord.length > 0) {
        const checkMark = document.createElement('div');
        checkMark.className = 'word-check-mark';
        checkMark.textContent = '✓';
        wrapper.appendChild(checkMark);
    }
}

// 清空重答
function clearAndRetry() {
    const inputs = document.querySelectorAll('.word-input');
    inputs.forEach(input => {
        input.value = '';
        input.disabled = false;
        input.classList.remove('correct', 'incorrect');
        
        // 移除对钩
        const wrapper = input.parentElement;
        const checkMark = wrapper.querySelector('.word-check-mark');
        if (checkMark) {
            checkMark.remove();
        }
    });
    
    // 重置按钮状态
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('submitBtn').disabled = true;
    
    // 隐藏反馈
    document.getElementById('feedback').style.display = 'none';
    
    // 聚焦第一个输入框
    const firstInput = document.querySelector('.word-input');
    if (firstInput) {
        firstInput.focus();
    }
}

// 显示题目
function showQuestion() {
    if (currentIndex >= questions.length) {
        showCompletion();
        return;
    }
    
    const question = questions[currentIndex];
    isAnswered = false;
    
    // 更新题目类型
    const typeMap = {
        'word': '单词',
        'phrase': '短语',
        'sentence': '句子'
    };
    document.getElementById('typeBadge').textContent = typeMap[question.type];
    
    // 更新中文提示
    document.getElementById('chineseText').textContent = question.chinese;
    
    // 隐藏音标
    document.getElementById('phoneticDisplay').style.display = 'none';
    
    // 创建单词输入框
    createWordInputs(question.english);
    
    // 隐藏反馈和清空按钮
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('clearBtn').style.display = 'none';
    
    // 更新进度
    updateProgress();
    
    // 更新词条列表状态
    updateWordListStatus();
    
    // 重置提交按钮
    document.getElementById('submitBtn').disabled = true;
}

// 提交答案
function submitAnswer() {
    if (isAnswered) return;
    
    const inputs = document.querySelectorAll('.word-input');
    if (inputs.length === 0) return;
    
    isAnswered = true;
    
    let allCorrect = true;
    const correctWords = [];
    const userWords = [];
    
    // 验证每个输入框
    inputs.forEach(input => {
        const userWord = input.value.trim();
        const correctWord = input.dataset.correctWord;
        const isWordCorrect = userWord.toLowerCase() === correctWord;
        
        userWords.push(userWord);
        correctWords.push(correctWord);
        
        if (isWordCorrect) {
            input.classList.add('correct');
            input.classList.remove('incorrect');
        } else {
            input.classList.add('incorrect');
            input.classList.remove('correct');
            allCorrect = false;
        }
        
        input.disabled = true;
    });
    
    // 更新统计
    if (allCorrect) {
        correctCount++;
    } else {
        wrongCount++;
    }
    updateStats();
    
    // 显示反馈
    const correctAnswer = questions[currentIndex].english;
    showFeedback(allCorrect, correctAnswer);
    
    // 隐藏提交、清空和跳过按钮，显示下一题按钮
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'inline-flex';
}

// 显示反馈
function showFeedback(isCorrect, correctAnswer) {
    const feedback = document.getElementById('feedback');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const correctAnswerEl = document.getElementById('correctAnswer');
    
    feedback.style.display = 'flex';
    
    if (isCorrect) {
        feedback.className = 'feedback correct';
        feedbackIcon.textContent = '✓';
        feedbackMessage.textContent = '回答正确！全部单词拼写正确！';
        correctAnswerEl.textContent = '';
    } else {
        feedback.className = 'feedback wrong';
        feedbackIcon.textContent = '✗';
        feedbackMessage.textContent = '有单词拼写错误';
        correctAnswerEl.innerHTML = `正确答案：<strong>${correctAnswer}</strong>`;
    }
}

// 下一题
function nextQuestion() {
    // 标记当前题目为已完成
    completedIndices.add(currentIndex);
    
    currentIndex++;
    
    // 重置按钮显示
    document.getElementById('submitBtn').style.display = 'inline-flex';
    document.getElementById('skipBtn').style.display = 'inline-flex';
    document.getElementById('nextBtn').style.display = 'none';
    
    showQuestion();
}

// 跳过题目
function skipQuestion() {
    wrongCount++;
    updateStats();
    
    const correctAnswer = questions[currentIndex].english;
    showFeedback(false, correctAnswer);
    
    isAnswered = true;
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'inline-flex';
}

// 更新进度
function updateProgress() {
    const progress = ((currentIndex + 1) / questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `${currentIndex + 1} / ${questions.length}`;
}

// 更新统计
function updateStats() {
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('wrongCount').textContent = wrongCount;
    
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

// 显示完成界面
function showCompletion() {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    document.getElementById('totalQuestions').textContent = questions.length;
    document.getElementById('finalCorrect').textContent = correctCount;
    document.getElementById('finalWrong').textContent = wrongCount;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';
    
    document.getElementById('completionModal').style.display = 'flex';
}

// 重新开始
function restartPractice() {
    document.getElementById('completionModal').style.display = 'none';
    
    // 重置所有状态
    currentIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    isAnswered = false;
    completedIndices.clear();
    
    // 重置UI
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('submitBtn').style.display = 'inline-flex';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'none';
    document.getElementById('questionTools').style.display = 'none';
    document.getElementById('phoneticDisplay').style.display = 'none';
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('chineseText').textContent = '请点击"开始练习"';
    document.getElementById('wordInputs').innerHTML = '';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0 / 0';
    
    updateStats();
    renderWordList();
}

// 显示音标
function showPhonetic() {
    const question = questions[currentIndex];
    const phoneticDisplay = document.getElementById('phoneticDisplay');
    const phoneticText = document.getElementById('phoneticText');
    
    phoneticText.textContent = question.phonetic;
    phoneticDisplay.style.display = 'block';
}

// 朗读英文
function speakEnglish() {
    const question = questions[currentIndex];
    
    // 检查浏览器是否支持语音合成
    if ('speechSynthesis' in window) {
        // 停止当前正在播放的语音
        window.speechSynthesis.cancel();
        
        // 创建语音对象
        const utterance = new SpeechSynthesisUtterance(question.english);
        
        // 设置语音参数
        utterance.lang = 'en-US'; // 英语
        utterance.rate = 0.8; // 语速（0.1-10，1为正常速度）
        utterance.pitch = 1; // 音调（0-2，1为正常音调）
        utterance.volume = 1; // 音量（0-1）
        
        // 播放语音
        window.speechSynthesis.speak(utterance);
        
        // 视觉反馈
        const speakBtn = document.getElementById('speakBtn');
        speakBtn.style.transform = 'scale(1.1)';
        speakBtn.style.color = '#667eea';
        speakBtn.style.borderColor = '#667eea';
        
        setTimeout(() => {
            speakBtn.style.transform = '';
            speakBtn.style.color = '';
            speakBtn.style.borderColor = '';
        }, 300);
    } else {
        alert('您的浏览器不支持语音朗读功能');
    }
}

// 初始化词条列表
function initializeWordList() {
    questions = [...questionBank];
    renderWordList();
}

// 渲染词条列表
function renderWordList() {
    const container = document.getElementById('wordItemsList');
    container.innerHTML = '';
    
    const filteredQuestions = currentFilter === 'all' 
        ? questions 
        : questions.filter(q => q.type === currentFilter);
    
    filteredQuestions.forEach((question, originalIndex) => {
        const actualIndex = questions.indexOf(question);
        const entry = createWordEntry(question, actualIndex);
        container.appendChild(entry);
    });
}

// 创建词条项
function createWordEntry(question, index) {
    const entry = document.createElement('div');
    entry.className = 'word-entry';
    entry.dataset.index = index;
    
    // 判断状态
    if (currentIndex === index) {
        entry.classList.add('active');
    }
    if (completedIndices.has(index)) {
        entry.classList.add('completed');
    }
    
    const typeMap = {
        'word': '单词',
        'phrase': '短语',
        'sentence': '句子'
    };
    
    let statusHtml = '';
    if (completedIndices.has(index)) {
        statusHtml = '<div class="word-entry-status"><span class="status-icon">✓</span>已完成</div>';
    } else if (currentIndex === index) {
        statusHtml = '<div class="word-entry-status"><span class="status-icon">▶</span>进行中</div>';
    }
    
    entry.innerHTML = `
        <div class="word-entry-header">
            <span class="word-entry-chinese">${question.chinese}</span>
            <span class="word-entry-type">${typeMap[question.type]}</span>
        </div>
        ${statusHtml}
    `;
    
    // 点击事件
    entry.addEventListener('click', function() {
        jumpToQuestion(index);
    });
    
    return entry;
}

// 跳转到指定题目
function jumpToQuestion(index) {
    // 如果还没开始练习，先开始
    if (document.getElementById('startBtn').style.display !== 'none') {
        startPractice();
    }
    
    currentIndex = index;
    showQuestion();
}

// 更新词条列表状态
function updateWordListStatus() {
    renderWordList();
    
    // 滚动到当前题目
    const activeEntry = document.querySelector('.word-entry.active');
    if (activeEntry) {
        activeEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
    const sidebar = document.getElementById('rightSidebar');
    const expandBtn = document.getElementById('sidebarExpandBtn');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    sidebar.classList.toggle('hidden');
    
    if (sidebar.classList.contains('hidden')) {
        expandBtn.style.display = 'flex';
        toggleBtn.querySelector('.toggle-icon').textContent = '▶';
        toggleBtn.title = '展开侧边栏';
    } else {
        expandBtn.style.display = 'none';
        toggleBtn.querySelector('.toggle-icon').textContent = '◀';
        toggleBtn.title = '收起侧边栏';
    }
}

// 打乱数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

