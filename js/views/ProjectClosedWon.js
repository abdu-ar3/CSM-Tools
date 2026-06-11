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
    larkUsers: [],

    render() {
        return `
            <style>
                .pic-cell {
                    position: relative;
                    min-width: 180px;
                }
                .pic-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border: 1px solid var(--border-color);
                    background: var(--bg-card);
                    min-height: 38px;
                }
                .pic-display:hover {
                    background: var(--bg-hover, rgba(59,130,246,0.08));
                    border-color: var(--primary, #3b82f6);
                }
                .pic-display .pic-avatar {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                .pic-display .pic-name {
                    font-size: 0.88rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .pic-display .pic-placeholder {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-style: italic;
                }
                .pic-dropdown {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    min-width: 260px;
                    max-height: 280px;
                    overflow-y: auto;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
                    z-index: 1000;
                    display: none;
                }
                .pic-dropdown.open {
                    display: block;
                    animation: picDropIn 0.15s ease-out;
                }
                @keyframes picDropIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .pic-dropdown-search {
                    padding: 8px 10px;
                    border-bottom: 1px solid var(--border-color);
                    position: sticky;
                    top: 0;
                    background: var(--bg-card);
                    z-index: 1;
                }
                .pic-dropdown-search input {
                    width: 100%;
                    padding: 7px 10px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    outline: none;
                    font-size: 0.85rem;
                    background: var(--bg-sidebar, var(--bg-card));
                    color: var(--text-primary);
                }
                .pic-dropdown-search input:focus {
                    border-color: var(--primary, #3b82f6);
                }
                .pic-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .pic-option:hover {
                    background: var(--bg-hover, rgba(59,130,246,0.08));
                }
                .pic-option.selected {
                    background: rgba(59,130,246,0.12);
                }
                .pic-option img {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                .pic-option-info {
                    flex: 1;
                    min-width: 0;
                }
                .pic-option-name {
                    font-size: 0.88rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .pic-option-email {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .pic-clear-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: 100%;
                    padding: 8px 12px;
                    border: none;
                    background: transparent;
                    color: var(--danger, #ef4444);
                    cursor: pointer;
                    font-size: 0.82rem;
                    transition: background 0.15s;
                    border-bottom: 1px solid var(--border-color);
                }
                .pic-clear-btn:hover {
                    background: rgba(239,68,68,0.08);
                }
                .pic-no-results {
                    padding: 16px;
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                }
            </style>
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Project Closed Won</h2>
                        <p class="text-secondary">Menampilkan data dari Lark Base "Closed Won - Data" / "New Summary" dan memungkinkan penetapan PIC.</p>
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

        // Load Lark users in background
        this.loadLarkUsers();
        await this.loadProjects();
    },

    async loadLarkUsers() {
        try {
            this.larkUsers = await window.App.api.getLarkUsers();
            console.log('Loaded ' + this.larkUsers.length + ' Lark users for PIC selection');
        } catch (err) {
            console.warn('Could not load Lark users:', err);
            this.larkUsers = [];
        }
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
                await this.loadLarkUsers();
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

        // Close all PIC dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.pic-cell')) {
                document.querySelectorAll('.pic-dropdown.open').forEach(d => d.classList.remove('open'));
            }
        });
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
            const values = [project.record_id, project.pic, ...this.fieldNames.map(name => project.fields?.[name])];
            return values.some(value => {
                if (value === undefined || value === null) return false;
                if (Array.isArray(value)) value = value.join(' ');
                if (typeof value === 'object') value = JSON.stringify(value);
                return String(value).toLowerCase().includes(this.searchTerm);
            });
        });
    },

    getUserAvatar(name) {
        return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=3b82f6&color=fff&size=60';
    },

    renderPicCell(recordId, picValue) {
        const users = this.larkUsers;
        const selectedUser = picValue ? users.find(u => u.name === picValue) : null;

        let displayHtml;
        if (selectedUser) {
            const avatarSrc = selectedUser.avatar || this.getUserAvatar(selectedUser.name);
            displayHtml = '<img class="pic-avatar" src="' + avatarSrc + '" alt="" onerror="this.src=\'' + this.getUserAvatar(selectedUser.name) + '\'" />'
                + '<span class="pic-name">' + selectedUser.name + '</span>';
        } else if (picValue) {
            displayHtml = '<img class="pic-avatar" src="' + this.getUserAvatar(picValue) + '" alt="" />'
                + '<span class="pic-name">' + picValue + '</span>';
        } else {
            displayHtml = '<span class="pic-placeholder"><i class="uil uil-user-plus" style="margin-right:4px;"></i>Assign PIC</span>';
        }

        const clearBtn = picValue
            ? '<button class="pic-clear-btn" data-record-id="' + recordId + '"><i class="uil uil-times-circle"></i> Clear PIC</button>'
            : '';

        return '<div class="pic-cell" data-record-id="' + recordId + '">'
            + '<div class="pic-display" data-record-id="' + recordId + '">' + displayHtml + '</div>'
            + '<div class="pic-dropdown" data-record-id="' + recordId + '">'
                + '<div class="pic-dropdown-search"><input type="text" placeholder="Search user..." class="pic-search-input" data-record-id="' + recordId + '" /></div>'
                + clearBtn
                + '<div class="pic-dropdown-list" data-record-id="' + recordId + '">'
                    + this.renderUserOptions(users, picValue, recordId)
                + '</div>'
            + '</div>'
        + '</div>';
    },

    renderUserOptions(users, selectedName, recordId, filter) {
        const filtered = filter
            ? users.filter(u => u.name.toLowerCase().includes(filter) || (u.email && u.email.toLowerCase().includes(filter)))
            : users;

        if (filtered.length === 0) {
            return '<div class="pic-no-results">' + (filter ? 'No users found' : 'No Lark users loaded') + '</div>';
        }

        return filtered.map(user => {
            const avatarSrc = user.avatar || this.getUserAvatar(user.name);
            const isSelected = user.name === selectedName;
            return '<div class="pic-option ' + (isSelected ? 'selected' : '') + '" data-user-name="' + user.name + '" data-record-id="' + recordId + '">'
                + '<img src="' + avatarSrc + '" alt="" onerror="this.src=\'' + this.getUserAvatar(user.name) + '\'" />'
                + '<div class="pic-option-info">'
                    + '<div class="pic-option-name">' + user.name + '</div>'
                    + (user.email ? '<div class="pic-option-email">' + user.email + '</div>' : '')
                + '</div>'
                + (isSelected ? '<i class="uil uil-check" style="color: var(--primary, #3b82f6);"></i>' : '')
            + '</div>';
        }).join('');
    },

    bindPicEvents() {
        const view = this;

        // Toggle dropdown on display click
        document.querySelectorAll('.pic-display').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const recordId = el.dataset.recordId;
                // Close other dropdowns
                document.querySelectorAll('.pic-dropdown.open').forEach(d => {
                    if (d.dataset.recordId !== recordId) d.classList.remove('open');
                });
                const dropdown = document.querySelector('.pic-dropdown[data-record-id="' + recordId + '"]');
                dropdown.classList.toggle('open');
                if (dropdown.classList.contains('open')) {
                    const si = dropdown.querySelector('.pic-search-input');
                    if (si) setTimeout(() => si.focus(), 50);
                }
            });
        });

        // Search input in dropdown
        document.querySelectorAll('.pic-search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                e.stopPropagation();
                const recordId = input.dataset.recordId;
                const filter = input.value.trim().toLowerCase();
                const listEl = document.querySelector('.pic-dropdown-list[data-record-id="' + recordId + '"]');
                const currentPic = document.querySelector('.pic-display[data-record-id="' + recordId + '"]')
                    ?.querySelector('.pic-name')?.textContent || '';
                listEl.innerHTML = view.renderUserOptions(view.larkUsers, currentPic, recordId, filter);
                view.bindOptionClicks(recordId);
            });
            input.addEventListener('click', (e) => e.stopPropagation());
        });

        // Bind option clicks for each cell
        document.querySelectorAll('.pic-cell').forEach(cell => {
            view.bindOptionClicks(cell.dataset.recordId);
        });

        // Clear PIC buttons
        document.querySelectorAll('.pic-clear-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await view.savePic(btn.dataset.recordId, '');
            });
        });
    },

    bindOptionClicks(recordId) {
        const view = this;
        const listEl = document.querySelector('.pic-dropdown-list[data-record-id="' + recordId + '"]');
        if (!listEl) return;

        listEl.querySelectorAll('.pic-option').forEach(opt => {
            opt.addEventListener('click', async (e) => {
                e.stopPropagation();
                await view.savePic(recordId, opt.dataset.userName);
            });
        });
    },

    async savePic(recordId, userName) {
        try {
            await window.App.api.setProjectPic(recordId, userName);
            // Reload to refresh UI
            await this.loadProjects();
        } catch (err) {
            alert('Failed to save PIC: ' + err.message);
        }
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
                tbody.innerHTML = '<tr><td colspan="' + (visibleFields.length + 2) + '" style="text-align:center;">No project records found. Pastikan konfigurasi Lark Base sudah diisi dan tabel "New Summary" ada.</td></tr>';
                return;
            }

            if (visibleFields.length === 0) {
                tbody.innerHTML = '<tr><td colspan="' + (this.fieldNames.length + 2) + '" style="text-align:center;">Semua field tersembunyi. Silakan tampilkan kembali field dengan tombol Show/Hide Fields.</td></tr>';
                return;
            }

            const headers = ['Record ID', ...visibleFields, 'PIC'];
            thead.innerHTML = '<tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr>';

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
                row.innerHTML = '<td><code style="font-size:0.9rem;">' + project.record_id + '</code></td>'
                    + values.map(value => '<td>' + value + '</td>').join('')
                    + '<td>' + this.renderPicCell(project.record_id, picValue) + '</td>';
                tbody.appendChild(row);
            });

            // Bind all PIC dropdown events
            this.bindPicEvents();

        } catch (err) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="' + (this.fieldNames.length + 2) + '" style="text-align:center; color: var(--danger);">Gagal memuat data proyek. Pastikan konfigurasi Lark Base dan credentials sudah benar.</td></tr>';
        }
    }
};
