// 设置管理
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素
    const defaultColor = document.getElementById('defaultColor');
    const autoSave = document.getElementById('autoSave');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const changelogBtn = document.getElementById('changelogBtn');
    
    // 分页设置元素
    const paginationMode = document.getElementById('paginationMode');
    const smartPaginationSettings = document.getElementById('smartPaginationSettings');
    const fixedPaginationSettings = document.getElementById('fixedPaginationSettings');
    const targetChars = document.getElementById('targetChars');
    const minChars = document.getElementById('minChars');
    const maxChars = document.getElementById('maxChars');
    const minParagraphs = document.getElementById('minParagraphs');
    const maxParagraphs = document.getElementById('maxParagraphs');
    const fixedPageSize = document.getElementById('fixedPageSize');
    
    // 导航栏设置元素
    const navCheckboxes = document.querySelectorAll('.nav-tabs-settings input[type="checkbox"]');

    // 加载保存的设置
    loadSettings();

    // 默认标注颜色
    defaultColor.addEventListener('change', function() {
        const color = this.value;
        saveSettings('defaultColor', color);
    });

    // 分页模式切换
    paginationMode.addEventListener('change', function() {
        const mode = this.value;
        saveSettings('paginationMode', mode);
        
        // 显示/隐藏对应的设置项
        if (mode === 'smart') {
            smartPaginationSettings.style.display = 'block';
            fixedPaginationSettings.style.display = 'none';
        } else {
            smartPaginationSettings.style.display = 'none';
            fixedPaginationSettings.style.display = 'block';
        }
        
        showNotification('分页模式已切换，刷新阅读页面生效');
    });

    // 智能分页参数
    targetChars.addEventListener('change', function() {
        savePaginationConfig();
    });
    
    minChars.addEventListener('change', function() {
        savePaginationConfig();
    });
    
    maxChars.addEventListener('change', function() {
        savePaginationConfig();
    });
    
    minParagraphs.addEventListener('change', function() {
        savePaginationConfig();
    });
    
    maxParagraphs.addEventListener('change', function() {
        savePaginationConfig();
    });

    // 固定段落数
    fixedPageSize.addEventListener('change', function() {
        const value = this.value;
        saveSettings('fixedPageSize', value);
        showNotification('段落显示设置已保存，刷新阅读页面生效');
    });

    // 自动保存
    autoSave.addEventListener('change', function() {
        const enabled = this.checked;
        saveSettings('autoSave', enabled);
    });
    
    // 导航栏标签设置
    navCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            saveNavSettings();
        });
    });

    // 清除缓存
    clearCacheBtn.addEventListener('click', function() {
        if (confirm('确定要清除所有缓存数据吗？此操作不可恢复。')) {
            clearCache();
        }
    });

    // 导出数据
    exportDataBtn.addEventListener('click', function() {
        exportData();
    });

    // 更新日志
    changelogBtn.addEventListener('click', function() {
        showChangelog();
    });
});

// 加载设置
function loadSettings() {
    const defaultColor = localStorage.getItem('defaultColor') || '#28a745';
    const autoSave = localStorage.getItem('autoSave') !== 'false';
    
    // 分页设置
    const paginationMode = localStorage.getItem('paginationMode') || 'smart';
    const paginationConfig = JSON.parse(localStorage.getItem('paginationConfig') || '{}');
    const defaultConfig = {
        targetChars: 4000,
        minChars: 2000,
        maxChars: 8000,
        minParagraphs: 2,
        maxParagraphs: 15
    };
    const config = { ...defaultConfig, ...paginationConfig };
    const fixedPageSize = localStorage.getItem('fixedPageSize') || '8';

    document.getElementById('defaultColor').value = defaultColor;
    document.getElementById('autoSave').checked = autoSave;
    
    // 加载分页设置
    document.getElementById('paginationMode').value = paginationMode;
    document.getElementById('targetChars').value = config.targetChars;
    document.getElementById('minChars').value = config.minChars;
    document.getElementById('maxChars').value = config.maxChars;
    document.getElementById('minParagraphs').value = config.minParagraphs;
    document.getElementById('maxParagraphs').value = config.maxParagraphs;
    document.getElementById('fixedPageSize').value = fixedPageSize;
    
    // 显示/隐藏对应的设置项
    const smartPaginationSettings = document.getElementById('smartPaginationSettings');
    const fixedPaginationSettings = document.getElementById('fixedPaginationSettings');
    if (paginationMode === 'smart') {
        smartPaginationSettings.style.display = 'block';
        fixedPaginationSettings.style.display = 'none';
    } else {
        smartPaginationSettings.style.display = 'none';
        fixedPaginationSettings.style.display = 'block';
    }
    
    // 加载导航栏设置
    loadNavSettings();
}

