/**
 * 用户管理工具
 * 提供用户名获取、设置等功能
 */

// 获取当前用户名
function getUsername() {
    let username = localStorage.getItem('username');
    
    // 如果没有设置用户名，生成一个默认的访客ID
    if (!username) {
        username = generateGuestUsername();
        localStorage.setItem('username', username);
    }
    
    return username;
}

// 设置用户名
function setUsername(username) {
    localStorage.setItem('username', username);
    // 触发自定义事件，通知其他页面用户名已更改
    window.dispatchEvent(new CustomEvent('usernameChanged', { detail: { username } }));
}

// 检查是否已设置用户名（非访客）
function hasCustomUsername() {
    const username = localStorage.getItem('username');
    return username && !username.startsWith('Guest_');
}

// 生成访客用户名
function generateGuestUsername() {
    // 使用时间戳和随机数生成唯一的访客ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `Guest_${timestamp}_${random}`;
}

// 清除用户名（用于退出登录）
function clearUsername() {
    localStorage.removeItem('username');
    const newUsername = generateGuestUsername();
    localStorage.setItem('username', newUsername);
    window.dispatchEvent(new CustomEvent('usernameChanged', { detail: { username: newUsername } }));
}

// 获取用户显示名称
function getDisplayName() {
    const username = getUsername();
    if (username.startsWith('Guest_')) {
        return '访客';
    }
    return username;
}

// 获取头像文字
function getAvatarText() {
    const username = getUsername();
    if (username.startsWith('Guest_')) {
        return 'G';
    }
    // 取前两个字符作为头像
    return username.substring(0, 2).toUpperCase();
}

// 提示用户设置用户名
function promptSetUsername() {
    if (!hasCustomUsername()) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        message.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>👋 欢迎！</strong><br>
                <span style="font-size: 0.9rem;">设置用户名后，你的标注数据将独立保存</span>
            </div>
            <button onclick="goToProfile()" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 8px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                margin-right: 10px;
            ">去设置</button>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 6px;
                cursor: pointer;
            ">稍后</button>
        `;
        
        document.body.appendChild(message);
        
        // 10秒后自动消失
        setTimeout(() => {
            if (message.parentElement) {
                message.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (message.parentElement) {
                        document.body.removeChild(message);
                    }
                }, 300);
            }
        }, 10000);
    }
}

// 跳转到个人中心
function goToProfile() {
    window.location.href = 'profile.html';
}

// 添加CSS动画
if (!document.querySelector('#user-manager-animations')) {
    const style = document.createElement('style');
    style.id = 'user-manager-animations';
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
}

