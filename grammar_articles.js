// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 全局变量
let currentPage = 1;
let totalPages = 1;
let currentArticleId = null;
let deleteArticleId = null;
let uploadedFile = null;
let currentTab = 'grammar'; // 当前选中的tab: grammar（语法文章）, mine（我的文章）

// DOM元素
const articlesList = document.getElementById('articlesList');
const articleCount = document.getElementById('articleCount');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const difficultyFilter = document.getElementById('difficultyFilter');
const categoryFilter = document.getElementById('categoryFilter');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const tabBtns = document.querySelectorAll('.articles-tabs .tab-btn');

// 模态框
const articleModal = document.getElementById('articleModal');
const uploadModal = document.getElementById('uploadModal');
const deleteModal = document.getElementById('deleteModal');

// 按钮
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeModal = document.getElementById('closeModal');
const closeUploadModal = document.getElementById('closeUploadModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');

// 表单
const articleForm = document.getElementById('articleForm');
const articleId = document.getElementById('articleId');
const articleTitle = document.getElementById('articleTitle');
const articleDifficulty = document.getElementById('articleDifficulty');
const articleCategory = document.getElementById('articleCategory');
const articleSource = document.getElementById('articleSource');
const articleContent = document.getElementById('articleContent');
const wordCountDisplay = document.getElementById('wordCountDisplay');
const charCountDisplay = document.getElementById('charCountDisplay');

// 上传相关
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileContentPreview = document.getElementById('fileContentPreview');
const uploadTitle = document.getElementById('uploadTitle');
const uploadDifficulty = document.getElementById('uploadDifficulty');
const cancelUpload = document.getElementById('cancelUpload');
const confirmUpload = document.getElementById('confirmUpload');

// 删除相关
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
    loadCategories();
    setupEventListeners();
});

// 设置事件监听
function setupEventListeners() {
    // Tab切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // 搜索和筛选
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    difficultyFilter.addEventListener('change', handleSearch);
    categoryFilter.addEventListener('change', handleSearch);
    clearFilterBtn.addEventListener('click', clearFilters);

    // 上传文件
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    cancelUpload.addEventListener('click', resetUpload);
    confirmUpload.addEventListener('click', handleUploadConfirm);

    // 文章表单
    articleForm.addEventListener('submit', handleArticleSubmit);
    cancelBtn.addEventListener('click', closeArticleModal);
    closeModal.addEventListener('click', closeArticleModal);
    articleContent.addEventListener('input', updateContentStats);

    // 上传模态框
    closeUploadModal.addEventListener('click', closeUploadModalFunc);

    // 删除模态框
    closeDeleteModal.addEventListener('click', closeDeleteModalFunc);
    cancelDelete.addEventListener('click', closeDeleteModalFunc);
    confirmDelete.addEventListener('click', handleDeleteConfirm);

    // 点击模态框外部关闭
    articleModal.addEventListener('click', (e) => {
        if (e.target === articleModal) closeArticleModal();
    });
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeUploadModalFunc();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModalFunc();
    });
}

// Tab切换函数
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1; // 切换tab时重置到第一页
    
    // 更新tab按钮状态
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 重新加载文章列表
    loadArticles();
}