// 保存智能分页配置
function savePaginationConfig() {
    const config = {
        targetChars: parseInt(document.getElementById('targetChars').value),
        minChars: parseInt(document.getElementById('minChars').value),
        maxChars: parseInt(document.getElementById('maxChars').value),
        minParagraphs: parseInt(document.getElementById('minParagraphs').value),
        maxParagraphs: parseInt(document.getElementById('maxParagraphs').value)
    };
    
    // 验证参数合理性
    if (config.minChars >= config.targetChars) {
        showNotification('最少字符数应小于目标字符数', 'error');
        return;
    }
    if (config.targetChars >= config.maxChars) {
        showNotification('目标字符数应小于最多字符数', 'error');
        return;
    }
    if (config.minParagraphs >= config.maxParagraphs) {
        showNotification('最少段落数应小于最多段落数', 'error');
        return;
    }
    
    localStorage.setItem('paginationConfig', JSON.stringify(config));
    showNotification('智能分页参数已保存，刷新阅读页面生效');
}

// 加载导航栏设置
function loadNavSettings() {
    const navSettings = JSON.parse(localStorage.getItem('navTabs') || '{}');
    
    // 默认所有标签都显示
    const defaults = {
        reading: true,
        articles: true,
        grammar: true,
        grammar_articles: true,
        writing: true,
        words: true,
        dictation: true,
        profile: true,
        settings: true
    };
    
    // 合并默认值和已保存的设置
    const settings = { ...defaults, ...navSettings };
    
    // 应用到复选框
    document.querySelectorAll('.nav-tabs-settings input[type="checkbox"]').forEach(checkbox => {
        const navKey = checkbox.dataset.nav;
        if (navKey && settings.hasOwnProperty(navKey)) {
            checkbox.checked = settings[navKey];
        }
    });
}

// 保存导航栏设置
function saveNavSettings() {
    const settings = {};
    
    document.querySelectorAll('.nav-tabs-settings input[type="checkbox"]').forEach(checkbox => {
        const navKey = checkbox.dataset.nav;
        if (navKey) {
            settings[navKey] = checkbox.checked;
        }
    });
    
    localStorage.setItem('navTabs', JSON.stringify(settings));
    showNotification('导航栏设置已保存，刷新页面生效');
}

// 保存设置
function saveSettings(key, value) {
    localStorage.setItem(key, value);
    showNotification('设置已保存');
}

// 清除缓存
function clearCache() {
    try {
        // 只清除特定的缓存项，保留设置
        const keysToKeep = [
            'defaultColor', 
            'autoSave', 
            'navTabs', 
            'paginationMode', 
            'paginationConfig', 
            'fixedPageSize',
            'controlsDrawerState'  // 保留抽屉状态
        ];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        showNotification('缓存已清除', 'success');
    } catch (error) {
        showNotification('清除失败: ' + error.message, 'error');
    }
}

// 导出数据
function exportData() {
    try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `english-reader-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('数据已导出', 'success');
    } catch (error) {
        showNotification('导出失败: ' + error.message, 'error');
    }
}

// 显示更新日志
function showChangelog() {
    alert(`版本 v1.0.0 更新内容：
    
• 新增单词关系图可视化
• 新增单词默写功能
• 新增系统设置页面
• 优化文章阅读体验
• 改进标注和翻译功能
• 修复若干已知问题

感谢使用！`);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 简单的通知实现
    console.log(`[${type}] ${message}`);
    
    // 创建临时通知元素
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

