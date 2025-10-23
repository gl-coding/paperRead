// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 更新用户显示（使用user-manager.js中的函数）
function updateUserDisplay() {
    const displayUsername = document.getElementById('displayUsername');
    const avatarText = document.getElementById('avatarText');
    
    displayUsername.textContent = getDisplayName();
    avatarText.textContent = getAvatarText();
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateUserDisplay();
    loadStatistics();
    loadRecentArticles();
    setupEventListeners();
    setupUsernameEditor();
});

// 设置用户名编辑器
function setupUsernameEditor() {
    const editBtn = document.getElementById('editUsernameBtn');
    const editSection = document.getElementById('usernameEditSection');
    const saveBtn = document.getElementById('saveUsernameBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const usernameInput = document.getElementById('usernameInput');
    
    // 编辑按钮
    editBtn.addEventListener('click', () => {
        editSection.style.display = 'block';
        usernameInput.value = getUsername() || '';
        usernameInput.focus();
    });
    
    // 保存按钮
    saveBtn.addEventListener('click', () => {
        const newUsername = usernameInput.value.trim();
        
        if (!newUsername) {
            alert('请输入用户名');
            return;
        }
        
        if (newUsername.length < 2 || newUsername.length > 20) {
            alert('用户名长度应在2-20个字符之间');
            return;
        }
        
        setUsername(newUsername);
        updateUserDisplay();
        editSection.style.display = 'none';
        
        showNotification('用户名设置成功！你的标注数据已独立保存');
    });
    
    // 取消按钮
    cancelBtn.addEventListener('click', () => {
        editSection.style.display = 'none';
    });
    
    // 回车保存
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// 设置事件监听
function setupEventListeners() {
    // 新建文章按钮
    document.getElementById('newArticleBtn').addEventListener('click', openNewArticleModal);
    
    // 上传文章按钮
    document.getElementById('uploadArticleBtn').addEventListener('click', openUploadModal);
    
    // 导出数据按钮
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    
    // 文章表单提交
    document.getElementById('articleForm').addEventListener('submit', handleArticleSubmit);
    
    // 文件上传
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
}

// 加载统计信息
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/`);
        const data = await response.json();
        
        // 文章总数
        document.getElementById('articleCount').textContent = data.count || 0;
        
        // 计算总词汇量
        let totalWords = 0;
        if (data.results) {
            data.results.forEach(article => {
                totalWords += article.word_count || 0;
            });
        }
        document.getElementById('totalWords').textContent = totalWords.toLocaleString();
        
        // 标注单词数（示例数据，需要从实际API获取）
        document.getElementById('annotationCount').textContent = '0';
        
        // 阅读次数（示例数据）
        document.getElementById('readingCount').textContent = data.count || 0;
        
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 加载最近阅读
async function loadRecentArticles() {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/?page_size=5`);
        const data = await response.json();
        
        const recentList = document.getElementById('recentArticles');
        
        if (!data.results || data.results.length === 0) {
            recentList.innerHTML = '<p class="empty-state">暂无阅读记录</p>';
            return;
        }
        
        recentList.innerHTML = data.results.map(article => `
            <div class="recent-item" onclick="openArticle(${article.id})">
                <div class="recent-info">
                    <div class="recent-title">${escapeHtml(article.title)}</div>
                    <div class="recent-meta">
                        ${article.category || '未分类'} • ${article.word_count || 0} 词
                    </div>
                </div>
                <div class="recent-date">${formatDate(article.updated_at)}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('加载最近阅读失败:', error);
    }
}

// 打开文章
function openArticle(id) {
    window.location.href = `index.html?article=${id}`;
}

// 打开新建文章模态框
function openNewArticleModal() {
    document.getElementById('modalTitle').textContent = '新建文章';
    document.getElementById('articleForm').reset();
    document.getElementById('articleModal').style.display = 'block';
}

// 关闭文章模态框
function closeArticleModal() {
    document.getElementById('articleModal').style.display = 'none';
}

// 处理文章表单提交
async function handleArticleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    const category = document.getElementById('articleCategory').value.trim();
    const difficulty = document.getElementById('articleDifficulty').value;
    const source = document.getElementById('articleSource').value.trim();
    
    if (!title || !content) {
        alert('请填写标题和内容');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/articles/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                category: category || null,
                difficulty: difficulty || null,
                source: source || null,
            })
        });
        
        if (response.ok) {
            alert('文章创建成功！');
            closeArticleModal();
            loadStatistics();
            loadRecentArticles();
        } else {
            alert('创建失败，请重试');
        }
    } catch (error) {
        console.error('创建文章失败:', error);
        alert('创建失败：' + error.message);
    }
}

// 打开上传模态框
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
}

// 关闭上传模态框
function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        readFile(file);
    }
}

// 处理拖拽
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
        readFile(file);
    } else {
        alert('请上传 .txt 文件');
    }
}

// 读取文件
function readFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        const title = file.name.replace('.txt', '');
        
        document.getElementById('uploadTitle').value = title;
        document.getElementById('uploadContent').value = content;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'block';
    };
    
    reader.onerror = function() {
        alert('文件读取失败');
    };
    
    reader.readAsText(file);
}

// 保存上传的文章
async function saveUploadedArticle() {
    const title = document.getElementById('uploadTitle').value.trim();
    const content = document.getElementById('uploadContent').value.trim();
    const category = document.getElementById('uploadCategory').value.trim();
    const difficulty = document.getElementById('uploadDifficulty').value;
    
    if (!title || !content) {
        alert('标题和内容不能为空');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/articles/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                category: category || null,
                difficulty: difficulty || null,
            })
        });
        
        if (response.ok) {
            alert('文章上传成功！');
            closeUploadModal();
            loadStatistics();
            loadRecentArticles();
        } else {
            alert('上传失败，请重试');
        }
    } catch (error) {
        console.error('上传文章失败:', error);
        alert('上传失败：' + error.message);
    }
}

// 导出数据
async function exportData() {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            alert('没有数据可导出');
            return;
        }
        
        // 创建CSV格式数据
        let csv = '标题,分类,难度,词数,创建时间\n';
        data.results.forEach(article => {
            csv += `"${article.title}","${article.category || ''}","${article.difficulty || ''}","${article.word_count || 0}","${article.created_at}"\n`;
        });
        
        // 下载文件
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `文章数据_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('数据导出成功！');
    } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出失败：' + error.message);
    }
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const articleModal = document.getElementById('articleModal');
    const uploadModal = document.getElementById('uploadModal');
    
    if (event.target === articleModal) {
        closeArticleModal();
    }
    if (event.target === uploadModal) {
        closeUploadModal();
    }
}

