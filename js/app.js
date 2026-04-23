/**
 * Core Application Logic
 */

window.App = window.App || {};
window.App.views = window.App.views || {};

Object.assign(window.App, {
    currentView: 'dashboard',

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderView(this.currentView);
    },

    cacheDOM() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.contentArea = document.getElementById('app-content');
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
    }
});

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // A little timeout to ensure all views are loaded gracefully if network is slow
    setTimeout(() => {
        window.App.init();
    }, 100);
});