// 加载文章列表
async function loadArticles(page = 1) {
    try {
        articlesList.innerHTML = '<div class="loading">加载中...</div>';

        // 根据当前tab选择不同的API端点
        let apiUrl = '';
        if (currentTab === 'grammar') {
            // 语法tab：使用grammar-articles API（系统语法文章）
            apiUrl = `${API_BASE_URL}/grammar-articles/`;
        } else if (currentTab === 'mine') {
            // 我的tab：使用user-grammar-articles API（用户语法文章）
            apiUrl = `${API_BASE_URL}/user-grammar-articles/`;
        }

        const params = new URLSearchParams({
            page: page,
            page_size: 10
        });

        // 始终添加用户名参数（用于获取阅读信息）
        const username = localStorage.getItem('paperread_username') || 'guest';
        params.append('username', username);

        // 添加搜索参数
        const search = searchInput.value.trim();
        if (search) params.append('search', search);

        // 添加筛选参数
        const difficulty = difficultyFilter.value;
        if (difficulty) params.append('difficulty', difficulty);

        const category = categoryFilter.value;
        if (category) params.append('category', category);

        const response = await fetch(`${apiUrl}?${params}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displayArticles(data.results);
            updatePagination(data);
            articleCount.textContent = `共 ${data.count} 篇文章`;
        } else {
            articlesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>暂无文章</p>
                    <p style="margin-top: 10px;">点击"新建文章"或"上传文件"开始创建</p>
                </div>
            `;
            pagination.innerHTML = '';
            articleCount.textContent = '共 0 篇文章';
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        articlesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>加载失败</p>
                <p style="margin-top: 10px;">请确保后端服务已启动</p>
                <button class="btn btn-primary" onclick="loadArticles()">重试</button>
            </div>
        `;
    }
}

// 显示文章列表
function displayArticles(articles) {
    const colors = ['blue', 'green', 'orange'];
    
    articlesList.innerHTML = articles.map((article, index) => {
        const color = colors[index % colors.length];
        const badgeText = article.category || getDifficultyText(article.difficulty);
        
        // 获取阅读进度（从localStorage）
        const readingProgress = getReadingProgressInfo(article.id);
        
        // 生成阅读信息HTML（和日期信息合并到一行）
        const lastReadTime = (article.reading_info?.read_at) 
            ? formatRelativeTime(article.reading_info.read_at) 
            : '';
        const progressText = readingProgress.currentPage > 1 
            ? `第 ${readingProgress.currentPage}/${readingProgress.totalPages} 页` 
            : '';
        
        return `
        <div class="article-card ${color}">
            <div class="article-card-header">
                <div class="favorite-icon-inline ${article.is_favorited ? 'favorited' : ''}" 
                     onclick="toggleFavorite(${article.id})" 
                     data-article-id="${article.id}"
                     title="${article.is_favorited ? '取消收藏' : '收藏'}">
                    ❤️
                </div>
                <h3 class="article-title" onclick="openReadingMode(${article.id})" style="cursor: pointer;">${escapeHtml(article.title)}</h3>
                <span class="article-badge">${badgeText}</span>
            </div>
            <div class="article-preview" onclick="openReadingMode(${article.id})" style="cursor: pointer;">${escapeHtml(article.content_preview || '')}</div>
            <div class="article-meta">
                <div class="article-meta-item">
                    ${lastReadTime ? `<span class="reading-time">📖 ${lastReadTime}</span>` : ''}
                    ${progressText ? `<span class="reading-progress">${progressText}</span>` : ''}
                    ${(lastReadTime || progressText) ? `<span class="meta-separator">•</span>` : ''}
                    <span>📅 ${formatDate(article.created_at)}</span>
                    ${article.updated_at ? `<span class="meta-separator">•</span><span>✏️ ${formatDate(article.updated_at)}</span>` : ''}
                </div>
            </div>
            <div class="article-actions">
                <button class="btn-action btn-preview" onclick="previewArticle(${article.id})" title="快速预览">
                    🔍 预览
                </button>
                <button class="btn-action btn-view" onclick="openReadingMode(${article.id})" title="查看文章">
                    👁️ 查看
                </button>
                <button class="btn-action btn-edit" onclick="editArticle(${article.id})" title="编辑文章">
                    ✏️ 编辑
                </button>
                <button class="btn-action btn-delete" onclick="confirmDeleteArticle(${article.id})" title="删除文章">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `;
    }).join('');
}

// 切换文章选择状态
function toggleArticleSelect(id) {
    const selectEl = event.target;
    selectEl.classList.toggle('selected');
}

// 切换已读状态
function toggleArticleRead(id) {
    // 这里可以添加标记已读的逻辑
    console.log('Toggle read status for article:', id);
}

// 切换收藏状态
async function toggleFavorite(articleId) {
    try {
        const username = localStorage.getItem('paperread_username') || 'guest';
        
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}/toggle_favorite/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        if (!response.ok) {
            throw new Error('操作失败');
        }
        
        const data = await response.json();
        
        // 找到对应的红心图标并更新
        const icon = document.querySelector(`.favorite-icon-inline[data-article-id="${articleId}"]`);
        if (icon) {
            if (data.is_favorited) {
                icon.classList.add('favorited');
                icon.title = '取消收藏';
            } else {
                icon.classList.remove('favorited');
                icon.title = '收藏';
            }
        }
        
        // 如果在收藏tab，需要刷新列表（因为取消收藏后文章应该从列表消失）
        if (currentTab === 'favorite' && !data.is_favorited) {
            setTimeout(() => loadArticles(currentPage), 300);
        }
        
        // 显示提示
        showNotification(data.message);
        
    } catch (error) {
        console.error('收藏操作失败:', error);
        alert('收藏操作失败，请重试');
    }
}

// 显示通知
function showNotification(message) {
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
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// 更新分页
function updatePagination(data) {
    const { count, next, previous } = data;
    currentPage = Math.floor((data.results.length > 0 ? 
        (count - data.results.length) : 0) / 10) + 1;
    totalPages = Math.ceil(count / 10);

    let paginationHTML = '';

    if (previous) {
        paginationHTML += `<button onclick="loadArticles(${currentPage - 1})">上一页</button>`;
    } else {
        paginationHTML += `<button disabled>上一页</button>`;
    }

    paginationHTML += `<span style="padding: 8px 15px;">${currentPage} / ${totalPages}</span>`;

    if (next) {
        paginationHTML += `<button onclick="loadArticles(${currentPage + 1})">下一页</button>`;
    } else {
        paginationHTML += `<button disabled>下一页</button>`;
    }

    pagination.innerHTML = paginationHTML;
}

// 加载分类列表
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/`);
        const data = await response.json();
        
        const categories = new Set();
        data.results.forEach(article => {
            if (article.category) categories.add(article.category);
        });

        categoryFilter.innerHTML = '<option value="">全部分类</option>';
        categories.forEach(cat => {
            categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 搜索和筛选
function handleSearch() {
    currentPage = 1;
    loadArticles(1);
}

function clearFilters() {
    searchInput.value = '';
    difficultyFilter.value = '';
    categoryFilter.value = '';
    loadArticles(1);
}

// 打开新建文章模态框
function openNewArticleModal() {
    document.getElementById('modalTitle').textContent = '新建文章';
    articleForm.reset();
    articleId.value = '';
    currentArticleId = null;
    updateContentStats();
    articleModal.style.display = 'flex';
}

// 打开创建文章模态框（别名函数，供按钮调用）
function openCreateModal() {
    openNewArticleModal();
}

// 编辑文章
async function editArticle(id) {
    try {
        // 根据当前tab选择不同的API端点
        let apiEndpoint = '';
        if (currentTab === 'grammar') {
            apiEndpoint = 'grammar-articles';
        } else if (currentTab === 'mine') {
            apiEndpoint = 'user-grammar-articles';
        }

        // 获取用户名并添加到请求参数
        const username = localStorage.getItem('paperread_username') || 'guest';
        const params = new URLSearchParams({ username });

        const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${id}/?${params}`);
        const article = await response.json();

        document.getElementById('modalTitle').textContent = '编辑文章';
        articleId.value = article.id;
        articleTitle.value = article.title;
        articleDifficulty.value = article.difficulty;
        articleCategory.value = article.category || '';
        articleSource.value = article.source || '';
        articleContent.value = article.content;
        currentArticleId = id;
        updateContentStats();
        articleModal.style.display = 'flex';
    } catch (error) {
        console.error('加载文章详情失败:', error);
        alert('加载文章失败');
    }
}

// 提交文章
async function handleArticleSubmit(e) {
    e.preventDefault();

    // 根据当前tab选择不同的API端点
    let apiEndpoint = '';
    if (currentTab === 'grammar') {
        apiEndpoint = 'grammar-articles';
    } else if (currentTab === 'mine') {
        apiEndpoint = 'user-grammar-articles';
    }

    const username = localStorage.getItem('paperread_username') || 'guest';
    const articleData = {
        title: articleTitle.value.trim(),
        content: articleContent.value.trim(),
        difficulty: articleDifficulty.value,
        category: articleCategory.value.trim() || null,
        source: articleSource.value.trim() || null,
        author: username  // 设置作者为当前用户
    };

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        let response;
        if (currentArticleId) {
            // 更新
            response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${currentArticleId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(articleData)
            });
        } else {
            // 创建
            response = await fetch(`${API_BASE_URL}/${apiEndpoint}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(articleData)
            });
        }

        if (response.ok) {
            closeArticleModal();
            loadArticles(currentPage);
            loadCategories();
            alert(currentArticleId ? '文章更新成功！' : '文章创建成功！');
        } else {
            const error = await response.json();
            alert('保存失败：' + JSON.stringify(error));
        }
    } catch (error) {
        console.error('保存文章失败:', error);
        alert('保存失败，请检查网络连接');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '保存';
    }
}

// 关闭文章模态框
function closeArticleModal() {
    articleModal.style.display = 'none';
    articleForm.reset();
    currentArticleId = null;
}

// 更新内容统计
function updateContentStats() {
    const content = articleContent.value;
    const words = content.trim().match(/\b[a-zA-Z]+\b/g) || [];
    wordCountDisplay.textContent = `单词数: ${words.length}`;
    charCountDisplay.textContent = `字符数: ${content.length}`;
}

// 打开上传模态框
function openUploadModal() {
    uploadModal.style.display = 'flex';
    resetUpload();
}

// 关闭上传模态框
function closeUploadModalFunc() {
    uploadModal.style.display = 'none';
    resetUpload();
}

// 重置上传
function resetUpload() {
    fileInput.value = '';
    uploadedFile = null;
    uploadArea.style.display = 'block';
    uploadPreview.style.display = 'none';
    uploadTitle.value = '';
    uploadDifficulty.value = 'intermediate';
}

// 文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
}

