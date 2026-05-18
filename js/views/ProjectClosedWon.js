window.App = window.App || { views: {} };
window.App.views.projectClosedWon = {
    fieldNames: [
        'Account Name',
        'Account Name (+link)',
        'Nickname',
        'Partner Name',
        'ARR (USD)',
        'Total Licenses Purchased',
        'Renewal Quarter',
        'Renewal Date',
        'Renew?',
        'Churn Risk',
        '% Adoption',
        'Duration',
        '% Base',
        'WoW DAU',
        'QoQ DAU',
        'DAU',
        'WoW Duration',
        'QoQ Duration',
        '% Messenger (IM)',
        '% Meeting (VC)',
        '% Calendar',
        '% Mail',
        '% Approval',
        '% Sheet',
        '% Task',
        'Account Status',
        'Service Start Date',
        'New Logo Won Date',
        'Region',
        'Industry',
        'Sub-industry',
        'Employee Range',
        'Product Purchased',
        'Partner Manager',
        'Partner CSM BP',
        'Account Owner (text)',
        'Account ID (DO NOT HIDE)',
        'Tenant ID'
    ],
    fieldVisibility: {},
    defaultVisibleFields: [
        'Account Name',
        'Partner Name',
        'Renewal Quarter',
        'Churn Risk',
        '% Adoption',
        'Renew?',
        'Duration'
    ],
    searchTerm: '',

    render() {
        return `
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Project Closed Won</h2>
                        <p class="text-secondary">Menampilkan data dari Lark Base "New Summary" dan memungkinkan penetapan PIC.</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                        <button class="btn" id="btnToggleColumns" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"><i class="uil uil-eye"></i> Show/Hide Fields</button>
                        <button class="btn btn-primary" id="btnReloadProjects"><i class="uil uil-sync"></i> Reload Data</button>
                    </div>
                </div>

                <div id="projectControls" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px;">
                    <div style="flex: 1; min-width: 260px; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: var(--bg-card);">
                        <i class="uil uil-search" style="font-size: 1rem; color: var(--text-secondary);"></i>
                        <input id="projectSearchInput" type="text" placeholder="Search project data..." style="flex: 1; border: none; outline: none; background: transparent; color: inherit;" />
                    </div>
                </div>

                <div class="card" id="columnPanel" style="display: none; padding: 14px; margin-bottom: 18px; max-height: 320px; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                        <strong>Show / Hide Fields</strong>
                        <button class="btn" id="btnHideColumnPanel" style="background: transparent; border: none; color: var(--text-secondary);"><i class="uil uil-times"></i></button>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
                        <button class="btn btn-primary" id="btnSelectAllFields"><i class="uil uil-check-circle"></i> Select All</button>
                        <button class="btn" id="btnUnselectAllFields" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"><i class="uil uil-times-circle"></i> Unselect All</button>
                    </div>
                    <div class="grid grid-cols-3" id="columnCheckboxes" style="gap: 10px;"></div>
                </div>

                <div class="card table-container">
                    <table>
                        <thead id="projectTableHead"></thead>
                        <tbody id="projectTableBody">
                            <tr><td colspan="6" style="text-align:center;">Loading project data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async afterRender() {
        this.fieldNames.forEach(name => this.fieldVisibility[name] = false);
        this.defaultVisibleFields.forEach(name => {
            if (this.fieldNames.includes(name)) {
                this.fieldVisibility[name] = true;
            }
        });
        this.bindEvents();
        await this.loadProjects();
    },

    bindEvents() {
        const btnReload = document.getElementById('btnReloadProjects');
        const btnToggle = document.getElementById('btnToggleColumns');
        const btnHidePanel = document.getElementById('btnHideColumnPanel');
        const searchInput = document.getElementById('projectSearchInput');

        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                btnReload.disabled = true;
                btnReload.innerHTML = '<i class="uil uil-spinner"></i> Reloading...';
                await this.loadProjects();
                btnReload.disabled = false;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Reload Data';
            });
        }

        if (btnToggle) {
            btnToggle.addEventListener('click', () => {
                const panel = document.getElementById('columnPanel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'block') this.renderColumnCheckboxes();
            });
        }

        if (btnHidePanel) {
            btnHidePanel.addEventListener('click', () => {
                const panel = document.getElementById('columnPanel');
                panel.style.display = 'none';
            });
        }

        const btnSelectAll = document.getElementById('btnSelectAllFields');
        const btnUnselectAll = document.getElementById('btnUnselectAllFields');
        if (btnSelectAll) {
            btnSelectAll.addEventListener('click', async () => {
                this.fieldNames.forEach(name => this.fieldVisibility[name] = true);
                this.renderColumnCheckboxes();
                await this.loadProjects();
            });
        }

        if (btnUnselectAll) {
            btnUnselectAll.addEventListener('click', async () => {
                this.fieldNames.forEach(name => this.fieldVisibility[name] = false);
                this.renderColumnCheckboxes();
                await this.loadProjects();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', async (event) => {
                this.searchTerm = event.target.value.trim().toLowerCase();
                await this.loadProjects();
            });
        }
    },

    renderColumnCheckboxes() {
        const container = document.getElementById('columnCheckboxes');
        if (!container) return;
        container.innerHTML = '';

        this.fieldNames.forEach(name => {
            const wrapper = document.createElement('label');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.fontSize = '0.95rem';
            wrapper.style.cursor = 'pointer';
            wrapper.innerHTML = `
                <input type="checkbox" data-field="${name}" ${this.fieldVisibility[name] ? 'checked' : ''} />
                <span>${name}</span>
            `;
            wrapper.querySelector('input').addEventListener('change', async (event) => {
                const field = event.target.getAttribute('data-field');
                this.fieldVisibility[field] = event.target.checked;
                await this.loadProjects();
            });
            container.appendChild(wrapper);
        });
    },

    applySearchFilter(projects) {
        if (!this.searchTerm) return projects;
        return projects.filter(project => {
            const values = [project.record_id, ...this.fieldNames.map(name => project.fields?.[name])];
            return values.some(value => {
                if (value === undefined || value === null) return false;
                if (Array.isArray(value)) value = value.join(' ');
                if (typeof value === 'object') value = JSON.stringify(value);
                return String(value).toLowerCase().includes(this.searchTerm);
            });
        });
    },

    async loadProjects() {
        const tbody = document.getElementById('projectTableBody');
        const thead = document.getElementById('projectTableHead');
        try {
            const projects = await window.App.api.getProjects();
            const visibleFields = this.fieldNames.filter(name => this.fieldVisibility[name]);
            const filteredProjects = this.applySearchFilter(projects || []);

            tbody.innerHTML = '';
            thead.innerHTML = '';

            if (!filteredProjects || filteredProjects.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${visibleFields.length + 3}" style="text-align:center;">No project records found. Pastikan konfigurasi Lark Base sudah diisi dan tabel "New Summary" ada.</td></tr>`;
                return;
            }

            if (visibleFields.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${this.fieldNames.length + 3}" style="text-align:center;">Semua field tersembunyi. Silakan tampilkan kembali field dengan tombol Show/Hide Fields.</td></tr>`;
                return;
            }

            const headers = ['Record ID', ...visibleFields, 'PIC', 'Action'];
            thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

            filteredProjects.forEach(project => {
                const row = document.createElement('tr');
                const values = visibleFields.map(field => {
                    const value = project.fields[field];
                    if (value === undefined || value === null) return '-';
                    if (Array.isArray(value)) return value.join(', ');
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value);
                });

                const picValue = project.pic || '';
                row.innerHTML = `
                    <td><code style="font-size:0.9rem;">${project.record_id}</code></td>
                    ${values.map(value => `<td>${value}</td>`).join('')}
                    <td><input type="text" class="pic-input" data-id="${project.record_id}" value="${picValue}" placeholder="Set PIC"></td>
                    <td><button class="btn btn-primary btn-save-pic" data-id="${project.record_id}">Save</button></td>
                `;
                tbody.appendChild(row);
            });

            document.querySelectorAll('.btn-save-pic').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const recordId = event.currentTarget.dataset.id;
                    const input = document.querySelector(`.pic-input[data-id="${recordId}"]`);
                    const pic = input ? input.value.trim() : '';

                    button.disabled = true;
                    button.textContent = 'Saving...';
                    try {
                        await window.App.api.setProjectPic(recordId, pic);
                        button.textContent = 'Saved';
                        setTimeout(() => button.textContent = 'Save', 1000);
                    } catch (err) {
                        alert('Failed to save PIC: ' + err.message);
                        button.textContent = 'Save';
                    }
                    button.disabled = false;
                });
            });

        } catch (err) {
            thead.innerHTML = '';
            tbody.innerHTML = `<tr><td colspan="${this.fieldNames.length + 3}" style="text-align:center; color: var(--danger);">Gagal memuat data proyek. Pastikan konfigurasi Lark Base dan credentials sudah benar.</td></tr>`;
        }
    }
};
