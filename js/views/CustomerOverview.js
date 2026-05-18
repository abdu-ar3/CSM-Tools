window.App = window.App || { views: {} };
window.App.views.customerOverview = {
    searchTerm: '',

    render() {
        return `
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Customer Overview</h2>
                        <p class="text-secondary">Menampilkan profil perusahaan Closed Won dan bidang usaha berdasarkan data dari Lark Closed Won.</p>
                    </div>
                </div>

                <div id="overviewHeader" class="grid grid-cols-3" style="gap: 16px; margin-bottom: 24px;">
                    <div class="card">
                        <h4 class="text-secondary">Closed Won Customers</h4>
                        <h2 id="overviewCustomerCount">--</h2>
                        <p class="text-secondary" style="font-size: 0.85rem; margin-top: 8px;">Data dari tabel Closed Won di Lark Base.</p>
                    </div>
                    <div class="card">
                        <h4 class="text-secondary">Top Industries</h4>
                        <div id="overviewIndustryBreakdown" style="margin-top: 12px; font-size: 0.95rem; color: var(--text-primary);">--</div>
                    </div>
                    <div class="card">
                        <h4 class="text-secondary">Most Recent Company</h4>
                        <div id="overviewLatestCustomer" style="margin-top: 12px; font-size: 0.95rem; color: var(--text-primary);">--</div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px;">
                    <div style="flex: 1; min-width: 260px; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: var(--bg-card);">
                        <i class="uil uil-search" style="font-size: 1rem; color: var(--text-secondary);"></i>
                        <input id="overviewSearchInput" type="text" placeholder="Cari nama perusahaan atau industri..." style="flex: 1; border: none; outline: none; background: transparent; color: inherit;" />
                    </div>
                    <button class="btn btn-primary" id="btnReloadOverview"><i class="uil uil-sync"></i> Refresh</button>
                </div>

                <div id="overviewCards" class="grid grid-cols-3" style="gap: 18px;">
                    <div class="card" style="grid-column: span 3; text-align: center; color: var(--text-secondary);">Loading customer overview...</div>
                </div>
            </div>
        `;
    },

    async afterRender() {
        this.bindEvents();
        await this.loadOverview();
    },

    bindEvents() {
        const searchInput = document.getElementById('overviewSearchInput');
        const btnReload = document.getElementById('btnReloadOverview');

        if (searchInput) {
            searchInput.addEventListener('input', async (event) => {
                this.searchTerm = event.target.value.trim().toLowerCase();
                await this.loadOverview();
            });
        }

        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                btnReload.disabled = true;
                btnReload.innerHTML = '<i class="uil uil-spinner"></i> Refreshing...';
                await this.loadOverview();
                btnReload.disabled = false;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Refresh';
            });
        }
    },

    filterProjects(projects) {
        if (!this.searchTerm) return projects;
        return projects.filter(project => {
            const fields = project.fields || {};
            const values = [
                fields['Account Name'],
                fields['Industry'],
                fields['Sub-industry'],
                fields['Region'],
                fields['Product Purchased']
            ];
            return values.some(value => {
                if (!value) return false;
                if (Array.isArray(value)) value = value.join(' ');
                return String(value).toLowerCase().includes(this.searchTerm);
            });
        });
    },

    buildIndustrySummary(projects) {
        const counts = {};
        projects.forEach(project => {
            const industry = (project.fields?.['Industry'] || 'Unknown').toString().trim() || 'Unknown';
            counts[industry] = (counts[industry] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([industry, count]) => `${industry}: ${count}`)
            .join('<br>');
    },

    formatValue(value) {
        if (value === undefined || value === null) return 'Tidak tersedia';
        if (Array.isArray(value)) return value.length ? value.join(', ') : 'Tidak tersedia';
        return String(value);
    },

    getCompanyProfile(project) {
        const fields = project.fields || {};
        const companyName = this.formatValue(fields['Account Name'] || fields['Nickname']) || 'Unknown Company';
        const industry = this.formatValue(fields['Industry']);
        const subIndustry = this.formatValue(fields['Sub-industry']);
        const region = this.formatValue(fields['Region']);
        const employees = this.formatValue(fields['Employee Range']);
        const product = this.formatValue(fields['Product Purchased']);
        const accountOwner = this.formatValue(fields['Account Owner (text)']);

        return {
            companyName,
            industry,
            subIndustry,
            region,
            employees,
            product,
            accountOwner
        };
    },

    async loadOverview() {
        const cardsContainer = document.getElementById('overviewCards');
        const customerCountEl = document.getElementById('overviewCustomerCount');
        const industryEl = document.getElementById('overviewIndustryBreakdown');
        const latestEl = document.getElementById('overviewLatestCustomer');

        cardsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; color: var(--text-secondary);">Loading customer overview...</div>`;
        customerCountEl.textContent = '--';
        industryEl.innerHTML = '--';
        latestEl.textContent = '--';

        try {
            const projects = await window.App.api.getProjects();
            const filtered = this.filterProjects(projects || []);
            const overviewProjects = filtered;

            overviewProjects.sort((a, b) => {
                const aDate = Number(a.fields?.['New Logo Won Date'] || 0);
                const bDate = Number(b.fields?.['New Logo Won Date'] || 0);
                return bDate - aDate;
            });

            customerCountEl.textContent = overviewProjects.length;
            industryEl.innerHTML = this.buildIndustrySummary(overviewProjects) || 'Tidak tersedia';
            latestEl.textContent = overviewProjects.length > 0 ? this.formatValue(overviewProjects[0].fields?.['Account Name']) : 'Tidak ada customer';

            if (!overviewProjects.length) {
                cardsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; color: var(--text-secondary);">Tidak ada data Closed Won yang sesuai.</div>`;
                return;
            }

            cardsContainer.innerHTML = overviewProjects.map(project => {
                const profile = this.getCompanyProfile(project);
                return `
                    <div class="card" style="min-width: 260px;">
                        <h3 style="margin-bottom: 12px;">${profile.companyName}</h3>
                        <p><strong>Bidang:</strong> ${profile.industry}</p>
                        <p><strong>Sub-bidang:</strong> ${profile.subIndustry}</p>
                        <p><strong>Wilayah:</strong> ${profile.region}</p>
                        <p><strong>Ukuran:</strong> ${profile.employees}</p>
                        <p><strong>Produk:</strong> ${profile.product}</p>
                        <p><strong>Account Owner:</strong> ${profile.accountOwner}</p>
                    </div>
                `;
            }).join('');
        } catch (err) {
            cardsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; color: var(--danger);">Gagal memuat Customer Overview. Pastikan konfigurasi Lark Closed Won sudah benar.</div>`;
        }
    }
};
