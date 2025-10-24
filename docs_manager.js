// 文档管理 JavaScript

// 全局变量
let docsData = [];  // 文档树数据
let currentDoc = null;  // 当前选中的文档
let isEditing = false;  // 是否处于编辑模式
let contextMenuTarget = null;  // 右键菜单目标

// DOM 元素
const treeContainer = document.getElementById('treeContainer');
const docView = document.getElementById('docView');
const docEdit = document.getElementById('docEdit');
const docEditor = document.getElementById('docEditor');
const docTitle = document.getElementById('docTitle');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addRootBtn = document.getElementById('addRootBtn');
const contextMenu = document.getElementById('contextMenu');
const addChildBtn = document.getElementById('addChildBtn');
const renameBtn = document.getElementById('renameBtn');
const deleteBtn = document.getElementById('deleteBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadDocsData();
    renderTree();
    initEventListeners();
});

// 加载文档数据
function loadDocsData() {
    const saved = localStorage.getItem('paperread_docs_data');
    if (saved) {
        try {
            docsData = JSON.parse(saved);
        } catch (e) {
            console.error('加载文档数据失败:', e);
            docsData = getDefaultDocs();
        }
    } else {
        docsData = getDefaultDocs();
    }
}

// 获取默认文档
function getDefaultDocs() {
    return [
        {
            id: 'doc1',
            label: '欢迎使用',
            icon: '📘',
            content: `# 欢迎使用文档管理系统

## 功能特性

- ✅ **目录树结构** - 支持多级目录组织
- ✅ **Markdown 编辑** - 所见即所得的编辑体验
- ✅ **实时预览** - 编辑后立即查看渲染效果
- ✅ **本地存储** - 数据保存在浏览器本地

## 使用指南

### 创建文档
1. 点击左上角的 ➕ 按钮创建根目录
2. 右键点击目录可以添加子目录
3. 点击目录项查看文档内容

### 编辑文档
1. 选择一个文档
2. 点击右上角的 ✏️ 编辑按钮
3. 在编辑器中输入 Markdown 内容
4. 点击 💾 保存按钮保存修改

## Markdown 语法示例

### 标题
使用 # 号表示标题，一个 # 是一级标题，两个 ## 是二级标题，以此类推。

### 列表
- 无序列表项 1
- 无序列表项 2
  - 子列表项 2.1
  - 子列表项 2.2

1. 有序列表项 1
2. 有序列表项 2

### 代码
行内代码使用 \`code\`，代码块使用三个反引号：

\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

### 引用
> 这是一段引用文字
> 可以多行

### 链接和图片
[链接文字](https://example.com)
![图片描述](image-url.jpg)

### 表格
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |

---

**开始使用吧！** 🚀`,
            children: []
        }
    ];
}

// 保存文档数据
function saveDocsData() {
    localStorage.setItem('paperread_docs_data', JSON.stringify(docsData));
}

// 渲染目录树
function renderTree() {
    treeContainer.innerHTML = '';
    docsData.forEach(doc => {
        const treeItem = createTreeItem(doc);
        treeContainer.appendChild(treeItem);
    });
}

// 创建目录树项
function createTreeItem(doc, level = 0) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.dataset.id = doc.id;
    
    const hasChildren = doc.children && doc.children.length > 0;
    const icon = hasChildren ? '📁' : '📄';
    const expandIcon = hasChildren ? '▼' : '';
    
    const content = document.createElement('div');
    content.className = 'tree-item-content';
    if (currentDoc && currentDoc.id === doc.id) {
        content.classList.add('active');
    }
    
    content.innerHTML = `
        ${expandIcon ? `<span class="tree-item-icon">${expandIcon}</span>` : '<span class="tree-item-icon" style="width: 16px;"></span>'}
        <span style="margin-right: 8px;">${icon}</span>
        <span class="tree-item-label">${escapeHtml(doc.label)}</span>
    `;
    
    // 点击事件
    content.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.classList.contains('tree-item-icon') && hasChildren) {
            toggleExpand(item);
        } else {
            selectDoc(doc);
        }
    });
    
    // 右键菜单
    content.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, doc);
    });
    
    item.appendChild(content);
    
    // 子项
    if (hasChildren) {
        const children = document.createElement('div');
        children.className = 'tree-children';
        doc.children.forEach(child => {
            children.appendChild(createTreeItem(child, level + 1));
        });
        item.appendChild(children);
    }
    
    return item;
}

// 切换展开/折叠
function toggleExpand(item) {
    const children = item.querySelector('.tree-children');
    const icon = item.querySelector('.tree-item-icon');
    
    if (children) {
        children.classList.toggle('expanded');
        if (icon) {
            icon.classList.toggle('collapsed');
        }
    }
}

// 选择文档
function selectDoc(doc) {
    if (isEditing) {
        if (!confirm('有未保存的修改，是否放弃？')) {
            return;
        }
        exitEditMode();
    }
    
    currentDoc = doc;
    renderDoc();
    updateActiveItem();
}

