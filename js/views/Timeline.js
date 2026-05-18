window.App = window.App || { views: {} };
window.App.views.timeline = {
    searchTerm: '',

    render() {
        return `
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Timeline</h2>
                        <p class="text-secondary">Setiap proyek baru akan otomatis dibuatkan timeline default selama 14 hari.</p>
                    </div>
                    <button class="btn btn-primary" id="btnReloadTimelines"><i class="uil uil-sync"></i> Reload Timelines</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap: 10px; align-items:center; margin-bottom: 18px;">
                    <div style="display:flex; align-items:center; gap:8px; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: var(--bg-card); flex: 1; min-width: 260px;">
                        <i class="uil uil-search" style="font-size: 1rem; color: var(--text-secondary);"></i>
                        <input id="timelineSearchInput" type="text" placeholder="Search customer brand / project..." style="flex:1; border:none; outline:none; background:transparent; color:inherit;" />
                    </div>
                    <button class="btn btn-primary" id="btnSearchTimelines"><i class="uil uil-search"></i> Search</button>
                    <button class="btn" id="btnClearTimelineSearch" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"><i class="uil uil-times-circle"></i> Clear</button>
                </div>
                <div id="timelineContainer">
                    <div class="card" style="text-align:center;">
                        <p>Loading timeline data...</p>
                    </div>
                </div>
            </div>
        `;
    },

    async afterRender() {
        this.bindEvents();
        await this.loadTimelines();
    },

    bindEvents() {
        const btnReload = document.getElementById('btnReloadTimelines');
        const btnSearch = document.getElementById('btnSearchTimelines');
        const btnClear = document.getElementById('btnClearTimelineSearch');
        const searchInput = document.getElementById('timelineSearchInput');

        if (btnReload) {
            btnReload.addEventListener('click', async () => {
                btnReload.disabled = true;
                btnReload.innerHTML = '<i class="uil uil-spinner"></i> Reloading...';
                await this.loadTimelines();
                btnReload.disabled = false;
                btnReload.innerHTML = '<i class="uil uil-sync"></i> Reload Timelines';
            });
        }

        if (btnSearch) {
            btnSearch.addEventListener('click', async () => {
                this.searchTerm = (searchInput?.value || '').trim().toLowerCase();
                await this.loadTimelines();
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', async () => {
                if (searchInput) searchInput.value = '';
                this.searchTerm = '';
                await this.loadTimelines();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', async (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.searchTerm = (searchInput.value || '').trim().toLowerCase();
                    await this.loadTimelines();
                }
            });
        }
    },

    applySearchFilter(timelines) {
        if (!this.searchTerm) return timelines;
        return timelines.filter(group => {
            const projectName = group.project.fields['Account Name'] || group.project.fields['Account Name (+link)'] || '';
            const projectBrand = group.project.fields['Partner Name'] || group.project.fields['Account Name'] || '';
            const owner = group.project.fields['Account Owner (text)'] || '';
            const recordId = group.record_id || '';
            const taskNames = group.tasks.map(task => task.task_name || '').join(' ');
            const searchText = [projectName, projectBrand, owner, recordId, taskNames].join(' ').toLowerCase();
            return searchText.includes(this.searchTerm);
        });
    },

    async loadTimelines() {
        const container = document.getElementById('timelineContainer');
        try {
            const timelines = await window.App.api.getTimelines();
            const filteredTimelines = this.applySearchFilter(timelines || []);
            container.innerHTML = '';

            if (!filteredTimelines || filteredTimelines.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align:center;">
                        <p>No timelines found. Pastikan data proyek di Lark Base sudah tersedia.</p>
                    </div>
                `;
                return;
            }

            filteredTimelines.forEach(group => {
                const projectName = group.project.fields['Account Name'] || group.project.fields['Account Name (+link)'] || group.record_id;
                const projectBrand = group.project.fields['Partner Name'] || group.project.fields['Account Name'] || group.project.fields['Account Name (+link)'] || 'Unknown';
                const projectOwner = group.project.fields['Account Owner (text)'] || '';
                const recordId = group.record_id;
                const html = document.createElement('div');
                html.className = 'card';
                html.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
                        <div>
                            <h3 style="margin-bottom:8px;">${projectName}</h3>
                            <p class="text-secondary" style="margin:0;">Record ID: <code style="font-size:0.85rem;">${recordId}</code>${projectOwner ? ` • Owner: ${projectOwner}` : ''}${projectBrand ? ` • Brand: ${projectBrand}` : ''}</p>
                        </div>
                        <span class="badge" style="background: rgba(59, 130, 246, 0.12); color: var(--primary);">14-day default timeline</span>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end; margin-bottom:18px;">
                        <input type="text" class="timeline-new-task-name" data-record-id="${recordId}" placeholder="Nama task baru" style="flex:1; min-width:220px; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm);" />
                        <input type="date" class="timeline-new-task-due" data-record-id="${recordId}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm);" />
                        <button class="btn btn-primary btn-add-task" data-record-id="${recordId}">Tambah Timeline</button>
                    </div>
                    <div class="table-container" style="overflow-x:auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th style="min-width:190px;">Task</th>
                                    <th style="min-width:120px;">Due Date</th>
                                    <th style="min-width:160px;">Actual Date</th>
                                    <th style="min-width:120px;">Status</th>
                                    <th style="min-width:140px;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${group.tasks.map(task => `
                                    <tr>
                                        <td>${task.task_name}</td>
                                        <td>${task.due_date || '-'}</td>
                                        <td>
                                            <input
                                                type="date"
                                                class="timeline-actual-date"
                                                data-record-id="${recordId}"
                                                data-task-id="${task.id}"
                                                value="${task.actual_date ? task.actual_date.split('T')[0] : ''}"
                                            />
                                        </td>
                                        <td>${task.status === 'Done' ? '<span class="badge success">Done</span>' : '<span class="badge warning">Pending</span>'}</td>
                                        <td>
                                            <button class="btn btn-primary btn-task-toggle" data-record-id="${recordId}" data-task-id="${task.id}" data-status="${task.status}">${task.status === 'Done' ? 'Mark Pending' : 'Mark Done'}</button>
                                            <button class="btn btn-danger btn-delete-task" data-record-id="${recordId}" data-task-id="${task.id}" style="margin-left: 8px;">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                container.appendChild(html);
            });

            document.querySelectorAll('.btn-task-toggle').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const recordId = event.currentTarget.dataset.recordId;
                    const taskId = event.currentTarget.dataset.taskId;
                    const currentStatus = event.currentTarget.dataset.status;
                    const nextStatus = currentStatus === 'Done' ? 'Pending' : 'Done';

                    event.currentTarget.disabled = true;
                    event.currentTarget.textContent = 'Saving...';
                    try {
                        await window.App.api.updateTimelineTask(recordId, taskId, { status: nextStatus });
                        await this.loadTimelines();
                    } catch (err) {
                        alert('Gagal memperbarui status timeline: ' + err.message);
                        event.currentTarget.disabled = false;
                        event.currentTarget.textContent = currentStatus === 'Done' ? 'Mark Pending' : 'Mark Done';
                    }
                });
            });

            document.querySelectorAll('.btn-delete-task').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const recordId = event.currentTarget.dataset.recordId;
                    const taskId = event.currentTarget.dataset.taskId;
                    if (!confirm('Hapus task timeline ini?')) return;

                    event.currentTarget.disabled = true;
                    event.currentTarget.textContent = 'Deleting...';
                    try {
                        await window.App.api.deleteTimelineTask(recordId, taskId);
                        await this.loadTimelines();
                    } catch (err) {
                        alert('Gagal menghapus task timeline: ' + err.message);
                        event.currentTarget.disabled = false;
                        event.currentTarget.textContent = 'Delete';
                    }
                });
            });

            document.querySelectorAll('.timeline-actual-date').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const recordId = event.currentTarget.dataset.recordId;
                    const taskId = event.currentTarget.dataset.taskId;
                    const actualDate = event.currentTarget.value;

                    event.currentTarget.disabled = true;
                    try {
                        await window.App.api.updateTimelineTask(recordId, taskId, { actual_date: actualDate || null });
                        await this.loadTimelines();
                    } catch (err) {
                        alert('Gagal memperbarui actual date: ' + err.message);
                        event.currentTarget.disabled = false;
                    }
                });
            });

            document.querySelectorAll('.btn-add-task').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const recordId = event.currentTarget.dataset.recordId;
                    const nameInput = document.querySelector(`.timeline-new-task-name[data-record-id="${recordId}"]`);
                    const dueInput = document.querySelector(`.timeline-new-task-due[data-record-id="${recordId}"]`);
                    const taskName = nameInput?.value.trim();
                    const dueDate = dueInput?.value || null;

                    if (!taskName) {
                        alert('Masukkan nama task baru terlebih dahulu.');
                        return;
                    }

                    event.currentTarget.disabled = true;
                    event.currentTarget.textContent = 'Menyimpan...';
                    try {
                        await window.App.api.createTimelineTask(recordId, { task_name: taskName, due_date: dueDate });
                        await this.loadTimelines();
                    } catch (err) {
                        alert('Gagal menambahkan timeline baru: ' + err.message);
                        event.currentTarget.disabled = false;
                        event.currentTarget.textContent = 'Tambah Timeline';
                    }
                });
            });

        } catch (err) {
            container.innerHTML = `
                <div class="card" style="text-align:center; color: var(--danger);">
                    <p>Gagal memuat timeline. Pastikan konfigurasi Lark Base sudah benar.</p>
                </div>
            `;
        }
    }
};
