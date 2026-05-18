/**
 * Core Application Logic
 */

window.App = window.App || {};
window.App.views = window.App.views || {};

Object.assign(window.App, {
    currentView: 'dashboard',
    theme: 'dark',
    user: null,

    async init() {
        this.cacheDOM();
        await this.loadUser();
        await this.loadTheme();
        this.bindEvents();
        this.renderView(this.currentView);
    },

    cacheDOM() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.contentArea = document.getElementById('app-content');
        this.themeToggle = document.getElementById('btnThemeToggle');
        this.userAvatar = document.getElementById('userAvatar');
        this.userName = document.getElementById('userName');
    },

    async loadUser() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.updateUserUI();
            } else {
                // Not authenticated, redirect to login
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = '/login';
        }
    },

    updateUserUI() {
        if (this.user && this.userAvatar && this.userName) {
            if (this.user.avatar) {
                this.userAvatar.src = this.user.avatar;
            } else {
                // Generate avatar from name
                const name = this.user.name || 'User';
                this.userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;
            }
            this.userName.textContent = this.user.name || 'User';
        }
    },

    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = item.getAttribute('data-view');
                if (viewName !== this.currentView) {
                    this.setActiveNav(item);
                    this.renderView(viewName);
                }
            });
        });

        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },

    setActiveNav(activeItem) {
        this.navItems.forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    },

    renderView(viewName) {
        this.currentView = viewName;
        // Fade out effect
        this.contentArea.style.opacity = 0;
        
        setTimeout(() => {
            if (this.views[viewName]) {
                this.contentArea.innerHTML = this.views[viewName].render();
                // If view has afterRender method, execute it
                if (typeof this.views[viewName].afterRender === 'function') {
                    this.views[viewName].afterRender();
                }
            } else {
                this.contentArea.innerHTML = `
                    <div class="card animate-fade-in">
                        <h2>View Not Found</h2>
                        <p class="text-secondary">The view '${viewName}' is under construction.</p>
                    </div>
                `;
            }
            
            // Fade UI back in
            this.contentArea.style.opacity = 1;
            // Re-trigger animation
            const animateElements = this.contentArea.querySelectorAll('.will-animate');
            animateElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
            });

        }, 200);
    },

    async loadTheme() {
        let theme = localStorage.getItem('ui_theme') || 'dark';
        try {
            const config = await this.api.getConfig();
            if (config.ui_theme) theme = config.ui_theme;
        } catch (err) {
            console.warn('Unable to load theme config', err);
        }
        this.setTheme(theme);
    },

    setTheme(theme) {
        const normalized = theme === 'light' ? 'light' : 'dark';
        this.theme = normalized;
        document.documentElement.setAttribute('data-theme', normalized);
        localStorage.setItem('ui_theme', normalized);
        this.updateThemeToggleIcon();
    },

    toggleTheme() {
        const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(nextTheme);
    },

    updateThemeToggleIcon() {
        if (!this.themeToggle) {
            this.themeToggle = document.getElementById('btnThemeToggle');
        }
        if (!this.themeToggle) return;

        const iconClass = this.theme === 'dark' ? 'uil-sun' : 'uil-moon';
        this.themeToggle.innerHTML = `<i class="uil ${iconClass}"></i>`;
        this.themeToggle.title = this.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
});

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // A little timeout to ensure all views are loaded gracefully if network is slow
    setTimeout(() => {
        window.App.init();
    }, 100);
});