// 渲染文档内容
function renderDoc() {
    if (!currentDoc) return;
    
    docTitle.textContent = currentDoc.label;
    editBtn.disabled = false;
    
    // 使用 marked 渲染 Markdown
    const html = marked.parse(currentDoc.content || '');
    docView.innerHTML = html;
}

// 更新激活状态
function updateActiveItem() {
    document.querySelectorAll('.tree-item-content').forEach(item => {
        item.classList.remove('active');
    });
    
    if (currentDoc) {
        const item = document.querySelector(`[data-id="${currentDoc.id}"] > .tree-item-content`);
        if (item) {
            item.classList.add('active');
        }
    }
}

// 进入编辑模式
function enterEditMode() {
    if (!currentDoc) return;
    
    isEditing = true;
    docEditor.value = currentDoc.content || '';
    
    docView.style.display = 'none';
    docEdit.style.display = 'flex';
    
    editBtn.style.display = 'none';
    saveBtn.style.display = 'flex';
    cancelBtn.style.display = 'flex';
}

// 退出编辑模式
function exitEditMode() {
    isEditing = false;
    
    docView.style.display = 'block';
    docEdit.style.display = 'none';
    
    editBtn.style.display = 'flex';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

// 保存文档
function saveDoc() {
    if (!currentDoc) return;
    
    currentDoc.content = docEditor.value;
    saveDocsData();
    exitEditMode();
    renderDoc();
    
    showNotification('💾 保存成功！');
}

// 添加根目录
function addRootDoc() {
    const label = prompt('请输入文档名称：');
    if (!label || !label.trim()) return;
    
    const newDoc = {
        id: 'doc_' + Date.now(),
        label: label.trim(),
        icon: '📄',
        content: `# ${label.trim()}\n\n开始编写内容...`,
        children: []
    };
    
    docsData.push(newDoc);
    saveDocsData();
    renderTree();
    selectDoc(newDoc);
}

// 显示右键菜单
function showContextMenu(e, doc) {
    contextMenuTarget = doc;
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
}

// 隐藏右键菜单
function hideContextMenu() {
    contextMenu.style.display = 'none';
    contextMenuTarget = null;
}

// 添加子文档
function addChildDoc() {
    if (!contextMenuTarget) return;
    
    const label = prompt('请输入文档名称：');
    if (!label || !label.trim()) return;
    
    const newDoc = {
        id: 'doc_' + Date.now(),
        label: label.trim(),
        icon: '📄',
        content: `# ${label.trim()}\n\n开始编写内容...`,
        children: []
    };
    
    if (!contextMenuTarget.children) {
        contextMenuTarget.children = [];
    }
    contextMenuTarget.children.push(newDoc);
    
    saveDocsData();
    renderTree();
    selectDoc(newDoc);
    hideContextMenu();
}

// 重命名文档
function renameDoc() {
    if (!contextMenuTarget) return;
    
    const newLabel = prompt('请输入新名称：', contextMenuTarget.label);
    if (!newLabel || !newLabel.trim()) return;
    
    contextMenuTarget.label = newLabel.trim();
    saveDocsData();
    renderTree();
    if (currentDoc && currentDoc.id === contextMenuTarget.id) {
        docTitle.textContent = newLabel.trim();
    }
    hideContextMenu();
}

// 删除文档
function deleteDoc() {
    if (!contextMenuTarget) return;
    
    if (!confirm(`确定要删除"${contextMenuTarget.label}"吗？\n此操作将同时删除所有子文档！`)) {
        hideContextMenu();
        return;
    }
    
    // 递归删除
    function removeDoc(data, targetId) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === targetId) {
                data.splice(i, 1);
                return true;
            }
            if (data[i].children && removeDoc(data[i].children, targetId)) {
                return true;
            }
        }
        return false;
    }
    
    removeDoc(docsData, contextMenuTarget.id);
    
    if (currentDoc && currentDoc.id === contextMenuTarget.id) {
        currentDoc = null;
        docTitle.textContent = '选择或创建文档';
        docView.innerHTML = `
            <div class="welcome-message">
                <h2>👋 欢迎使用文档管理</h2>
                <p>在左侧创建或选择一个文档开始编辑</p>
            </div>
        `;
        editBtn.disabled = true;
    }
    
    saveDocsData();
    renderTree();
    hideContextMenu();
}

// 初始化事件监听
function initEventListeners() {
    // 编辑按钮
    editBtn.addEventListener('click', enterEditMode);
    
    // 保存按钮
    saveBtn.addEventListener('click', saveDoc);
    
    // 取消按钮
    cancelBtn.addEventListener('click', () => {
        if (confirm('确定要放弃修改吗？')) {
            exitEditMode();
            renderDoc();
        }
    });
    
    // 添加根目录按钮
    addRootBtn.addEventListener('click', addRootDoc);
    
    // 右键菜单项
    addChildBtn.addEventListener('click', addChildDoc);
    renameBtn.addEventListener('click', renameDoc);
    deleteBtn.addEventListener('click', deleteDoc);
    
    // 点击其他地方隐藏右键菜单
    document.addEventListener('click', hideContextMenu);
    
    // 防止右键菜单被隐藏
    contextMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 显示通知
function showNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// 添加通知动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

