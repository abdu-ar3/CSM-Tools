window.App = window.App || { views: {} };
window.App.views.dataList = {
    render() {
        return `
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2>CSM Data List</h2>
                    <button class="btn btn-primary" id="btnShowAddClient"><i class="uil uil-plus"></i> Add New Client</button>
                </div>
                
                <!-- Add Client Form (Hidden by default) -->
                <div class="card" id="addClientForm" style="display: none; margin-bottom: 24px; animation: fadeIn 0.3s ease-out;">
                    <h3 style="margin-bottom: 16px;">Add New Client</h3>
                    <div class="grid grid-cols-2" style="gap: 16px;">
                        <div class="form-group">
                            <label>Client Name</label>
                            <input type="text" id="addName" class="form-control" placeholder="e.g. Acme Corp">
                        </div>
                        <div class="form-group">
                            <label>Industry</label>
                            <input type="text" id="addIndustry" class="form-control" placeholder="e.g. Technology">
                        </div>
                        <div class="form-group">
                            <label>Plan</label>
                            <select id="addPlan" class="form-control">
                                <option value="Basic">Basic</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Health Score (0-100)</label>
                            <input type="number" id="addHealth" class="form-control" placeholder="85">
                        </div>
                    </div>
                    <div style="margin-top: 16px; display: flex; gap: 12px;">
                        <button class="btn btn-primary" id="btnSaveClient">Save Client</button>
                        <button class="btn" id="btnCancelAdd" style="background: transparent; border: 1px solid var(--border-color);">Cancel</button>
                    </div>
                </div>

                <div class="card table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Client Name</th>
                                <th>Plan</th>
                                <th>Health</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="clientsTableBody">
                            <tr><td colspan="5" style="text-align:center;">Loading data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    async afterRender() {
        this.bindEvents();
        await this.loadClientsOutput();
    },
    
    async loadClientsOutput() {
        const tbody = document.getElementById('clientsTableBody');
        try {
            const clients = await window.App.api.getClients();
            tbody.innerHTML = '';
            if (clients.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No clients found.</td></tr>';
                 return;
            }
            clients.forEach(client => {
                let healthBadge = '';
                if(client.health_score >= 80) healthBadge = `<span class="badge success">${client.health_score} - Good</span>`;
                else if(client.health_score >= 60) healthBadge = `<span class="badge warning">${client.health_score} - At Risk</span>`;
                else healthBadge = `<span class="badge danger" style="background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3);">${client.health_score} - Critical</span>`;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${client.name}</strong><br><small class="text-secondary">${client.industry || '-'}</small></td>
                    <td>${client.plan}</td>
                    <td>${healthBadge}</td>
                    <td>${client.status}</td>
                    <td>
                        <button class="btn-icon btn-delete" data-id="${client.id}" style="color: var(--danger);" title="Delete"><i class="uil uil-trash-alt"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Bind Delete Events
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this client?')) {
                         const originalContent = e.currentTarget.innerHTML;
                         e.currentTarget.innerHTML = '...';
                         await window.App.api.deleteClient(id);
                         await this.loadClientsOutput();
                    }
                });
            });

        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger);">Failed to load clients. Ensure the backend server is running.</td></tr>';
        }
    },
    
    bindEvents() {
        const btnShow = document.getElementById('btnShowAddClient');
        const form = document.getElementById('addClientForm');
        const btnCancel = document.getElementById('btnCancelAdd');
        const btnSave = document.getElementById('btnSaveClient');

        if(btnShow) btnShow.addEventListener('click', () => {
             form.style.display = 'block';
             btnShow.style.display = 'none';
        });

        if(btnCancel) btnCancel.addEventListener('click', () => {
             form.style.display = 'none';
             btnShow.style.display = 'inline-block';
             document.getElementById('addName').value = '';
             document.getElementById('addIndustry').value = '';
             document.getElementById('addHealth').value = '';
        });

        if(btnSave) btnSave.addEventListener('click', async () => {
             const name = document.getElementById('addName').value;
             const industry = document.getElementById('addIndustry').value;
             const plan = document.getElementById('addPlan').value;
             const health_score = parseInt(document.getElementById('addHealth').value) || 0;
             let status = 'Review';
             if (health_score >= 80) status = 'Active';
             else if (health_score >= 60) status = 'Active';
             
             if(!name) return alert('Name is required');

             btnSave.textContent = 'Saving...';
             btnSave.disabled = true;
             
             await window.App.api.addClient({ name, industry, plan, health_score, status });
             
             btnSave.textContent = 'Save Client';
             btnSave.disabled = false;
             
             // Reset and close form
             btnCancel.click();
             await this.loadClientsOutput();
        });
    }
};
