window.App = window.App || { views: {} };
window.App.views.customerIssues = {
    render() {
        return `
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Customer Issues</h2>
                        <p class="text-secondary">Kelola issue pelanggan, buat catatan, atur prioritas, dan update status dengan cepat.</p>
                    </div>
                    <button class="btn btn-primary" id="btnReloadIssues"><i class="uil uil-sync"></i> Reload Issues</button>
                </div>
                <div class="grid grid-cols-2" style="gap: 24px; align-items: start;">
                    <div class="card" style="padding: 20px;">
                        <h3 style="margin-bottom: 16px;">Report Issue Baru</h3>
                        <form id="issueForm">
                            <div class="form-group">
                                <label for="issueTitle">Judul Issue</label>
                                <input id="issueTitle" name="title" class="form-control" type="text" placeholder="e.g. Login bermasalah" required />
                            </div>
                            <div class="form-group">
                                <label for="issueCustomer">Nama Customer</label>
                                <select id="issueCustomer" name="customer" class="form-control" required>
                                    <option value="">Pilih customer Closed Won...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="issuePriority">Prioritas</label>
                                <select id="issuePriority" name="priority" class="form-control">
                                    <option value="High">High</option>
                                    <option value="Medium" selected>Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="issueAssignedTo">Ditugaskan kepada</label>
                                <input id="issueAssignedTo" name="assigned_to" class="form-control" type="text" placeholder="e.g. CSM Team" />
                            </div>
                            <div class="form-group">
                                <label for="issueDescription">Deskripsi</label>
                                <textarea id="issueDescription" name="description" class="form-control" placeholder="Detail issue pelanggan..."></textarea>
                            </div>
                            <button class="btn btn-primary" type="submit" id="btnSaveIssue"><i class="uil uil-plus-circle"></i> Submit Issue</button>
                        </form>
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
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="issueListBody">
                                    <tr><td colspan="5" style="text-align:center;">Loading issue data...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async afterRender() {
        this.bindEvents();
        await Promise.all([this.loadIssues(), this.loadCustomerOptions()]);
    },

    async loadCustomerOptions() {
        const select = document.getElementById('issueCustomer');
        if (!select) return;

        select.innerHTML = '<option value="">Pilih customer Closed Won...</option>';

        try {
            const projects = await window.App.api.getProjects();
            const customerNames = Array.from(new Set(
                (projects || [])
                    .map(project => project.fields?.['Account Name'] || project.fields?.['Account Name (+link)'] || '')
                    .filter(name => name && name.trim())
            )).sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));

            if (customerNames.length === 0) {
                select.innerHTML += '<option value="" disabled>Tidak ada customer Closed Won</option>';
                return;
            }

            customerNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        } catch (err) {
            console.error(err);
            select.innerHTML += '<option value="" disabled>Gagal memuat customer</option>';
        }
    },

    bindEvents() {
        const btnReload = document.getElementById('btnReloadIssues');
        const issueForm = document.getElementById('issueForm');

        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                btnReload.disabled = true;
                btnReload.innerHTML = '<i class="uil uil-spinner"></i> Reloading...';
                await this.loadIssues();
                btnReload.disabled = false;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Reload Issues';
            });
        }

        if (issueForm) {
            issueForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = document.getElementById('btnSaveIssue');
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';

                const formData = new FormData(issueForm);
                const issueData = {
                    title: formData.get('title').trim(),
                    customer: formData.get('customer').trim(),
                    description: formData.get('description').trim(),
                    priority: formData.get('priority'),
                    assigned_to: formData.get('assigned_to').trim(),
                    status: 'Open'
                };

                try {
                    await window.App.api.createIssue(issueData);
                    issueForm.reset();
                    issueForm.querySelector('#issuePriority').value = 'Medium';
                    await this.loadIssues();
                } catch (err) {
                    alert('Gagal membuat issue: ' + err.message);
                } finally {
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="uil uil-plus-circle"></i> Submit Issue';
                }
            });
        }
    },

    async loadIssues() {
        const tbody = document.getElementById('issueListBody');
        const issueCount = document.getElementById('issueCount');
        try {
            const issues = await window.App.api.getIssues();
            tbody.innerHTML = '';
            issueCount.textContent = `${issues.length} Issues`;

            if (!issues || issues.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada issue customer saat ini.</td></tr>`;
                return;
            }

            issues.forEach(issue => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <strong>${issue.title}</strong><br>
                        <small class="text-secondary">${issue.description || '-'}</small>
                    </td>
                    <td>${issue.customer}</td>
                    <td>${issue.priority}</td>
                    <td>${this.renderStatusBadge(issue.status)}</td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-issue-action" data-id="${issue.id}" data-action="progress">${issue.status === 'Resolved' ? 'Reopen' : 'Next'}</button>
                        <button class="btn btn-sm" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary);" data-id="${issue.id}" data-action="delete">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            document.querySelectorAll('.btn-issue-action').forEach(button => {
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
                        } else {
                            const issue = (await window.App.api.getIssues()).find(item => String(item.id) === String(id));
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
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--danger);">Gagal memuat issue. ${err.message}</td></tr>`;
            issueCount.textContent = 'Error';
        }
    },

    renderStatusBadge(status) {
        const color = status === 'Resolved' ? 'success' : status === 'In Progress' ? 'warning' : 'primary';
        return `<span class="badge ${color}">${status}</span>`;
    }
};
