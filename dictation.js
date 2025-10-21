// 全局变量
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let isAnswered = false;

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
    
    // 回车提交
    document.getElementById('answerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !this.disabled && !isAnswered) {
            submitAnswer();
        }
    });
});

// 开始练习
function startPractice() {
    // 打乱题目顺序
    questions = shuffleArray([...questionBank]);
    currentIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    
    // 隐藏开始按钮，显示其他控件
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'inline-flex';
    document.getElementById('answerInput').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('questionTools').style.display = 'flex';
    
    // 显示第一题
    showQuestion();
    updateStats();
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
    
    // 清空输入框和反馈
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').className = 'answer-input';
    document.getElementById('feedback').style.display = 'none';
    
    // 更新进度
    updateProgress();
    
    // 聚焦输入框
    document.getElementById('answerInput').focus();
}

// 提交答案
function submitAnswer() {
    if (isAnswered) return;
    
    const userAnswer = document.getElementById('answerInput').value.trim();
    const correctAnswer = questions[currentIndex].english;
    
    if (!userAnswer) {
        alert('请输入答案');
        return;
    }
    
    isAnswered = true;
    
    // 判断答案（不区分大小写，忽略首尾空格）
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    // 更新统计
    if (isCorrect) {
        correctCount++;
    } else {
        wrongCount++;
    }
    updateStats();
    
    // 显示反馈
    showFeedback(isCorrect, correctAnswer);
    
    // 隐藏提交和跳过按钮，显示下一题按钮
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'inline-flex';
}

// 显示反馈
function showFeedback(isCorrect, correctAnswer) {
    const feedback = document.getElementById('feedback');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const correctAnswerEl = document.getElementById('correctAnswer');
    const answerInput = document.getElementById('answerInput');
    
    feedback.style.display = 'flex';
    
    if (isCorrect) {
        feedback.className = 'feedback correct';
        feedbackIcon.textContent = '✓';
        feedbackMessage.textContent = '回答正确！';
        correctAnswerEl.textContent = '';
        answerInput.className = 'answer-input correct';
    } else {
        feedback.className = 'feedback wrong';
        feedbackIcon.textContent = '✗';
        feedbackMessage.textContent = '回答错误';
        correctAnswerEl.innerHTML = `正确答案：<strong>${correctAnswer}</strong>`;
        answerInput.className = 'answer-input wrong';
    }
}

// 下一题
function nextQuestion() {
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
    
    // 重置UI
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('submitBtn').style.display = 'inline-flex';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('skipBtn').style.display = 'none';
    document.getElementById('questionTools').style.display = 'none';
    document.getElementById('phoneticDisplay').style.display = 'none';
    document.getElementById('answerInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('chineseText').textContent = '请点击"开始练习"';
    document.getElementById('answerInput').value = '';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0 / 0';
    
    updateStats();
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

// 打乱数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