// 处理文件
function processFile(file) {
    if (!file.name.match(/\.(txt|md)$/i)) {
        alert('请上传 .txt 或 .md 文件');
        return;
    }

    uploadedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        fileContentPreview.value = content;
        
        // 自动生成标题（从文件名）
        const title = file.name.replace(/\.(txt|md)$/i, '').replace(/[-_]/g, ' ');
        uploadTitle.value = title;

        uploadArea.style.display = 'none';
        uploadPreview.style.display = 'block';
    };
    reader.readAsText(file);
}

// 确认上传
async function handleUploadConfirm() {
    const content = fileContentPreview.value.trim();
    const title = uploadTitle.value.trim() || uploadedFile.name;

    if (!content) {
        alert('文件内容为空');
        return;
    }

    const username = localStorage.getItem('paperread_username') || 'guest';
    const articleData = {
        title: title,
        content: content,
        difficulty: uploadDifficulty.value,
        source: '文件上传',
        author: username  // 设置作者为当前用户
    };

    try {
        confirmUpload.disabled = true;
        confirmUpload.textContent = '上传中...';

        const response = await fetch(`${API_BASE_URL}/articles/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(articleData)
        });

        if (response.ok) {
            closeUploadModalFunc();
            loadArticles(1);
            alert('文件上传成功！');
        } else {
            const error = await response.json();
            alert('上传失败：' + JSON.stringify(error));
        }
    } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败，请检查网络连接');
    } finally {
        confirmUpload.disabled = false;
        confirmUpload.textContent = '确认上传';
    }
}

// 确认删除
function confirmDeleteArticle(id) {
    deleteArticleId = id;
    deleteModal.style.display = 'flex';
}

// 关闭删除模态框
function closeDeleteModalFunc() {
    deleteModal.style.display = 'none';
    deleteArticleId = null;
}

// 执行删除
async function handleDeleteConfirm() {
    try {
        // 根据当前tab选择不同的API端点
        let apiEndpoint = '';
        if (currentTab === 'grammar') {
            apiEndpoint = 'grammar-articles';
        } else if (currentTab === 'mine') {
            apiEndpoint = 'user-grammar-articles';
        }

        confirmDelete.disabled = true;
        confirmDelete.textContent = '删除中...';

        const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${deleteArticleId}/`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModalFunc();
            loadArticles(currentPage);
            alert('文章已删除');
        } else {
            alert('删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请检查网络连接');
    } finally {
        confirmDelete.disabled = false;
        confirmDelete.textContent = '删除';
    }
}

// 打开阅读模式
function openReadingMode(id) {
    // 根据当前tab决定跳转到哪个页面
    if (currentTab === 'grammar') {
        // 语法tab：跳转到英语语法页面查看系统语法文章
        window.location.href = `grammar.html?id=${id}`;
    } else {
        // 我的tab：跳转到文章阅读页面查看用户文章
        window.location.href = `index.html?article=${id}`;
    }
}

// 工具函数
function getDifficultyText(difficulty) {
    const map = {
        beginner: '初级',
        intermediate: '中级',
        advanced: '高级'
    };
    return map[difficulty] || difficulty;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
}

function getReadingProgressInfo(articleId) {
    try {
        const username = localStorage.getItem('paperread_username') || 'guest';
        const key = `paperread_reading_progress_${username}_${articleId}`;
        const progressData = localStorage.getItem(key);
        
        if (progressData) {
            const data = JSON.parse(progressData);
            return {
                currentPage: data.currentPage || 1,
                totalPages: data.totalPages || 1,
                lastReadAt: data.lastReadAt || null
            };
        }
    } catch (error) {
        console.error('获取阅读进度失败:', error);
    }
    
    return {
        currentPage: 1,
        totalPages: 1,
        lastReadAt: null
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// AI生成内容
async function generateContent() {
    const aiPrompt = document.getElementById('aiPrompt');
    const articleContent = document.getElementById('articleContent');
    const generateBtn = document.getElementById('generateBtn');
    const generateStatus = document.getElementById('generateStatus');
    
    const prompt = aiPrompt.value.trim();
    
    if (!prompt) {
        alert('请输入提示词');
        return;
    }
    
    // 获取AI API配置
    let aiConfig = null;
    try {
        const configStr = localStorage.getItem('paperread_ai_config');
        if (configStr) {
            aiConfig = JSON.parse(configStr);
        }
    } catch (error) {
        console.error('读取AI配置失败:', error);
    }
    
    // 如果没有配置，提示用户
    if (!aiConfig || !aiConfig.provider || !aiConfig.apiKey) {
        if (confirm('您还没有配置AI API。是否前往个人中心配置？')) {
            window.location.href = 'profile.html';
        }
        return;
    }
    
    try {
        // 根据当前tab选择不同的API端点
        let apiEndpoint = '';
        if (currentTab === 'grammar') {
            apiEndpoint = 'grammar-articles';
        } else if (currentTab === 'mine') {
            apiEndpoint = 'user-grammar-articles';
        }

        // 禁用按钮并显示状态
        generateBtn.disabled = true;
        generateStatus.style.display = 'flex';
        generateStatus.querySelector('.status-text').textContent = '正在生成中...';
        
        // 调用后端API生成内容，传递AI配置
        const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/generate_content/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                prompt: prompt,
                ai_config: aiConfig  // 传递AI配置给后端
            })
        });
        
        if (!response.ok) {
            throw new Error('生成失败');
        }
        
        const data = await response.json();
        
        // 将生成的内容填充到文章内容框
        if (data.content) {
            articleContent.value = data.content;
            updateContentStats();
            
            // 更新状态
            generateStatus.querySelector('.status-icon').textContent = '✅';
            generateStatus.querySelector('.status-text').textContent = '生成成功！';
            generateStatus.style.color = '#4caf50';
            
            // 3秒后隐藏状态
            setTimeout(() => {
                generateStatus.style.display = 'none';
                generateStatus.querySelector('.status-icon').textContent = '⏳';
                generateStatus.style.color = '#4caf50';
            }, 3000);
        }
        
    } catch (error) {
        console.error('生成内容失败:', error);
        
        // 显示错误状态
        generateStatus.querySelector('.status-icon').textContent = '❌';
        generateStatus.querySelector('.status-text').textContent = '生成失败，请重试';
        generateStatus.style.color = '#f44336';
        
        setTimeout(() => {
            generateStatus.style.display = 'none';
            generateStatus.querySelector('.status-icon').textContent = '⏳';
            generateStatus.style.color = '#4caf50';
        }, 3000);
    } finally {
        generateBtn.disabled = false;
    }
}

