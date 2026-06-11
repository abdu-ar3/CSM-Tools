window.App = window.App || { views: {} };
window.App.views.customerOverview = {
    searchTerm: '',
    filterIndustry: '',
    filterRegion: '',
    filterRisk: '',
    sortBy: 'wonDateDesc',
    projects: [],

    render() {
        return `
            <style>
                /* Style updates for Customer Overview */
                .overview-metric-card {
                    background: var(--bg-surface);
                    backdrop-filter: var(--blur-glass);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    padding: 20px;
                    box-shadow: var(--shadow-glass);
                    transition: var(--transition);
                }
                .overview-metric-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .client-card {
                    background: var(--bg-surface);
                    backdrop-filter: var(--blur-glass);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    padding: 24px;
                    box-shadow: var(--shadow-glass);
                    transition: var(--transition);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }
                .client-card::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: transparent;
                    transition: var(--transition);
                }
                .client-card:hover::after {
                    background: linear-gradient(90deg, var(--primary-light), var(--accent));
                }
                .client-card:hover {
                    transform: translateY(-4px) scale(1.01);
                    border-color: rgba(255, 255, 255, 0.18);
                    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
                }
                .avatar-circle {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    font-size: 1.25rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                /* Filter controls */
                .filter-select {
                    background: var(--bg-surface);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-sm);
                    padding: 10px 14px;
                    outline: none;
                    font-family: inherit;
                    font-size: 0.9rem;
                    cursor: pointer;
                    min-width: 140px;
                    transition: var(--transition);
                }
                .filter-select:focus {
                    border-color: var(--primary-light);
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.15);
                }
                
                /* Modal overlay */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 17, 26, 0.85);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }
                .modal-overlay.open {
                    opacity: 1;
                    pointer-events: auto;
                }
                .modal-container {
                    background: #151824;
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    width: 90%;
                    max-width: 780px;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .modal-overlay.open .modal-container {
                    transform: translateY(0);
                }
                .modal-close-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: var(--transition);
                }
                .modal-close-btn:hover {
                    color: var(--text-primary);
                    background: rgba(255,255,255,0.1);
                    transform: rotate(90deg);
                }
                .mini-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    margin-top: 4px;
                }
            </style>
            
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Customer Overview</h2>
                        <p class="text-secondary">Menampilkan profil perusahaan Closed Won dan bidang usaha berdasarkan data dari Lark Closed Won.</p>
                    </div>
                </div>

                <!-- Stats Counters -->
                <div id="overviewHeader" class="grid grid-cols-3" style="gap: 16px; margin-bottom: 24px;">
                    <div class="overview-metric-card">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="background: rgba(139, 92, 246, 0.15); color: var(--primary-light); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="uil uil-users-alt" style="font-size: 1.25rem;"></i>
                            </div>
                            <h4 class="text-secondary">Closed Won Customers</h4>
                        </div>
                        <h2 id="overviewCustomerCount" style="font-size: 2.25rem; font-weight: 700; background: linear-gradient(135deg, #fff, var(--text-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">--</h2>
                        <p class="text-secondary" style="font-size: 0.8rem; margin-top: 8px;">Total klien terdaftar</p>
                    </div>
                    <div class="overview-metric-card">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="background: rgba(16, 185, 129, 0.15); color: var(--success); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="uil uil-bill" style="font-size: 1.25rem;"></i>
                            </div>
                            <h4 class="text-secondary">Total ARR</h4>
                        </div>
                        <h2 id="overviewTotalARR" style="font-size: 2.25rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">--</h2>
                        <p class="text-secondary" style="font-size: 0.8rem; margin-top: 8px;">Annual Recurring Revenue</p>
                    </div>
                    <div class="overview-metric-card">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="background: rgba(14, 165, 233, 0.15); color: var(--accent); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="uil uil-chart-growth" style="font-size: 1.25rem;"></i>
                            </div>
                            <h4 class="text-secondary">Avg Adoption Rate</h4>
                        </div>
                        <h2 id="overviewAvgAdoption" style="font-size: 2.25rem; font-weight: 700; background: linear-gradient(135deg, #0ea5e9, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">--</h2>
                        <p class="text-secondary" style="font-size: 0.8rem; margin-top: 8px;">Tingkat adopsi produk rata-rata</p>
                    </div>
                </div>
                
                <!-- Distribution Breakdown Panel -->
                <div class="grid grid-cols-2" style="gap: 16px; margin-bottom: 24px;">
                    <div class="overview-metric-card">
                        <h4 style="margin-bottom: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <i class="uil uil-building" style="color: var(--primary-light);"></i> Top Industries
                        </h4>
                        <div id="overviewIndustryBreakdown" style="display: flex; flex-direction: column; gap: 12px;">--</div>
                    </div>
                    <div class="overview-metric-card">
                        <h4 style="margin-bottom: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <i class="uil uil-map-marker" style="color: var(--accent);"></i> Top Regions
                        </h4>
                        <div id="overviewRegionBreakdown" style="display: flex; flex-direction: column; gap: 12px;">--</div>
                    </div>
                </div>

                <!-- Advanced Filters Panel -->
                <div class="overview-metric-card" style="margin-bottom: 24px; padding: 16px 20px;">
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
                        <div style="flex: 1; min-width: 250px; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: rgba(0,0,0,0.15);">
                            <i class="uil uil-search" style="font-size: 1rem; color: var(--text-secondary);"></i>
                            <input id="overviewSearchInput" type="text" placeholder="Cari nama perusahaan, owner, produk..." style="flex: 1; border: none; outline: none; background: transparent; color: inherit; font-size: 0.9rem;" />
                        </div>
                        
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <select id="filterIndustry" class="filter-select">
                                <option value="">Semua Bidang</option>
                            </select>
                            <select id="filterRegion" class="filter-select">
                                <option value="">Semua Wilayah</option>
                            </select>
                            <select id="filterRisk" class="filter-select">
                                <option value="">Semua Risiko Churn</option>
                                <option value="Low">Low Risk</option>
                                <option value="Medium">Medium Risk</option>
                                <option value="High">High Risk</option>
                            </select>
                            <select id="sortBy" class="filter-select">
                                <option value="wonDateDesc">Logo Baru (Terbaru)</option>
                                <option value="wonDateAsc">Logo Baru (Terlama)</option>
                                <option value="arrDesc">ARR Tertinggi</option>
                                <option value="adoptionDesc">Adopsi Tertinggi</option>
                                <option value="nameAsc">Nama Perusahaan (A-Z)</option>
                                <option value="nameDesc">Nama Perusahaan (Z-A)</option>
                            </select>
                            <button class="btn btn-primary" id="btnReloadOverview" style="padding: 10px 18px;"><i class="uil uil-sync"></i> Refresh</button>
                        </div>
                    </div>
                </div>

                <!-- Cards Grid -->
                <div id="overviewCards" class="grid grid-cols-3" style="gap: 18px; margin-bottom: 32px;">
                    <div class="card" style="grid-column: span 3; text-align: center; color: var(--text-secondary); padding: 48px 0;">
                        <i class="uil uil-spinner" style="font-size: 2rem; display: block; margin-bottom: 12px; animation: spin 1s infinite linear;"></i>
                        Loading customer overview...
                    </div>
                </div>
            </div>
            
            <!-- Detail Profile Modal -->
            <div id="customerDetailModal" class="modal-overlay">
                <div class="modal-container">
                    <button class="modal-close-btn" id="btnCloseModal"><i class="uil uil-times"></i></button>
                    <div id="modalContent" style="padding: 32px;">
                        <!-- Content Injected Dynamically -->
                    </div>
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
        const selectIndustry = document.getElementById('filterIndustry');
        const selectRegion = document.getElementById('filterRegion');
        const selectRisk = document.getElementById('filterRisk');
        const selectSort = document.getElementById('sortBy');
        const btnReload = document.getElementById('btnReloadOverview');
        
        const modalOverlay = document.getElementById('customerDetailModal');
        const btnCloseModal = document.getElementById('btnCloseModal');

        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                this.searchTerm = event.target.value.trim().toLowerCase();
                this.renderFilteredOverview();
            });
        }

        if (selectIndustry) {
            selectIndustry.addEventListener('change', (event) => {
                this.filterIndustry = event.target.value;
                this.renderFilteredOverview();
            });
        }

        if (selectRegion) {
            selectRegion.addEventListener('change', (event) => {
                this.filterRegion = event.target.value;
                this.renderFilteredOverview();
            });
        }

        if (selectRisk) {
            selectRisk.addEventListener('change', (event) => {
                this.filterRisk = event.target.value;
                this.renderFilteredOverview();
            });
        }

        if (selectSort) {
            selectSort.addEventListener('change', (event) => {
                this.sortBy = event.target.value;
                this.renderFilteredOverview();
            });
        }

        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                btnReload.disabled = true;
                btnReload.innerHTML = '<i class="uil uil-spinner"></i> Refreshing...';
                await this.loadOverview(true);
                btnReload.disabled = false;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Refresh';
            });
        }

        if (btnCloseModal) {
            btnCloseModal.addEventListener('click', () => {
                modalOverlay.classList.remove('open');
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.remove('open');
                }
            });
        }

        // Delegate click for "Detail Profil" button inside the overviewCards container
        const cardsContainer = document.getElementById('overviewCards');
        if (cardsContainer) {
            cardsContainer.addEventListener('click', (e) => {
                const detailBtn = e.target.closest('.btn-detail-profile');
                if (detailBtn) {
                    const recordId = detailBtn.getAttribute('data-record-id');
                    this.showCustomerDetails(recordId);
                }
            });
        }
    },

    getAvatarGradient(name) {
        const colors = [
            ['#8b5cf6', '#a78bfa'], // violet
            ['#3b82f6', '#60a5fa'], // blue
            ['#06b6d4', '#22d3ee'], // cyan
            ['#10b981', '#34d399'], // emerald
            ['#f59e0b', '#fbbf24'], // amber
            ['#ec4899', '#f472b6'], // pink
            ['#6366f1', '#818cf8']  // indigo
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
    },

    formatValue(value) {
        if (value === undefined || value === null || value === '') return 'Tidak tersedia';
        if (Array.isArray(value)) return value.length ? value.join(', ') : 'Tidak tersedia';
        return String(value);
    },

    formatCurrency(value) {
        if (value === undefined || value === null || value === '') return 'Tidak tersedia';
        const num = parseFloat(value);
        if (isNaN(num)) return String(value);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
    },

    formatPercent(val) {
        if (val === undefined || val === null || val === '') return '0%';
        let num = parseFloat(val);
        if (isNaN(num)) return '0%';
        if (num <= 1 && num > 0) num = num * 100;
        return num.toFixed(1) + '%';
    },

    parseDate(val) {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        
        let dateStr = String(val).trim();
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                let year = parts[0];
                let month = parts[1];
                let day = parts[2];
                if (year.length === 2) {
                    year = '20' + year;
                }
                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        const parsed = Date.parse(dateStr);
        return isNaN(parsed) ? 0 : parsed;
    },

    getRiskBadge(risk) {
        const val = String(risk || '').trim();
        if (val.toLowerCase().includes('high')) {
            return `<span class="badge danger" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 20px;">High Risk</span>`;
        }
        if (val.toLowerCase().includes('medium')) {
            return `<span class="badge warning" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 20px;">Medium Risk</span>`;
        }
        if (val.toLowerCase().includes('low')) {
            return `<span class="badge success" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 20px;">Low Risk</span>`;
        }
        return `<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: var(--text-secondary); border: 1px solid rgba(148, 163, 184, 0.3); padding: 4px 10px; font-size: 0.75rem; border-radius: 20px;">No Data</span>`;
    },

    renderTrend(value) {
        if (value === undefined || value === null || value === '') return '<span style="color: var(--text-muted);">-</span>';
        const str = String(value).trim();
        const isNegative = str.startsWith('-') || parseFloat(str) < 0;
        const isPositive = str.startsWith('+') || parseFloat(str) > 0;
        
        if (isNegative) {
            return `<span style="color: var(--danger); font-weight: 500;"><i class="uil uil-arrow-down-left"></i> ${str}</span>`;
        } else if (isPositive) {
            const plusSign = str.startsWith('+') ? '' : '+';
            return `<span style="color: var(--success); font-weight: 500;"><i class="uil uil-arrow-up-right"></i> ${plusSign}${str}</span>`;
        }
        return `<span style="color: var(--text-secondary);">${str}</span>`;
    },

    renderFeatureProgressBar(label, value) {
        let num = 0;
        if (value !== undefined && value !== null) {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                num = parsed <= 1 ? parsed * 100 : parsed;
            }
        }
        const color = num > 75 ? 'var(--success)' : num > 40 ? 'var(--accent)' : 'var(--warning)';
        return `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                    <span style="color: var(--text-secondary);">${label}</span>
                    <span style="font-weight: 600; color: var(--text-primary);">${num.toFixed(1)}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${num}%; height: 100%; background: ${color}; border-radius: 3px; transition: width 0.5s ease-out;"></div>
                </div>
            </div>
        `;
    },

    populateFilterDropdown(projects, fieldKey, dropdownId, label) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        const values = new Set();
        projects.forEach(project => {
            const val = project.fields?.[fieldKey];
            if (val) {
                if (Array.isArray(val)) {
                    val.forEach(v => values.add(v.toString().trim()));
                } else {
                    values.add(val.toString().trim());
                }
            }
        });
        
        const currentValue = dropdown.value;
        dropdown.innerHTML = `<option value="">${label}</option>`;
        Array.from(values).sort().forEach(val => {
            if (val) {
                const option = document.createElement('option');
                option.value = val;
                option.textContent = val;
                if (val === currentValue) option.selected = true;
                dropdown.appendChild(option);
            }
        });
    },

    sortProjects(projects) {
        return [...projects].sort((a, b) => {
            if (this.sortBy === 'wonDateDesc') {
                return this.parseDate(b.fields?.['New Logo Won Date']) - this.parseDate(a.fields?.['New Logo Won Date']);
            }
            if (this.sortBy === 'wonDateAsc') {
                return this.parseDate(a.fields?.['New Logo Won Date']) - this.parseDate(b.fields?.['New Logo Won Date']);
            }
            if (this.sortBy === 'arrDesc') {
                const arrA = parseFloat(a.fields?.['ARR (USD)']) || 0;
                const arrB = parseFloat(b.fields?.['ARR (USD)']) || 0;
                return arrB - arrA;
            }
            if (this.sortBy === 'adoptionDesc') {
                const adoptA = parseFloat(a.fields?.['% Adoption']) || 0;
                const adoptB = parseFloat(b.fields?.['% Adoption']) || 0;
                return adoptB - adoptA;
            }
            if (this.sortBy === 'nameAsc') {
                const nameA = String(a.fields?.['Account Name'] || '').toLowerCase();
                const nameB = String(b.fields?.['Account Name'] || '').toLowerCase();
                return nameA.localeCompare(nameB);
            }
            if (this.sortBy === 'nameDesc') {
                const nameA = String(a.fields?.['Account Name'] || '').toLowerCase();
                const nameB = String(b.fields?.['Account Name'] || '').toLowerCase();
                return nameB.localeCompare(nameA);
            }
            return 0;
        });
    },

    filterProjects(projects) {
        return projects.filter(project => {
            const fields = project.fields || {};
            
            // Search filter
            if (this.searchTerm) {
                const searchVals = [
                    fields['Account Name'],
                    fields['Nickname'],
                    fields['Industry'],
                    fields['Sub-industry'],
                    fields['Region'],
                    fields['Product Purchased'],
                    fields['Account Owner (text)']
                ];
                const matchesSearch = searchVals.some(val => {
                    if (!val) return false;
                    if (Array.isArray(val)) val = val.join(' ');
                    return String(val).toLowerCase().includes(this.searchTerm);
                });
                if (!matchesSearch) return false;
            }
            
            // Industry filter
            if (this.filterIndustry) {
                const industry = fields['Industry'];
                if (Array.isArray(industry)) {
                    if (!industry.includes(this.filterIndustry)) return false;
                } else {
                    if (String(industry || '').trim() !== this.filterIndustry) return false;
                }
            }
            
            // Region filter
            if (this.filterRegion) {
                const region = fields['Region'];
                if (Array.isArray(region)) {
                    if (!region.includes(this.filterRegion)) return false;
                } else {
                    if (String(region || '').trim() !== this.filterRegion) return false;
                }
            }
            
            // Risk filter
            if (this.filterRisk) {
                const risk = fields['Churn Risk'];
                if (String(risk || '').trim() !== this.filterRisk) return false;
            }
            
            return true;
        });
    },

    buildBreakdown(projects, fieldKey, containerId) {
        const counts = {};
        projects.forEach(project => {
            const val = (project.fields?.[fieldKey] || 'Unknown').toString().trim() || 'Unknown';
            counts[val] = (counts[val] || 0) + 1;
        });
        
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // top 3
            
        const total = projects.length || 1;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (sorted.length === 0) {
            container.innerHTML = `<span style="color: var(--text-muted);">Tidak ada data</span>`;
            return;
        }
        
        container.innerHTML = sorted.map(([name, count]) => {
            const percent = ((count / total) * 100).toFixed(0);
            return `
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                        <span style="font-weight: 500; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 70%;" title="${name}">${name}</span>
                        <span style="color: var(--text-secondary); font-weight: 600;">${count} (${percent}%)</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--primary-light), var(--accent)); border-radius: 3px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    async loadOverview(forceRefresh = false) {
        const cardsContainer = document.getElementById('overviewCards');
        
        if (forceRefresh) {
            this.projects = [];
        }

        try {
            if (!this.projects || !this.projects.length) {
                cardsContainer.innerHTML = `
                    <div class="card" style="grid-column: span 3; text-align: center; color: var(--text-secondary); padding: 48px 0;">
                        <i class="uil uil-spinner" style="font-size: 2rem; display: block; margin-bottom: 12px; animation: spin 1s infinite linear;"></i>
                        Fetching data from Lark Base...
                    </div>
                `;
                const fetched = await window.App.api.getProjects();
                this.projects = fetched || [];
            }

            // Populate Filter Dropdowns dynamically
            this.populateFilterDropdown(this.projects, 'Industry', 'filterIndustry', 'Semua Bidang');
            this.populateFilterDropdown(this.projects, 'Region', 'filterRegion', 'Semua Wilayah');

            // Render details
            this.renderFilteredOverview();

        } catch (err) {
            console.error('Error loading Customer Overview:', err);
            cardsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; color: var(--danger); padding: 32px;">Gagal memuat Customer Overview. Pastikan konfigurasi Lark Closed Won sudah benar dan server sedang berjalan.</div>`;
        }
    },

    renderFilteredOverview() {
        const cardsContainer = document.getElementById('overviewCards');
        const customerCountEl = document.getElementById('overviewCustomerCount');
        const totalARREl = document.getElementById('overviewTotalARR');
        const avgAdoptionEl = document.getElementById('overviewAvgAdoption');

        const filtered = this.filterProjects(this.projects);
        const sorted = this.sortProjects(filtered);

        // Compute metrics
        let totalARR = 0;
        let totalAdoption = 0;
        let adoptionCount = 0;

        filtered.forEach(project => {
            const arr = parseFloat(project.fields?.['ARR (USD)']);
            if (!isNaN(arr)) {
                totalARR += arr;
            }

            const adoptionVal = project.fields?.['% Adoption'];
            if (adoptionVal !== undefined && adoptionVal !== null && adoptionVal !== '') {
                let adoptNum = parseFloat(adoptionVal);
                if (!isNaN(adoptNum)) {
                    if (adoptNum <= 1 && adoptNum > 0) adoptNum = adoptNum * 100;
                    totalAdoption += adoptNum;
                    adoptionCount++;
                }
            }
        });

        const avgAdoption = adoptionCount > 0 ? (totalAdoption / adoptionCount).toFixed(1) + '%' : '0.0%';

        // Render Stats
        customerCountEl.textContent = filtered.length;
        totalARREl.textContent = this.formatCurrency(totalARR);
        avgAdoptionEl.textContent = avgAdoption;

        // Render Industry & Region Distributions
        this.buildBreakdown(filtered, 'Industry', 'overviewIndustryBreakdown');
        this.buildBreakdown(filtered, 'Region', 'overviewRegionBreakdown');

        if (!sorted.length) {
            cardsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; color: var(--text-secondary); padding: 48px 0;">Tidak ada data Closed Won yang sesuai dengan filter pencarian.</div>`;
            return;
        }

        cardsContainer.innerHTML = sorted.map(project => {
            const fields = project.fields || {};
            const companyName = fields['Account Name'] || fields['Nickname'] || 'Unknown Company';
            const industry = fields['Industry'] || 'Tidak tersedia';
            const region = fields['Region'] || 'Tidak tersedia';
            const arr = fields['ARR (USD)'] ? this.formatCurrency(fields['ARR (USD)']) : 'Tidak tersedia';
            const adoption = fields['% Adoption'] !== undefined ? this.formatPercent(fields['% Adoption']) : '0%';
            
            // initials
            const initials = String(companyName).substring(0, 2).toUpperCase();
            const avatarBg = this.getAvatarGradient(String(companyName));

            return `
                <div class="client-card">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                            <div class="avatar-circle" style="background: ${avatarBg};">${initials}</div>
                            ${this.getRiskBadge(fields['Churn Risk'])}
                        </div>
                        
                        <h3 style="margin-bottom: 6px; font-size: 1.15rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${companyName}">${companyName}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 18px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                            <span>${industry}</span> &bull; <span>${region}</span>
                        </p>
                        
                        <!-- Mini metrics -->
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; border-top: 1px dashed var(--border-color); padding-top: 14px;">
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase;">ARR</span>
                                <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${arr}</span>
                            </div>
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase;">Adopsi</span>
                                <span style="font-size: 0.9rem; font-weight: 600; color: var(--accent);">${adoption}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-detail-profile" data-record-id="${project.record_id}" style="width: 100%; padding: 10px 14px; font-size: 0.85rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-primary);">
                        <i class="uil uil-info-circle"></i> Detail Profil
                    </button>
                </div>
            `;
        }).join('');
    },

    showCustomerDetails(recordId) {
        const project = this.projects.find(p => p.record_id === recordId);
        if (!project) return;

        const fields = project.fields || {};
        const companyName = fields['Account Name'] || fields['Nickname'] || 'Unknown Company';
        const industry = fields['Industry'] || 'Tidak tersedia';
        const region = fields['Region'] || 'Tidak tersedia';
        
        const initials = String(companyName).substring(0, 2).toUpperCase();
        const avatarBg = this.getAvatarGradient(String(companyName));

        const modalContent = document.getElementById('modalContent');
        const modalOverlay = document.getElementById('customerDetailModal');

        modalContent.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px; margin-bottom: 24px;">
                <div class="avatar-circle" style="width: 64px; height: 64px; border-radius: 16px; background: ${avatarBg}; font-size: 1.75rem;">${initials}</div>
                <div style="flex: 1;">
                    <h2 style="margin: 0; font-size: 1.75rem;">${companyName}</h2>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; align-items: center;">
                        <span style="font-size: 0.9rem; color: var(--text-secondary);"><i class="uil uil-building"></i> ${industry}</span>
                        <span style="color: var(--border-color);">|</span>
                        <span style="font-size: 0.9rem; color: var(--text-secondary);"><i class="uil uil-map-marker"></i> ${region}</span>
                        <span style="margin-left: auto;">${this.getRiskBadge(fields['Churn Risk'])}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2" style="gap: 24px; margin-bottom: 24px;">
                <!-- Column 1: Info Key Metrics -->
                <div>
                    <h3 style="font-size: 1.1rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--primary-light);">
                        <i class="uil uil-analytics"></i> Key Metrics & Usage
                    </h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.15); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">ARR (USD):</span>
                            <span style="font-weight: 600;">${this.formatCurrency(fields['ARR (USD)'])}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Licenses Purchased:</span>
                            <span style="font-weight: 600;">${fields['Total Licenses Purchased'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Adoption Rate:</span>
                            <span style="font-weight: 600; color: var(--accent);">${this.formatPercent(fields['% Adoption'])}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">DAU:</span>
                            <span style="font-weight: 600;">${fields['DAU'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">WoW DAU Trend:</span>
                            <span>${this.renderTrend(fields['WoW DAU'])}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">QoQ DAU Trend:</span>
                            <span>${this.renderTrend(fields['QoQ DAU'])}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Duration (Mins/Day):</span>
                            <span style="font-weight: 600;">${fields['Duration'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">WoW Duration Trend:</span>
                            <span>${this.renderTrend(fields['WoW Duration'])}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Column 2: Account Details -->
                <div>
                    <h3 style="font-size: 1.1rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--accent);">
                        <i class="uil uil-info-circle"></i> Account & Handover
                    </h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.15); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Account Owner:</span>
                            <span style="font-weight: 600;">${fields['Account Owner (text)'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">New Logo Won Date:</span>
                            <span style="font-weight: 600;">${fields['New Logo Won Date'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Service Start Date:</span>
                            <span style="font-weight: 600;">${fields['Service Start Date'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Partner Name:</span>
                            <span style="font-weight: 600;">${fields['Partner Name'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Partner Manager:</span>
                            <span style="font-weight: 600;">${fields['Partner Manager'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Partner CSM BP:</span>
                            <span style="font-weight: 600;">${fields['Partner CSM BP'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Employee Range:</span>
                            <span style="font-weight: 600;">${fields['Employee Range'] || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-secondary">Product Purchased:</span>
                            <span style="font-weight: 600;">${fields['Product Purchased'] || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Features breakdown -->
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1.1rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--success);">
                    <i class="uil uil-layers"></i> Product Features Adoption
                </h3>
                <div class="grid grid-cols-2" style="gap: 16px; background: rgba(0,0,0,0.15); padding: 20px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
                    <div>
                        ${this.renderFeatureProgressBar('Messenger (IM)', fields['% Messenger (IM)'])}
                        ${this.renderFeatureProgressBar('Meetings (VC)', fields['% Meeting (VC)'])}
                        ${this.renderFeatureProgressBar('Calendar', fields['% Calendar'])}
                        ${this.renderFeatureProgressBar('Mail', fields['% Mail'])}
                    </div>
                    <div>
                        ${this.renderFeatureProgressBar('Approval', fields['% Approval'])}
                        ${this.renderFeatureProgressBar('Sheets', fields['% Sheet'])}
                        ${this.renderFeatureProgressBar('Tasks', fields['% Task'])}
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 16px; flex-wrap: wrap; gap: 8px;">
                <span>Tenant ID: <code>${fields['Tenant ID'] || '-'}</code></span>
                <span>Account ID: <code>${fields['Account ID (DO NOT HIDE)'] || '-'}</code></span>
            </div>
        `;

        modalOverlay.classList.add('open');
    }
};
