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
    setupAiApiConfig();
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

// AI API 配置管理
function setupAiApiConfig() {
    const aiProvider = document.getElementById('aiProvider');
    const aiApiKey = document.getElementById('aiApiKey');
    const customApiUrlGroup = document.getElementById('customApiUrlGroup');
    const customApiUrl = document.getElementById('customApiUrl');
    const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
    const testApiBtn = document.getElementById('testApiBtn');
    const saveApiConfigBtn = document.getElementById('saveApiConfigBtn');
    const clearApiConfigBtn = document.getElementById('clearApiConfigBtn');
    const configStatus = document.getElementById('configStatus');
    
    // 加载保存的配置
    loadAiApiConfig();
    
    // 切换服务商时显示/隐藏自定义API地址
    aiProvider.addEventListener('change', () => {
        if (aiProvider.value === 'custom') {
            customApiUrlGroup.style.display = 'flex';
        } else {
            customApiUrlGroup.style.display = 'none';
        }
    });
    
    // 显示/隐藏API密钥
    toggleApiKeyBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止冒泡
        if (aiApiKey.type === 'password') {
            aiApiKey.type = 'text';
            toggleApiKeyBtn.textContent = '🙈';
        } else {
            aiApiKey.type = 'password';
            toggleApiKeyBtn.textContent = '👁️';
        }
    });
    
    // 测试API连接
    testApiBtn.addEventListener('click', testApiConnection);
    
    // 保存配置
    saveApiConfigBtn.addEventListener('click', saveAiApiConfig);
    
    // 清除配置
    clearApiConfigBtn.addEventListener('click', clearAiApiConfig);
}

// 加载AI API配置
function loadAiApiConfig() {
    try {
        const config = localStorage.getItem('paperread_ai_config');
        if (config) {
            const { provider, apiKey, customUrl } = JSON.parse(config);
            
            if (provider) {
                document.getElementById('aiProvider').value = provider;
                
                // 触发change事件以显示/隐藏自定义URL字段
                if (provider === 'custom') {
                    document.getElementById('customApiUrlGroup').style.display = 'flex';
                }
            }
            
            if (apiKey) {
                document.getElementById('aiApiKey').value = apiKey;
            }
            
            if (customUrl) {
                document.getElementById('customApiUrl').value = customUrl;
            }
            
            showConfigStatus('info', 'ℹ️', '已加载配置');
        }
    } catch (error) {
        console.error('加载AI API配置失败:', error);
    }
}

// 保存AI API配置
function saveAiApiConfig() {
    const provider = document.getElementById('aiProvider').value;
    const apiKey = document.getElementById('aiApiKey').value.trim();
    const customUrl = document.getElementById('customApiUrl').value.trim();
    
    if (!provider) {
        showConfigStatus('error', '❌', '请选择AI服务商');
        return;
    }
    
    if (!apiKey) {
        showConfigStatus('error', '❌', '请输入API密钥');
        return;
    }
    
    if (provider === 'custom' && !customUrl) {
        showConfigStatus('error', '❌', '请输入自定义API地址');
        return;
    }
    
    try {
        const config = {
            provider,
            apiKey,
            customUrl: provider === 'custom' ? customUrl : null
        };
        
        localStorage.setItem('paperread_ai_config', JSON.stringify(config));
        showConfigStatus('success', '✅', '配置保存成功！');
        showNotification('AI API配置已保存');
    } catch (error) {
        console.error('保存AI API配置失败:', error);
        showConfigStatus('error', '❌', '保存失败：' + error.message);
    }
}

// 清除AI API配置
function clearAiApiConfig() {
    if (!confirm('确定要清除AI API配置吗？')) {
        return;
    }
    
    try {
        localStorage.removeItem('paperread_ai_config');
        document.getElementById('aiProvider').value = '';
        document.getElementById('aiApiKey').value = '';
        document.getElementById('customApiUrl').value = '';
        document.getElementById('customApiUrlGroup').style.display = 'none';
        
        showConfigStatus('info', 'ℹ️', '配置已清除');
        showNotification('AI API配置已清除');
    } catch (error) {
        console.error('清除AI API配置失败:', error);
        showConfigStatus('error', '❌', '清除失败：' + error.message);
    }
}

// 测试API连接
async function testApiConnection() {
    const provider = document.getElementById('aiProvider').value;
    const apiKey = document.getElementById('aiApiKey').value.trim();
    
    if (!provider) {
        showConfigStatus('error', '❌', '请先选择AI服务商');
        return;
    }
    
    if (!apiKey) {
        showConfigStatus('error', '❌', '请先输入API密钥');
        return;
    }
    
    showConfigStatus('info', '⏳', '正在测试连接...');
    testApiBtn.disabled = true;
    
    try {
        // 这里可以调用后端API来测试连接
        // 为了演示，我们暂时使用简单的验证
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 简单验证API密钥格式
        let isValid = false;
        switch (provider) {
            case 'openai':
                isValid = apiKey.startsWith('sk-');
                break;
            case 'claude':
                isValid = apiKey.startsWith('sk-ant-');
                break;
            case 'gemini':
                isValid = apiKey.length > 20;
                break;
            case 'deepseek':
                isValid = apiKey.startsWith('sk-') && apiKey.length > 30;
                break;
            case 'custom':
                isValid = apiKey.length > 0;
                break;
        }
        
        if (isValid) {
            showConfigStatus('success', '✅', '连接测试成功！API密钥格式正确');
            showNotification('API连接测试成功');
        } else {
            showConfigStatus('error', '❌', 'API密钥格式不正确，请检查');
        }
        
    } catch (error) {
        console.error('测试API连接失败:', error);
        showConfigStatus('error', '❌', '测试失败：' + error.message);
    } finally {
        testApiBtn.disabled = false;
    }
}

// 显示配置状态
function showConfigStatus(type, icon, text) {
    const configStatus = document.getElementById('configStatus');
    const statusIcon = configStatus.querySelector('.status-icon');
    const statusText = configStatus.querySelector('.status-text');
    
    configStatus.className = `config-status-compact ${type}`;
    statusIcon.textContent = icon;
    statusText.textContent = text;
    configStatus.style.display = 'flex';
    
    // 3秒后自动隐藏（除了info类型）
    if (type !== 'info') {
        setTimeout(() => {
            configStatus.style.display = 'none';
        }, 5000);
    }
}

// 切换AI配置展开/收起
function toggleAiConfig() {
    const content = document.getElementById('aiConfigContent');
    const btn = document.getElementById('expandConfigBtn');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.classList.add('expanded');
        btn.textContent = '▲';
    } else {
        content.style.display = 'none';
        btn.classList.remove('expanded');
        btn.textContent = '▼';
    }
}

// 切换帮助信息
function toggleHelp(event) {
    event.preventDefault();
    const help = document.getElementById('configHelp');
    help.style.display = help.style.display === 'none' ? 'block' : 'none';
}

// 获取AI API配置（供其他页面使用）
function getAiApiConfig() {
    try {
        const config = localStorage.getItem('paperread_ai_config');
        return config ? JSON.parse(config) : null;
    } catch (error) {
        console.error('获取AI API配置失败:', error);
        return null;
    }
}