// 预览文章
let currentPreviewArticleId = null;

async function previewArticle(id) {
    try {
        // 根据当前tab选择不同的API端点
        let apiEndpoint = '';
        if (currentTab === 'grammar') {
            apiEndpoint = 'grammar-articles';
        } else if (currentTab === 'mine') {
            apiEndpoint = 'user-grammar-articles';
        }

        // 显示模态框
        const previewModal = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = '<div class="loading">加载中...</div>';
        previewModal.style.display = 'flex';
        
        currentPreviewArticleId = id;

        // 获取用户名并添加到请求参数
        const username = localStorage.getItem('paperread_username') || 'guest';
        const params = new URLSearchParams({ username });

        // 获取文章详情
        const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${id}/?${params}`);
        const article = await response.json();

        // 更新标题
        document.getElementById('previewTitle').textContent = article.title;

        // 更新信息
        const difficultyMap = {
            'beginner': '初级',
            'intermediate': '中级',
            'advanced': '高级'
        };
        document.getElementById('previewDifficulty').textContent = difficultyMap[article.difficulty] || article.difficulty;
        document.getElementById('previewCategory').textContent = article.category || '未分类';
        document.getElementById('previewMeta').textContent = `字数：${article.word_count} | 段落：${article.paragraph_count}`;

        // 显示内容
        const formattedContent = article.content
            .split('\n\n')
            .map(para => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
            .join('');
        previewContent.innerHTML = formattedContent;

        // 设置打开按钮
        document.getElementById('openFullArticle').onclick = () => {
            closePreviewModal();
            openReadingMode(id);
        };

    } catch (error) {
        console.error('加载文章预览失败:', error);
        document.getElementById('previewContent').innerHTML = '<p class="error">加载失败，请重试</p>';
    }
}

// 关闭预览模态框
function closePreviewModal() {
    const previewModal = document.getElementById('previewModal');
    previewModal.style.display = 'none';
    currentPreviewArticleId = null;
}

// 设置预览模态框事件监听
document.addEventListener('DOMContentLoaded', () => {
    const closePreviewBtn = document.getElementById('closePreviewModal');
    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', closePreviewModal);
    }

    // 点击模态框背景关闭
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closePreviewModal();
            }
        });
    }
});

