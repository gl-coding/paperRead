// 导航栏控制脚本
// 根据用户设置显示/隐藏导航项

(function() {
    // 立即读取设置并生成样式
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
        settings: true  // 设置页面始终显示
    };
    
    // 合并默认值和已保存的设置
    const settings = { ...defaults, ...navSettings };
    
    // 导航项与页面的映射关系
    const navMapping = {
        'reading': 'index.html',
        'articles': 'articles_manager.html',
        'grammar': 'grammar.html',
        'grammar_articles': 'grammar_articles.html',
        'writing': 'writing.html',
        'words': 'words_graph.html',
        'dictation': 'dictation.html',
        'profile': 'profile.html',
        'settings': 'settings.html'
    };
    
    // 生成CSS样式来隐藏不需要的导航项
    let cssRules = '';
    Object.keys(navMapping).forEach(key => {
        if (settings[key] === false) {
            const href = navMapping[key];
            cssRules += `a.nav-item[href="${href}"] { display: none !important; }\n`;
        }
    });
    
    // 如果有需要隐藏的项，立即插入样式
    if (cssRules) {
        const style = document.createElement('style');
        style.textContent = cssRules;
        style.id = 'navbar-control-style';
        document.head.appendChild(style);
    }
    
    // 备用方案：DOM加载后再次确认应用
    document.addEventListener('DOMContentLoaded', function() {
        applyNavbarSettings();
    });
    
    function applyNavbarSettings() {
        // 应用设置到导航项（作为备用确认）
        Object.keys(navMapping).forEach(key => {
            const href = navMapping[key];
            const navItem = document.querySelector(`a.nav-item[href="${href}"]`);
            
            if (navItem) {
                if (settings[key] === false) {
                    navItem.style.display = 'none';
                } else {
                    navItem.style.display = '';
                }
            }
        });
    }
})();

