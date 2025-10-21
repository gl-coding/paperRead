// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 全局变量
let currentPage = 1;
let totalPages = 1;
let currentArticleId = null;
let deleteArticleId = null;
let uploadedFile = null;

// DOM元素
const articlesList = document.getElementById('articlesList');
const articleCount = document.getElementById('articleCount');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const difficultyFilter = document.getElementById('difficultyFilter');
const categoryFilter = document.getElementById('categoryFilter');
const clearFilterBtn = document.getElementById('clearFilterBtn');

// 模态框
const articleModal = document.getElementById('articleModal');
const uploadModal = document.getElementById('uploadModal');
const deleteModal = document.getElementById('deleteModal');

// 按钮
const newArticleBtn = document.getElementById('newArticleBtn');
const uploadFileBtn = document.getElementById('uploadFileBtn');
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
    // 搜索和筛选
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    difficultyFilter.addEventListener('change', handleSearch);
    categoryFilter.addEventListener('change', handleSearch);
    clearFilterBtn.addEventListener('click', clearFilters);

    // 新建文章
    newArticleBtn.addEventListener('click', openNewArticleModal);

    // 上传文件
    uploadFileBtn.addEventListener('click', openUploadModal);
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

// 加载文章列表
async function loadArticles(page = 1) {
    try {
        articlesList.innerHTML = '<div class="loading">加载中...</div>';

        const params = new URLSearchParams({
            page: page,
            page_size: 10
        });

        // 添加搜索参数
        const search = searchInput.value.trim();
        if (search) params.append('search', search);

        // 添加筛选参数
        const difficulty = difficultyFilter.value;
        if (difficulty) params.append('difficulty', difficulty);

        const category = categoryFilter.value;
        if (category) params.append('category', category);

        const response = await fetch(`${API_BASE_URL}/articles/?${params}`);
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
        
        return `
        <div class="article-card ${color}">
            <div class="article-card-header">
                <div class="article-select" onclick="toggleArticleSelect(${article.id})"></div>
                <h3 class="article-title">${escapeHtml(article.title)}</h3>
                <span class="article-badge">${badgeText}</span>
            </div>
            <div class="article-preview">${escapeHtml(article.content_preview || '')}</div>
            <a href="#" class="article-link" onclick="openReadingMode(${article.id}); return false;">
                → 查看完整内容
            </a>
            <div class="article-meta">
                <div class="article-meta-item">
                    <span>📅</span>
                    <span>${formatDate(article.created_at)}</span>
                </div>
                <div class="article-meta-item">
                    <span>✏️</span>
                    <span>${formatDateTime(article.updated_at)}</span>
                </div>
            </div>
            <div class="article-actions">
                <button class="btn btn-primary" onclick="openReadingMode(${article.id})">
                    👁️ 查看
                </button>
                <button class="btn btn-edit" onclick="editArticle(${article.id})">
                    ✏️ 编辑
                </button>
                <button class="btn" onclick="toggleArticleRead(${article.id})">
                    ☑️ 标记已读
                </button>
                <button class="btn btn-danger" onclick="confirmDeleteArticle(${article.id})">
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

// 编辑文章
async function editArticle(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${id}/`);
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

    const articleData = {
        title: articleTitle.value.trim(),
        content: articleContent.value.trim(),
        difficulty: articleDifficulty.value,
        category: articleCategory.value.trim() || null,
        source: articleSource.value.trim() || null
    };

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        let response;
        if (currentArticleId) {
            // 更新
            response = await fetch(`${API_BASE_URL}/articles/${currentArticleId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(articleData)
            });
        } else {
            // 创建
            response = await fetch(`${API_BASE_URL}/articles/`, {
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

    const articleData = {
        title: title,
        content: content,
        difficulty: uploadDifficulty.value,
        source: '文件上传'
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
        confirmDelete.disabled = true;
        confirmDelete.textContent = '删除中...';

        const response = await fetch(`${API_BASE_URL}/articles/${deleteArticleId}/`, {
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
    window.location.href = `index.html?article=${id}`;
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

