window.App = window.App || { views: {} };
window.App.views.dashboard = {
    render() {
        return `
            <div class="will-animate">
                <h2 style="margin-bottom: 24px;">Dashboard Overview</h2>
                <div class="grid grid-cols-3" id="dashboardStats">
                    <div class="card">Loading...</div>
                    <div class="card">Loading...</div>
                    <div class="card">Loading...</div>
                </div>
                
                <div class="grid grid-cols-2" style="margin-top: 24px;">
                    <div class="card">
                        <h4 class="text-secondary" style="margin-bottom: 16px;">System Logs / Recent Checks</h4>
                        <div id="recentActivity" style="display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;">
                            <!-- Activity logic -->
                            Loading activity...
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    async afterRender() {
        await this.loadDashboardData();
    },
    
    async loadDashboardData() {
        const statsEl = document.getElementById('dashboardStats');
        const activityEl = document.getElementById('recentActivity');
        try {
            const clients = await window.App.api.getClients();
            
            const totalClients = clients.length;
            let avgHealth = 0;
            let healthyCount = 0;
            let riskCount = 0;
            
            if (totalClients > 0) {
                const totalScore = clients.reduce((acc, c) => acc + c.health_score, 0);
                avgHealth = (totalScore / totalClients).toFixed(1);
                healthyCount = clients.filter(c => c.health_score >= 80).length;
                riskCount = clients.filter(c => c.health_score < 60).length;
            }
            
            statsEl.innerHTML = `
                <div class="card">
                    <h4 class="text-secondary">Total Clients</h4>
                    <h2 style="font-size: 2rem; margin-top: 8px;">${totalClients}</h2>
                    <p class="text-primary" style="font-size: 0.85rem; margin-top: 8px;">Managed via Database</p>
                </div>
                <div class="card">
                    <h4 class="text-secondary">Avg Health Score</h4>
                    <h2 style="font-size: 2rem; margin-top: 8px; color: ${avgHealth >= 80 ? 'var(--success)' : avgHealth >= 60 ? 'var(--warning)' : 'var(--danger)'};">${avgHealth}</h2>
                    <p class="text-secondary" style="font-size: 0.85rem; margin-top: 8px;">${healthyCount} Healthy Clients</p>
                </div>
                <div class="card">
                    <h4 class="text-secondary">Clients At Risk</h4>
                    <h2 style="font-size: 2rem; margin-top: 8px; color: var(--danger);">${riskCount}</h2>
                    <p class="text-danger" style="font-size: 0.85rem; margin-top: 8px;">Health Score < 60</p>
                </div>
            `;
            
            // Generate some dynamic activity based on at-risk clients
            activityEl.innerHTML = '';
            const riskClients = clients.filter(c => c.health_score < 60).slice(0, 3);
            
            if (riskClients.length > 0) {
                riskClients.forEach(c => {
                    activityEl.innerHTML += `
                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                            <div style="color: var(--danger);"><i class="uil uil-exclamation-triangle"></i></div>
                            <div><strong>${c.name}</strong> health score is critical (${c.health_score}).<br><span class="text-muted">Requires Immediate Review</span></div>
                        </div>
                    `;
                });
            }
            
            // Fill rest with generic success if < 3 risk logs
            if (totalClients > 0 && riskClients.length === 0) {
                 activityEl.innerHTML += `
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <div style="color: var(--success);"><i class="uil uil-check-circle"></i></div>
                        <div><strong>All Systems Optimal</strong><br><span class="text-muted">No high-risk clients detected</span></div>
                    </div>
                 `;
            }
            
        } catch(err) {
            statsEl.innerHTML = '<div class="text-danger">Failed to load statistics</div>';
        }
    }
};
