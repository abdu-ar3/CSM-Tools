window.App = window.App || { views: {} };
window.App.views.importData = {
    render() {
        return `
            <div class="will-animate">
                <h2 style="margin-bottom: 24px;">Import CSM Data</h2>
                <div class="card">
                    <p class="text-secondary" style="margin-bottom: 20px;">Paste raw text from Excel or CSV directly below to import client data into the system. Data will be mapped automatically.</p>
                    
                    <div class="form-group">
                        <label for="importText">Raw Client Data (Tab or Comma separated)</label>
                        <textarea id="importText" class="form-control" placeholder="Client Name, Plan, Health Score, Status\nAcme Corp, Enterprise, 90, Active..."></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-primary" id="btnParse"><i class="uil uil-process"></i> Parse Data</button>
                        <button class="btn" style="border: 1px solid var(--border-color); color: var(--text-primary); background: transparent;" id="btnClear">Clear</button>
                    </div>

                    <div id="parseResult" style="margin-top: 32px; display: none;">
                        <h4 style="margin-bottom: 12px; color: var(--success);"><i class="uil uil-check-circle"></i> Data Parsed Successfully! Preview:</h4>
                        <div class="table-container" style="border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); max-height: 250px; overflow-y: auto;">
                            <table id="previewTable">
                                <thead></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                        <button class="btn btn-primary" id="btnSaveImport" style="margin-top: 20px;"><i class="uil uil-save"></i> Save to Database</button>
                    </div>
                </div>
            </div>
        `;
    },
    afterRender() {
        const btnParse = document.getElementById('btnParse');
        const btnClear = document.getElementById('btnClear');
        const textarea = document.getElementById('importText');
        const parseResult = document.getElementById('parseResult');
        const previewTableHead = document.querySelector('#previewTable thead');
        const previewTableBody = document.querySelector('#previewTable tbody');
        const btnSaveImport = document.getElementById('btnSaveImport');

        if(btnParse) {
            btnParse.addEventListener('click', () => {
                const text = textarea.value.trim();
                if(!text) return;
                
                const lines = text.split('\\n');
                if(lines.length === 0) return;

                // Auto detect tab or comma
                const delimiter = text.includes('\\t') ? '\\t' : ',';
                
                previewTableHead.innerHTML = '';
                previewTableBody.innerHTML = '';

                let hasHeader = true;
                if (lines.length === 1) hasHeader = false;
                else if (/\d/.test(lines[0])) hasHeader = false;

                lines.forEach((line, index) => {
                    if(!line.trim()) return;
                    const rowText = line.split(delimiter).map(cell => cell.trim());
                    const tr = document.createElement('tr');
                    
                    const isHeader = hasHeader && index === 0;

                    rowText.forEach(cell => {
                        const cellEl = document.createElement(isHeader ? 'th' : 'td');
                        cellEl.textContent = cell;
                        tr.appendChild(cellEl);
                    });

                    if (isHeader) previewTableHead.appendChild(tr);
                    else previewTableBody.appendChild(tr);
                });

                parseResult.style.display = 'block';
                parseResult.style.animation = 'fadeIn 0.5s ease-out forwards';
                
                // Re-enable save button if reused
                if(btnSaveImport) {
                    btnSaveImport.style.display = 'inline-block';
                    btnSaveImport.textContent = 'Save to Database';
                    btnSaveImport.disabled = false;
                }
            });
        }

        if(btnClear) {
            btnClear.addEventListener('click', () => {
                textarea.value = '';
                parseResult.style.display = 'none';
            });
        }
        
        if(btnSaveImport) {
            btnSaveImport.addEventListener('click', async () => {
                const rows = previewTableBody.querySelectorAll('tr');
                if (rows.length === 0) return alert('No data to save');
                
                btnSaveImport.innerHTML = '<i class="uil uil-spinner"></i> Saving...';
                btnSaveImport.disabled = true;
                
                let successCount = 0;
                let errorCount = 0;

                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        try {
                           const name = cells[0].textContent;
                           const plan = cells[1].textContent;
                           const health_score = parseInt(cells[2].textContent) || 0;
                           const status = cells[3] ? cells[3].textContent : 'Active';
                           
                           await window.App.api.addClient({ name, industry: 'Imported', plan, health_score, status });
                           successCount++;
                        } catch(e) {
                           errorCount++;
                        }
                    }
                }
                
                parseResult.innerHTML = `
                    <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); color: var(--success); border-radius: 8px;">
                        <h4><i class="uil uil-check-circle"></i> Import Complete</h4>
                        <p>Successfully imported ${successCount} clients. ${errorCount > 0 ? `Failed: ${errorCount}` : ''}</p>
                        <button class="btn btn-primary" onclick="window.App.renderView('dataList')" style="margin-top: 12px;">View Data List</button>
                    </div>
                `;
                textarea.value = '';
            });
        }
    }
};
