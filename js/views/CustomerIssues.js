window.App = window.App || { views: {} };
window.App.views.customerIssues = {
    render() {
        return `
            <style>
                .pic-display {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 10px 14px;
                    border-radius: var(--border-radius-sm);
                    cursor: pointer;
                    border: 1px solid var(--border-color);
                    background: var(--bg-card);
                    min-height: 42px;
                }
                .pic-display:hover {
                    border-color: var(--primary, #3b82f6);
                }
                .pic-display img {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .pic-display .pic-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
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
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .pic-option-info {
                    flex: 1;
                    min-width: 0;
                }
                .pic-option-name {
                    font-size: 0.88rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .pic-option-email {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
            </style>
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Customer Issues</h2>
                        <p class="text-secondary">Kelola issue pelanggan, buat catatan, atur prioritas, dan update status dengan cepat.</p>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                        <select id="issueTimeRange" class="form-control" style="width: auto; min-width: 160px; height: 42px; padding: 0 12px; margin-bottom: 0;">
                            <option value="all">Semua Waktu</option>
                            <option value="today">Hari Ini</option>
                            <option value="weekly" selected>Minggu Ini (7 Hari)</option>
                            <option value="monthly">Bulan Ini (30 Hari)</option>
                        </select>
                        <button class="btn btn-primary" id="btnReloadIssues" style="height: 42px; display: inline-flex; align-items: center; justify-content: center;"><i class="uil uil-sync"></i> Reload Issues</button>
                    </div>
                </div>

                <!-- Dashboard KPI Stats -->
                <div class="grid grid-cols-3" style="gap: 24px; margin-bottom: 24px;" id="issueStatsDashboard">
                    <div class="card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h4 class="text-secondary" style="font-size: 0.9rem; font-weight: 500;">Total Issues</h4>
                            <h2 id="statTotalIssues" style="font-size: 2rem; margin-top: 8px; font-weight: 700;">0</h2>
                        </div>
                        <p class="text-muted" style="font-size: 0.8rem; margin-top: 8px;">Seluruh laporan issue</p>
                    </div>
                    <div class="card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h4 class="text-secondary" style="font-size: 0.9rem; font-weight: 500;">Open & In Progress</h4>
                            <h2 id="statOpenIssues" style="font-size: 2rem; margin-top: 8px; color: var(--warning); font-weight: 700;">0</h2>
                        </div>
                        <p class="text-muted" style="font-size: 0.8rem; margin-top: 8px;">Sedang aktif ditangani</p>
                    </div>
                    <div class="card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h4 class="text-secondary" style="font-size: 0.9rem; font-weight: 500;">Solved Issues</h4>
                            <h2 id="statSolvedIssues" style="font-size: 2rem; margin-top: 8px; color: var(--success); font-weight: 700;">0</h2>
                        </div>
                        <p class="text-muted" style="font-size: 0.8rem; margin-top: 8px;">Telah diselesaikan (Resolved)</p>
                    </div>
                </div>

                <div class="card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <h3 style="margin: 0;">Issue List</h3>
                            <p class="text-secondary" style="margin: 4px 0 0;">Lihat dan kelola issue customer secara real-time.</p>
                        </div>
                        <span id="issueCount" class="badge primary">0 Issues</span>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Issue</th>
                                    <th>Customer</th>
                                    <th>Feature</th>
                                    <th>CSM Handler</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="issueListBody">
                                <tr><td colspan="7" style="text-align:center;">Loading issue data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async afterRender() {
        this.larkUsers = [];
        try {
            this.larkUsers = await window.App.api.getLarkUsers();
        } catch (err) {
            console.error('Error loading Lark users', err);
        }
        this.bindEvents();
        await this.loadIssues();
    },

    bindEvents() {
        const btnReload = document.getElementById('btnReloadIssues');
        const timeRangeSelect = document.getElementById('issueTimeRange');

        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                btnReload.disabled = true;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Reloading...';
                await this.loadIssues();
                btnReload.disabled = false;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Reload Issues';
            });
        }

        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', () => {
                this.applyFiltersAndRender();
            });
        }
    },

    async loadIssues() {
        const tbody = document.getElementById('issueListBody');
        try {
            const issues = await window.App.api.getIssues();
            this.allIssues = issues || [];
            this.applyFiltersAndRender();
        } catch (err) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger);">Gagal memuat issue. ${err.message}</td></tr>`;
            }
            const issueCount = document.getElementById('issueCount');
            if (issueCount) issueCount.textContent = 'Error';
        }
    },

    applyFiltersAndRender() {
        const tbody = document.getElementById('issueListBody');
        const issueCount = document.getElementById('issueCount');
        const timeRangeSelect = document.getElementById('issueTimeRange');
        const filterVal = timeRangeSelect ? timeRangeSelect.value : 'weekly';

        if (!this.allIssues) this.allIssues = [];

        // Apply time range filter
        let filteredIssues = this.allIssues;
        if (filterVal !== 'all') {
            const now = new Date();
            let limitMs = 7 * 24 * 60 * 60 * 1000; // default weekly
            if (filterVal === 'today') {
                limitMs = 1 * 24 * 60 * 60 * 1000;
            } else if (filterVal === 'monthly') {
                limitMs = 30 * 24 * 60 * 60 * 1000;
            }
            
            filteredIssues = this.allIssues.filter(issue => {
                if (!issue.created_at) return false;
                let dateStr = issue.created_at;
                if (!dateStr.includes('T') && !dateStr.includes('Z')) {
                    dateStr = dateStr.replace(' ', 'T') + 'Z';
                }
                const issueDate = new Date(dateStr);
                if (isNaN(issueDate.getTime())) return false;
                const diffMs = now - issueDate;
                return diffMs >= -60000 && diffMs <= limitMs;
            });
        }

        // Render KPI dashboard stats
        const totalCount = filteredIssues.length;
        const openAndProgressCount = filteredIssues.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
        const solvedCount = filteredIssues.filter(i => i.status === 'Resolved').length;

        const statTotalEl = document.getElementById('statTotalIssues');
        const statOpenEl = document.getElementById('statOpenIssues');
        const statSolvedEl = document.getElementById('statSolvedIssues');

        if (statTotalEl) statTotalEl.textContent = totalCount;
        if (statOpenEl) statOpenEl.textContent = openAndProgressCount;
        if (statSolvedEl) statSolvedEl.textContent = solvedCount;

        if (issueCount) {
            issueCount.textContent = `${totalCount} Issues`;
        }

        if (!tbody) return;
        tbody.innerHTML = '';

        if (filteredIssues.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Tidak ada issue customer dalam rentang waktu terpilih.</td></tr>`;
            return;
        }

        filteredIssues.forEach(issue => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${issue.title}</strong><br>
                    <small class="text-secondary">${issue.description || '-'}</small>
                </td>
                <td>${issue.customer || '-'}</td>
                <td><span class="badge" style="background: rgba(147,51,234,0.1); color: rgb(147,51,234); border: 1px solid rgba(147,51,234,0.2);">${issue.feature || '-'}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="${this.renderUserAvatar(issue.assigned_to)}" style="width: 20px; height: 20px; border-radius: 50%;" />
                        <span>${issue.assigned_to || '-'}</span>
                    </div>
                </td>
                <td><span class="badge" style="background: ${issue.priority === 'High' ? 'rgba(239,68,68,0.1)' : issue.priority === 'Low' ? 'rgba(107,114,128,0.1)' : 'rgba(59,130,246,0.1)'}; color: ${issue.priority === 'High' ? 'rgb(239,68,68)' : issue.priority === 'Low' ? 'rgb(107,114,128)' : 'rgb(59,130,246)'};">${issue.priority}</span></td>
                <td>${this.renderStatusBadge(issue.status)}</td>
                <td>
                    <button class="btn btn-primary btn-sm btn-issue-action" data-id="${issue.id}" data-action="progress">${issue.status === 'Resolved' ? 'Reopen' : 'Next'}</button>
                    <button class="btn btn-sm btn-issue-action" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary);" data-id="${issue.id}" data-action="delete">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Re-bind action button events
        tbody.querySelectorAll('.btn-issue-action').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                const action = event.currentTarget.getAttribute('data-action');
                const btn = event.currentTarget;
                btn.disabled = true;
                try {
                    if (action === 'delete') {
                        if (!confirm('Hapus issue ini?')) {
                            btn.disabled = false;
                            return;
                        }
                        await window.App.api.deleteIssue(id);
                        alert('Issue berhasil dihapus!');
                    } else {
                        const issue = this.allIssues.find(item => String(item.id) === String(id));
                        if (!issue) throw new Error('Issue tidak ditemukan');
                        const nextStatus = issue.status === 'Open' ? 'In Progress' : issue.status === 'In Progress' ? 'Resolved' : 'Open';
                        await window.App.api.updateIssue(id, { status: nextStatus });
                    }
                    await this.loadIssues();
                } catch (err) {
                    alert('Gagal memperbarui issue: ' + err.message);
                    btn.disabled = false;
                }
            });
        });
    },

    renderStatusBadge(status) {
        const color = status === 'Resolved' ? 'success' : status === 'In Progress' ? 'warning' : 'primary';
        return `<span class="badge ${color}">${status}</span>`;
    },

    renderUserAvatar(name) {
        if (this.larkUsers && name) {
            const user = this.larkUsers.find(u => u.name === name);
            if (user && user.avatar) {
                return user.avatar;
            }
        }
        return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'Unassigned') + '&background=3b82f6&color=fff&size=60';
    }
};
