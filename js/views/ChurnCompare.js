window.App = window.App || { views: {} };

window.App.views.churnCompare = {
    records: [], // Entire churn activity records from API
    mode: 'clients', // 'clients' or 'periods'
    
    // Compare Clients state
    logDateA: '',
    clientAName: '',
    logDateB: '',
    clientBName: '',
    
    // Compare Periods state
    periodAStart: '',
    periodAEnd: '',
    periodBStart: '',
    periodBEnd: '',
    periodRiskFilter: 'All', // 'All', 'Critical', 'High', 'Medium', 'Low'
    statsA: null,
    statsB: null,

    render() {
        return `
            <div class="will-animate">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2>Churn Analysis Comparison</h2>
                        <p class="text-secondary">Bandingkan status risiko churn historis klien atau pantau perubahan agregat berdasarkan rentang waktu log.</p>
                    </div>
                </div>

                <!-- Mode Switcher -->
                <div class="toggle-tab-group">
                    <button class="toggle-tab active" id="tabCompareClients" data-mode="clients">
                        <i class="uil uil-users-alt" style="margin-right: 6px;"></i>Compare Clients
                    </button>
                    <button class="toggle-tab" id="tabComparePeriods" data-mode="periods">
                        <i class="uil uil-calender" style="margin-right: 6px;"></i>Compare Periods
                    </button>
                </div>

                <!-- Client Comparison Mode UI -->
                <div id="clientsModeSection">
                    <!-- Split Columns for Side-by-Side Clients -->
                    <div class="comparison-container" style="margin-top: 0;">
                        <!-- Client A Panel -->
                        <div class="compare-panel">
                            <div class="compare-header">
                                <h3 style="color: var(--primary-light); font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                                    <span style="background: rgba(139, 92, 246, 0.2); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">A</span>
                                    Klien Pertama (Kiri)
                                </h3>
                                
                                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
                                    <div>
                                        <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Pilih Tanggal Log (Log Date)</label>
                                        <div style="position: relative;">
                                            <input type="date" id="selectLogDateA" class="form-control" style="margin-top: 4px; font-weight: 500;" list="logDatesListA" />
                                            <datalist id="logDatesListA"></datalist>
                                            <div id="dateAlertA" style="font-size: 0.75rem; color: var(--accent); margin-top: 4px; display: none; font-weight: 500;"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Pilih Perusahaan</label>
                                        <select id="selectClientA" class="form-control" style="margin-top: 4px; font-weight: 500;" disabled>
                                            <option value="">-- Pilih Perusahaan --</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div id="detailClientA" style="display: flex; flex-direction: column; gap: 4px;">
                                <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
                                    <i class="uil uil-calendar-alt" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
                                    Silakan pilih tanggal log terlebih dahulu.
                                </div>
                            </div>
                        </div>

                        <!-- Client B Panel -->
                        <div class="compare-panel">
                            <div class="compare-header">
                                <h3 style="color: var(--accent); font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                                    <span style="background: rgba(14, 165, 233, 0.2); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">B</span>
                                    Klien Kedua (Kanan)
                                </h3>
                                
                                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
                                    <div>
                                        <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Pilih Tanggal Log (Log Date)</label>
                                        <div style="position: relative;">
                                            <input type="date" id="selectLogDateB" class="form-control" style="margin-top: 4px; font-weight: 500;" list="logDatesListB" />
                                            <datalist id="logDatesListB"></datalist>
                                            <div id="dateAlertB" style="font-size: 0.75rem; color: var(--accent); margin-top: 4px; display: none; font-weight: 500;"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Pilih Perusahaan</label>
                                        <select id="selectClientB" class="form-control" style="margin-top: 4px; font-weight: 500;" disabled>
                                            <option value="">-- Pilih Perusahaan --</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div id="detailClientB" style="display: flex; flex-direction: column; gap: 4px;">
                                <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
                                    <i class="uil uil-calendar-alt" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
                                    Silakan pilih tanggal log terlebih dahulu.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Client Comparison Summary Card -->
                    <div id="clientsSummaryCard" style="display: none; margin-top: 24px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 20px; box-shadow: var(--shadow-glass);">
                    </div>
                </div>

                <!-- Period Comparison Mode UI -->
                <div id="periodsModeSection" style="display: none;">
                    <!-- Filter Churn Risk at Period Mode level -->
                    <div class="date-picker-container" style="justify-content: flex-start; gap: 16px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
                            <i class="uil uil-filter" style="color: var(--primary-light);"></i>
                            <span>Filter Risiko Churn:</span>
                        </div>
                        <div>
                            <select id="periodChurnRiskFilter" class="form-control" style="padding: 6px 12px; font-size: 0.9rem; min-width: 180px; background: var(--bg-main);">
                                <option value="All">Semua Tingkat Risiko</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    <div class="comparison-container" style="margin-top: 0;">
                        <!-- Period A Panel -->
                        <div class="compare-panel">
                            <div class="compare-header">
                                <h3 style="color: var(--primary-light); display: flex; align-items: center; gap: 8px; font-size: 1.1rem;">
                                    <i class="uil uil-calendar-alt"></i> Periode Waktu A (Berdasarkan Log)
                                </h3>
                                <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                                    <div class="date-picker-group" style="flex: 1; min-width: 120px;">
                                        <label>Mulai</label>
                                        <input type="date" id="periodAStartInput" class="form-control" style="padding: 6px 10px;" />
                                    </div>
                                    <div class="date-picker-group" style="flex: 1; min-width: 120px;">
                                        <label>Selesai</label>
                                        <input type="date" id="periodAEndInput" class="form-control" style="padding: 6px 10px;" />
                                    </div>
                                </div>
                            </div>
                            <div id="statsPeriodA" style="display: flex; flex-direction: column; gap: 16px;">
                                <!-- Dynamically Rendered Period Stats -->
                            </div>
                        </div>

                        <!-- Period B Panel -->
                        <div class="compare-panel">
                            <div class="compare-header">
                                <h3 style="color: var(--accent); display: flex; align-items: center; gap: 8px; font-size: 1.1rem;">
                                    <i class="uil uil-calendar-alt"></i> Periode Waktu B (Berdasarkan Log)
                                </h3>
                                <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                                    <div class="date-picker-group" style="flex: 1; min-width: 120px;">
                                        <label>Mulai</label>
                                        <input type="date" id="periodBStartInput" class="form-control" style="padding: 6px 10px;" />
                                    </div>
                                    <div class="date-picker-group" style="flex: 1; min-width: 120px;">
                                        <label>Selesai</label>
                                        <input type="date" id="periodBEndInput" class="form-control" style="padding: 6px 10px;" />
                                    </div>
                                </div>
                            </div>
                            <div id="statsPeriodB" style="display: flex; flex-direction: column; gap: 16px;">
                                <!-- Dynamically Rendered Period Stats -->
                            </div>
                        </div>
                    </div>

                    <!-- Period Comparison Summary Card -->
                    <div id="periodsSummaryCard" style="display: none; margin-top: 24px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 20px; box-shadow: var(--shadow-glass);">
                    </div>
                </div>
            </div>
        `;
    },

    async afterRender() {
        this.bindEvents();
        await this.loadChurnData();
    },

    // Standard Schema Extraction Helpers to make code highly robust
    getClientName(record) {
        if (!record || !record.fields) return 'Unknown Client';
        const f = record.fields;
        
        // 1. Check account_name
        if (f['account_name']) return f['account_name'];
        if (f['Account Name']) return f['Account Name'];
        
        // 2. Check Account Name (+link) which is an array in Lark Bitable
        if (f['Account Name (+link)']) {
            const val = f['Account Name (+link)'];
            if (Array.isArray(val) && val.length > 0 && val[0].text) {
                let txt = val[0].text;
                if (txt.endsWith(' (None)')) txt = txt.slice(0, -7);
                return txt;
            }
            if (typeof val === 'string') return val;
        }
        
        return f['Client Name'] || f['client_name'] || f['name'] || f['Nickname'] || 'Unknown Client';
    },

    getLogDate(record) {
        if (!record || !record.fields) return '';
        const f = record.fields;
        const rawDate = f['Log Date'] || f['log date'] || f['Date'] || f['log_date'] || f['last_updated'] || f['New Logo Won Date'] || f['Service Start Date'] || '';
        if (!rawDate) return '';
        
        // Format as YYYY-MM-DD
        let d = null;
        if (typeof rawDate === 'number') {
            d = new Date(rawDate);
        } else if (typeof rawDate === 'string') {
            if (/^\d+$/.test(rawDate)) {
                d = new Date(Number(rawDate));
            } else {
                d = new Date(rawDate);
            }
        }
        
        if (d && !isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        return rawDate;
    },

    getChurnRisk(record) {
        if (!record || !record.fields) return 'Low';
        const f = record.fields;
        return f['Churn Risk'] || f['risk'] || 'Low';
    },

    getDisplayVal(val) {
        if (val === undefined || val === null || val === '') return '-';
        if (Array.isArray(val)) {
            return val.map(v => typeof v === 'object' ? (v.text || JSON.stringify(v)) : v).join(', ');
        }
        return val;
    },

    formatDateValue(val) {
        if (!val || val === '-') return '-';
        let d = null;
        if (typeof val === 'number') {
            d = new Date(val);
        } else if (typeof val === 'string') {
            if (/^\d+$/.test(val)) {
                d = new Date(Number(val));
            } else {
                d = new Date(val);
            }
        }
        if (d && !isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        return val;
    },

    getClosestLogDate(chosenDate) {
        if (!chosenDate) return '';
        const logDates = [...new Set(this.records.map(r => this.getLogDate(r)))]
            .filter(Boolean);
        if (logDates.length === 0) return chosenDate;
        
        const chosenTime = new Date(chosenDate).getTime();
        let closestDate = logDates[0];
        let minDiff = Math.abs(new Date(closestDate).getTime() - chosenTime);
        
        for (let i = 1; i < logDates.length; i++) {
            const diff = Math.abs(new Date(logDates[i]).getTime() - chosenTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestDate = logDates[i];
            }
        }
        return closestDate;
    },

    bindEvents() {
        const tabClients = document.getElementById('tabCompareClients');
        const tabPeriods = document.getElementById('tabComparePeriods');
        const clientsSection = document.getElementById('clientsModeSection');
        const periodsSection = document.getElementById('periodsModeSection');

        // Mode Switching Tab click handlers
        if (tabClients && tabPeriods) {
            tabClients.addEventListener('click', () => {
                tabClients.classList.add('active');
                tabPeriods.classList.remove('active');
                clientsSection.style.display = 'block';
                periodsSection.style.display = 'none';
                this.mode = 'clients';
            });

            tabPeriods.addEventListener('click', () => {
                tabPeriods.classList.add('active');
                tabClients.classList.remove('active');
                periodsSection.style.display = 'block';
                clientsSection.style.display = 'none';
                this.mode = 'periods';
                
                this.initDefaultPeriodDates();
                this.calculatePeriodStats('A');
                this.calculatePeriodStats('B');
            });
        }

        // Compare Clients Events
        const selectLogDateA = document.getElementById('selectLogDateA');
        const selectLogDateB = document.getElementById('selectLogDateB');
        const selectClientA = document.getElementById('selectClientA');
        const selectClientB = document.getElementById('selectClientB');

        const triggerShowPicker = (e) => {
            if (typeof e.target.showPicker === 'function') {
                try { e.target.showPicker(); } catch (err) {}
            }
        };

        if (selectLogDateA) {
            selectLogDateA.addEventListener('click', triggerShowPicker);
            selectLogDateA.addEventListener('change', (e) => {
                const chosen = e.target.value;
                if (!chosen) return;
                const closest = this.getClosestLogDate(chosen);
                if (closest && closest !== chosen) {
                    e.target.value = closest;
                    this.logDateA = closest;
                    const alertEl = document.getElementById('dateAlertA');
                    if (alertEl) {
                        alertEl.textContent = `Disesuaikan ke tanggal terdekat: ${closest}`;
                        alertEl.style.display = 'block';
                        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
                    }
                } else {
                    this.logDateA = chosen;
                }
                this.updateClientOptions('A', this.logDateA);
            });
        }

        if (selectLogDateB) {
            selectLogDateB.addEventListener('click', triggerShowPicker);
            selectLogDateB.addEventListener('change', (e) => {
                const chosen = e.target.value;
                if (!chosen) return;
                const closest = this.getClosestLogDate(chosen);
                if (closest && closest !== chosen) {
                    e.target.value = closest;
                    this.logDateB = closest;
                    const alertEl = document.getElementById('dateAlertB');
                    if (alertEl) {
                        alertEl.textContent = `Disesuaikan ke tanggal terdekat: ${closest}`;
                        alertEl.style.display = 'block';
                        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
                    }
                } else {
                    this.logDateB = chosen;
                }
                this.updateClientOptions('B', this.logDateB);
            });
        }

        if (selectClientA) {
            selectClientA.addEventListener('change', (e) => {
                this.clientAName = decodeURIComponent(e.target.value);
                this.renderClientDetail('A', this.clientAName, this.logDateA);
            });
        }

        if (selectClientB) {
            selectClientB.addEventListener('change', (e) => {
                this.clientBName = decodeURIComponent(e.target.value);
                this.renderClientDetail('B', this.clientBName, this.logDateB);
            });
        }

        // Period Comparison Filter & Date Inputs
        const riskFilter = document.getElementById('periodChurnRiskFilter');
        const pAStart = document.getElementById('periodAStartInput');
        const pAEnd = document.getElementById('periodAEndInput');
        const pBStart = document.getElementById('periodBStartInput');
        const pBEnd = document.getElementById('periodBEndInput');

        if (riskFilter) {
            riskFilter.addEventListener('change', (e) => {
                this.periodRiskFilter = e.target.value;
                this.calculatePeriodStats('A');
                this.calculatePeriodStats('B');
            });
        }

        if (pAStart) {
            pAStart.addEventListener('click', triggerShowPicker);
            pAStart.addEventListener('change', (e) => { this.periodAStart = e.target.value; this.calculatePeriodStats('A'); });
        }
        if (pAEnd) {
            pAEnd.addEventListener('click', triggerShowPicker);
            pAEnd.addEventListener('change', (e) => { this.periodAEnd = e.target.value; this.calculatePeriodStats('A'); });
        }
        if (pBStart) {
            pBStart.addEventListener('click', triggerShowPicker);
            pBStart.addEventListener('change', (e) => { this.periodBStart = e.target.value; this.calculatePeriodStats('B'); });
        }
        if (pBEnd) {
            pBEnd.addEventListener('click', triggerShowPicker);
            pBEnd.addEventListener('change', (e) => { this.periodBEnd = e.target.value; this.calculatePeriodStats('B'); });
        }
    },

    async loadChurnData() {
        try {
            // Load from Churn Activity endpoint
            this.records = await window.App.api.getChurnActivity();
            this.populateLogDateDropdowns();
        } catch (err) {
            console.error('Error loading churn activities', err);
        }
    },

    populateLogDateDropdowns() {
        const selectLogDateA = document.getElementById('selectLogDateA');
        const selectLogDateB = document.getElementById('selectLogDateB');
        if (!selectLogDateA || !selectLogDateB) return;

        // Get distinct log dates, sorted descending (newest first)
        const logDates = [...new Set(this.records.map(r => this.getLogDate(r)))]
            .filter(Boolean)
            .sort((a, b) => new Date(b) - new Date(a));

        if (logDates.length === 0) {
            return;
        }

        const oldestDate = logDates[logDates.length - 1];
        const latestDate = logDates[0];

        // Set min, max and values for date inputs
        selectLogDateA.min = oldestDate;
        selectLogDateA.max = latestDate;
        selectLogDateA.value = latestDate;

        selectLogDateB.min = oldestDate;
        selectLogDateB.max = latestDate;
        selectLogDateB.value = latestDate;

        // Populate datalists for auto-suggest / highlight in calendar
        const datalistA = document.getElementById('logDatesListA');
        const datalistB = document.getElementById('logDatesListB');
        let datalistHtml = '';
        logDates.forEach(date => {
            datalistHtml += `<option value="${date}"></option>`;
        });
        if (datalistA) datalistA.innerHTML = datalistHtml;
        if (datalistB) datalistB.innerHTML = datalistHtml;

        this.logDateA = latestDate;
        this.logDateB = latestDate;

        // Trigger updates for client options
        this.updateClientOptions('A', latestDate);
        this.updateClientOptions('B', latestDate);
    },

    updateClientOptions(side, logDate) {
        const selectClient = document.getElementById(`selectClient${side}`);
        if (!selectClient) return;

        if (!logDate) {
            selectClient.innerHTML = '<option value="">-- Pilih Perusahaan --</option>';
            selectClient.disabled = true;
            if (side === 'A') { this.clientAName = ''; } else { this.clientBName = ''; }
            this.renderClientDetail(side, '', '');
            return;
        }

        // Get all matching clients for this specific log date
        const dateRecords = this.records.filter(r => this.getLogDate(r) === logDate);
        const clientNames = [...new Set(dateRecords.map(r => this.getClientName(r)))]
            .filter(name => name && name !== 'Unknown Client')
            .sort((a, b) => a.localeCompare(b));

        if (clientNames.length === 0) {
            selectClient.innerHTML = '<option value="">Tidak ada perusahaan</option>';
            selectClient.disabled = true;
            if (side === 'A') { this.clientAName = ''; } else { this.clientBName = ''; }
            this.renderClientDetail(side, '', logDate);
            return;
        }

        let optionsHtml = '<option value="">-- Pilih Perusahaan --</option>';
        clientNames.forEach(name => {
            optionsHtml += `<option value="${encodeURIComponent(name)}">${name}</option>`;
        });
        selectClient.innerHTML = optionsHtml;
        selectClient.disabled = false;

        // Try to retain the previously selected company if it exists for this new date
        const prevClient = side === 'A' ? this.clientAName : this.clientBName;
        if (prevClient && clientNames.includes(prevClient)) {
            selectClient.value = encodeURIComponent(prevClient);
            this.renderClientDetail(side, prevClient, logDate);
        } else {
            // Otherwise reset the selection
            if (side === 'A') { this.clientAName = ''; } else { this.clientBName = ''; }
            selectClient.value = '';
            this.renderClientDetail(side, '', logDate);
        }
    },

    renderClientDetail(side, clientName, logDate) {
        const detailEl = document.getElementById(`detailClient${side}`);
        if (!detailEl) return;

        if (!logDate) {
            detailEl.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
                    <i class="uil uil-calendar-alt" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
                    Silakan pilih tanggal log terlebih dahulu.
                </div>
            `;
            this.updateClientComparisonSummary();
            return;
        }

        if (!clientName) {
            detailEl.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
                    <i class="uil uil-user-check" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
                    Silakan pilih perusahaan terlebih dahulu.
                </div>
            `;
            this.updateClientComparisonSummary();
            return;
        }

        // Find the specific record matching Client Name and Log Date
        const record = this.records.find(r => this.getClientName(r) === clientName && this.getLogDate(r) === logDate);
        if (!record) {
            detailEl.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: var(--danger);">
                    <i class="uil uil-exclamation-triangle" style="font-size: 3rem; display: block; margin-bottom: 12px;"></i>
                    Data tidak ditemukan untuk tanggal log ini.
                </div>
            `;
            this.updateClientComparisonSummary();
            return;
        }

        const fields = record.fields || {};

        // Extract metrics with fallbacks
        const industry = this.getDisplayVal(fields['Industry'] || fields['account_primary_industry']);
        const region = this.getDisplayVal(fields['Region'] || fields['country_region'] || fields['account_owner_region']);
        const partner = this.getDisplayVal(fields['Partner Name'] || fields['channel_account_clear_name']);
        
        const arrVal = fields['ARR (USD)'] || fields['ARR'] || fields['account_last_effective_arr_usd'] || fields['oppo_closed_won_arr_usd'];
        const arr = arrVal ? Number(arrVal) : null;
        
        const adoptionVal = fields['% Adoption'] || fields['Adoption'] || fields['adoption'] || fields['DAU'] || fields['suite_dau_avg_work_w1'];
        const adoption = adoptionVal ? parseFloat(adoptionVal) : null;
        
        const renewalDateRaw = fields['Renewal Date'] || fields['Renewal'] || fields['account_upcoming_renew_date'] || fields['account_last_effective_date'];
        const renewalDate = this.formatDateValue(renewalDateRaw);
        
        const renewStatus = this.getDisplayVal(fields['Renew?'] || fields['Renew'] || fields['Renewal Date within T+90 Days'] || fields['renew_status']);
        
        // Churn Risk
        const churnRisk = this.getChurnRisk(record);
        let churnRiskBadgeClass = 'success';
        const riskLower = churnRisk.toLowerCase();
        if (riskLower.includes('critical') || riskLower.includes('high')) {
            churnRiskBadgeClass = 'danger';
        } else if (riskLower.includes('medium')) {
            churnRiskBadgeClass = 'warning';
        }

        // Engagement trends
        const wowVal = fields['WoW DAU'] || fields['wow_dau'] || fields['suite_dau_avg_work_w1_7d_diff_rate'];
        const wowDau = wowVal ? parseFloat(wowVal) : null;
        
        const qoqVal = fields['QoQ DAU'] || fields['qoq_dau'] || fields['suite_dau_avg_work_w1_90d_diff_rate'];
        const qoqDau = qoqVal ? parseFloat(qoqVal) : null;
        
        const durationVal = fields['Duration'] || fields['duration'] || fields['active_duration_pavg_work_w1'];
        const duration = durationVal ? parseFloat(durationVal) : null;
        
        const accountStatus = this.getDisplayVal(fields['Account Status'] || fields['account_status'] || 'Active');

        const formatArr = (val) => {
            if (val === null) return 'Tidak tersedia';
            return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };

        const renderTrend = (val) => {
            if (val === null) return '<span class="text-secondary">-</span>';
            const sign = val >= 0 ? '+' : '';
            const valFormatted = `${sign}${(val * 100).toFixed(1)}%`;
            if (val >= 0) {
                return `<span class="trend-indicator up"><i class="uil uil-arrow-grow"></i> ${valFormatted}</span>`;
            } else {
                return `<span class="trend-indicator down"><i class="uil uil-arrow-shrink"></i> ${valFormatted}</span>`;
            }
        };

        const renderAdoptionBar = (val) => {
            if (val === null) return '<span class="text-secondary">Tidak ada data</span>';
            const percentage = val <= 1 ? (val * 100).toFixed(0) : val.toFixed(0);
            
            let color = 'var(--success)';
            if (percentage < 50) color = 'var(--danger)';
            else if (percentage < 80) color = 'var(--warning)';

            return `
                <div style="font-weight:600; display:flex; justify-content:space-between; font-size:0.9rem;">
                    <span>${percentage}%</span>
                </div>
                <div class="progress-bar-wrapper">
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
                    </div>
                </div>
            `;
        };

        detailEl.innerHTML = `
            <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 14px;">
                <!-- Profile Card -->
                <div style="background: rgba(255,255,255,0.02); padding: 14px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
                    <h4 style="margin-bottom: 8px; color: var(--text-primary);">${clientName}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Log Date:</strong> <span style="color:var(--primary-light); font-weight:600;">${logDate}</span></p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Bidang Usaha:</strong> ${industry}</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Wilayah:</strong> ${region}</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Mitra / Partner:</strong> ${partner}</p>
                </div>

                <!-- Comparison Rows -->
                <div class="compare-row">
                    <span class="compare-label">Churn Risk Level</span>
                    <span class="compare-value"><span class="badge ${churnRiskBadgeClass}">${churnRisk}</span></span>
                </div>

                <div class="compare-row">
                    <span class="compare-label">ARR (USD)</span>
                    <span class="compare-value" style="font-size: 1.1rem; color: var(--text-primary); font-weight: 700;">${formatArr(arr)}</span>
                </div>

                <div class="compare-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                    <span class="compare-label">% Adoption Rate</span>
                    <div style="width: 100%;">${renderAdoptionBar(adoption)}</div>
                </div>

                <div class="compare-row">
                    <span class="compare-label">WoW DAU Trend</span>
                    <span class="compare-value">${renderTrend(wowDau)}</span>
                </div>

                <div class="compare-row">
                    <span class="compare-label">QoQ DAU Trend</span>
                    <span class="compare-value">${renderTrend(qoqDau)}</span>
                </div>

                <div class="compare-row">
                    <span class="compare-label">Durasi Penggunaan</span>
                    <span class="compare-value" style="color: var(--text-primary);">${duration !== null ? `${duration.toFixed(1)} menit/hari` : '-'}</span>
                </div>

                <div class="compare-row">
                    <span class="compare-label">Status Akun</span>
                    <span class="compare-value"><span class="badge primary">${accountStatus}</span></span>
                </div>

                <div class="compare-row">
                    <span class="compare-label">Renewal Date</span>
                    <span class="compare-value" style="color: var(--text-primary);">${renewalDate}</span>
                </div>

                <div class="compare-row">
                    <span class="compare-label">Apakah Renew?</span>
                    <span class="compare-value">
                        <span class="badge ${renewStatus.toLowerCase() === 'yes' ? 'success' : renewStatus.toLowerCase() === 'no' ? 'danger' : 'warning'}">
                            ${renewStatus}
                        </span>
                    </span>
                </div>

                <div class="compare-row" style="background: rgba(255,255,255,0.01); padding: 10px; border-radius: var(--border-radius-sm);">
                    <span class="compare-label">Assigned PIC (CSM)</span>
                    <span class="compare-value" style="color: var(--primary-light); font-weight: 600;">
                        <i class="uil uil-user" style="margin-right: 4px;"></i> ${record.pic || 'Belum diisi'}
                    </span>
                </div>
            </div>
        `;

        this.updateClientComparisonSummary();
    },

    updateClientComparisonSummary() {
        const summaryCard = document.getElementById('clientsSummaryCard');
        if (!summaryCard) return;

        if (!this.clientAName || !this.logDateA || !this.clientBName || !this.logDateB) {
            summaryCard.style.display = 'none';
            return;
        }

        const recA = this.records.find(r => this.getClientName(r) === this.clientAName && this.getLogDate(r) === this.logDateA);
        const recB = this.records.find(r => this.getClientName(r) === this.clientBName && this.getLogDate(r) === this.logDateB);

        if (!recA || !recB) {
            summaryCard.style.display = 'none';
            return;
        }

        const fieldsA = recA.fields || {};
        const fieldsB = recB.fields || {};

        // Extract ARR
        const arrValA = fieldsA['ARR (USD)'] || fieldsA['account_last_effective_arr_usd'] || fieldsA['oppo_closed_won_arr_usd'] || 0;
        const arrValB = fieldsB['ARR (USD)'] || fieldsB['account_last_effective_arr_usd'] || fieldsB['oppo_closed_won_arr_usd'] || 0;
        const arrA = Number(arrValA);
        const arrB = Number(arrValB);
        const arrDiff = arrB - arrA;

        // Extract Adoption
        const adValA = fieldsA['% Adoption'] || fieldsA['Adoption'] || fieldsA['adoption'] || fieldsA['DAU'] || fieldsA['suite_dau_avg_work_w1'] || 0;
        const adValB = fieldsB['% Adoption'] || fieldsB['Adoption'] || fieldsB['adoption'] || fieldsB['DAU'] || fieldsB['suite_dau_avg_work_w1'] || 0;
        const adA = parseFloat(adValA) <= 1 ? parseFloat(adValA) * 100 : parseFloat(adValA);
        const adB = parseFloat(adValB) <= 1 ? parseFloat(adValB) * 100 : parseFloat(adValB);
        const adDiff = adB - adA;

        const riskA = this.getChurnRisk(recA);
        const riskB = this.getChurnRisk(recB);

        const isSameCompany = this.clientAName === this.clientBName;

        let summaryHtml = '';
        let aiHtml = '';

        if (isSameCompany) {
            summaryHtml = `
                <h4 style="margin-bottom: 12px; color: var(--primary-light); font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i class="uil uil-comparison"></i> Analisis Perbandingan Historis: ${this.clientAName}
                </h4>
                <div class="grid grid-cols-3" style="gap: 16px; margin-bottom: 16px;">
                    <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block;">Perubahan ARR</span>
                        <strong style="font-size: 1.05rem; color: ${arrDiff >= 0 ? 'var(--success)' : 'var(--danger)'};">
                            ${arrDiff >= 0 ? '+' : ''}$${arrDiff.toLocaleString('en-US', {maximumFractionDigits:0})}
                        </strong>
                    </div>
                    <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block;">Perubahan Adopsi</span>
                        <strong style="font-size: 1.05rem; color: ${adDiff >= 0 ? 'var(--success)' : 'var(--danger)'};">
                            ${adDiff >= 0 ? '+' : ''}${adDiff.toFixed(1)}%
                        </strong>
                    </div>
                    <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block;">Perubahan Risiko</span>
                        <strong style="font-size: 1.05rem; color: var(--text-primary);">
                            ${riskA} &rarr; ${riskB}
                        </strong>
                    </div>
                </div>
            `;

            // Risk severity helper
            const getRiskLevel = (risk) => {
                const r = risk.toLowerCase();
                if (r.includes('critical') || r.includes('high')) return 3;
                if (r.includes('medium')) return 2;
                return 1;
            };

            const sevA = getRiskLevel(riskA);
            const sevB = getRiskLevel(riskB);

            if (sevB > sevA) {
                aiHtml = `
                    <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--danger); padding: 12px 16px; border-radius: 4px;">
                        <h5 style="color: var(--danger); margin-bottom: 6px; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                            <i class="uil uil-exclamation-octagon"></i> Solusi Next Step AI (Tindakan Kritis)
                        </h5>
                        <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">
                            Akun <strong>${this.clientAName}</strong> mengalami peningkatan risiko churn dari <strong>${riskA}</strong> menjadi <strong>${riskB}</strong>. 
                            Tingkat adopsi menurun sebesar <strong>${Math.abs(adDiff).toFixed(1)}%</strong>. 
                            <strong>Rekomendasi AI:</strong> Segera hubungi partner manager dan tugaskan PIC (${recB.pic || 'CSM'}) untuk membuat sesi briefing ulang, mengidentifikasi hambatan teknis, dan menjadwalkan training pengguna guna memulihkan tingkat adopsi.
                        </p>
                    </div>
                `;
            } else if (sevB < sevA) {
                aiHtml = `
                    <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid var(--success); padding: 12px 16px; border-radius: 4px;">
                        <h5 style="color: var(--success); margin-bottom: 6px; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                            <i class="uil uil-check-circle"></i> Solusi Next Step AI (Apresiasi & Ekspansi)
                        </h5>
                        <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">
                            Kondisi akun <strong>${this.clientAName}</strong> membaik! Risiko churn turun menjadi <strong>${riskB}</strong> dengan kenaikan adopsi sebesar <strong>+${adDiff.toFixed(1)}%</strong>. 
                            <strong>Rekomendasi AI:</strong> Pertahankan strategi customer success yang sedang berjalan. Akun ini memiliki potensi tinggi untuk dilakukan program Upsell ke paket lisensi premium atau penawaran produk tambahan (Cross-sell) pada siklus review berikutnya.
                        </p>
                    </div>
                `;
            } else {
                // Stable risk
                if (sevB >= 2) {
                    aiHtml = `
                        <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid var(--warning); padding: 12px 16px; border-radius: 4px;">
                            <h5 style="color: var(--warning); margin-bottom: 6px; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                <i class="uil uil-exclamation-triangle"></i> Solusi Next Step AI (Mitigasi Risiko Stabil)
                            </h5>
                            <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">
                                Risiko churn akun <strong>${this.clientAName}</strong> tetap berada pada tingkat <strong>${riskB}</strong>. 
                                <strong>Rekomendasi AI:</strong> Segera hubungi PIC (${recB.pic || 'CSM'}) untuk mengecek log engagement harian. Buat rencana taktis peningkatan adopsi minimal 5% di bulan ini melalui email kampanye pemanfaatan fitur.
                            </p>
                        </div>
                    `;
                } else {
                    aiHtml = `
                        <div style="background: rgba(59, 130, 246, 0.08); border-left: 4px solid var(--primary-light); padding: 12px 16px; border-radius: 4px;">
                            <h5 style="color: var(--primary-light); margin-bottom: 6px; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                <i class="uil uil-info-circle"></i> Solusi Next Step AI (Pemeliharaan Sehat)
                            </h5>
                            <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">
                                Akun <strong>${this.clientAName}</strong> dalam keadaan sangat sehat dengan risiko rendah.
                                <strong>Rekomendasi AI:</strong> Jadikan akun ini sebagai kisah sukses (Success Story) untuk materi promosi penjualan ke klien baru, dan daftarkan mereka ke dalam program rujukan (Referral Program).
                            </p>
                        </div>
                    `;
                }
            }
        } else {
            // Different companies
            summaryHtml = `
                <h4 style="margin-bottom: 12px; color: var(--primary-light); font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <i class="uil uil-comparison"></i> Analisis Perbandingan Silang Klien
                </h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
                    Membandingkan <strong>${this.clientAName}</strong> (${this.logDateA}) dengan <strong>${this.clientBName}</strong> (${this.logDateB}).
                </p>
                <div class="grid grid-cols-2" style="gap: 16px; margin-bottom: 16px;">
                    <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block;">Perbandingan ARR</span>
                        <strong>${this.clientAName}: $${arrA.toLocaleString()} vs ${this.clientBName}: $${arrB.toLocaleString()}</strong>
                    </div>
                    <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block;">Perbandingan Adopsi</span>
                        <strong>${this.clientAName}: ${adA.toFixed(1)}% vs ${this.clientBName}: ${adB.toFixed(1)}%</strong>
                    </div>
                </div>
            `;

            aiHtml = `
                <div style="background: rgba(255, 255, 255, 0.02); border-left: 4px solid var(--accent); padding: 12px 16px; border-radius: 4px;">
                    <h5 style="color: var(--accent); margin-bottom: 6px; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                        <i class="uil uil-brain"></i> Solusi Next Step AI (Strategi Alokasi Resource)
                    </h5>
                    <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">
                        Kedua klien memiliki profil risiko yang berbeda (<strong>${riskA}</strong> vs <strong>${riskB}</strong>). 
                        <strong>Rekomendasi AI:</strong> Alokasikan perhatian utama tim CSM ke klien dengan adopsi terendah dan tingkat risiko tertinggi (yaitu <strong>${adA < adB ? this.clientAName : this.clientBName}</strong>). Replikasi strategi engagement sukses dari klien berkinerja tinggi ke klien berkinerja rendah.
                    </p>
                </div>
            `;
        }

        summaryCard.innerHTML = summaryHtml + aiHtml;
        summaryCard.style.display = 'block';
    },

    initDefaultPeriodDates() {
        if (!this.periodAStart || !this.periodAEnd) {
            this.periodAStart = '2024-01-01';
            this.periodAEnd = '2024-12-31';
            document.getElementById('periodAStartInput').value = this.periodAStart;
            document.getElementById('periodAEndInput').value = this.periodAEnd;
        }
        if (!this.periodBStart || !this.periodBEnd) {
            this.periodBStart = '2025-01-01';
            this.periodBEnd = '2026-12-31';
            document.getElementById('periodBStartInput').value = this.periodBStart;
            document.getElementById('periodBEndInput').value = this.periodBEnd;
        }
    },

    parseDate(value) {
        if (!value) return null;
        if (typeof value === 'number') return new Date(value);
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) return parsed;
        return null;
    },

    filterRecordByDate(record, startStr, endStr) {
        const dateRaw = this.getLogDate(record);
        const logDate = this.parseDate(dateRaw);
        if (!logDate) return false;

        if (startStr) {
            const startDate = new Date(startStr);
            if (logDate < startDate) return false;
        }
        if (endStr) {
            const endDate = new Date(endStr);
            endDate.setHours(23, 59, 59, 999);
            if (logDate > endDate) return false;
        }
        return true;
    },

    calculatePeriodStats(side) {
        const statsEl = document.getElementById(`statsPeriod${side}`);
        if (!statsEl) return;

        const startStr = side === 'A' ? this.periodAStart : this.periodBStart;
        const endStr = side === 'A' ? this.periodAEnd : this.periodBEnd;

        // Step 1: Filter by date
        let filtered = this.records.filter(r => this.filterRecordByDate(r, startStr, endStr));

        // Step 2: Filter by selected Churn Risk Option if not 'All'
        if (this.periodRiskFilter !== 'All') {
            filtered = filtered.filter(r => this.getChurnRisk(r).toLowerCase().includes(this.periodRiskFilter.toLowerCase()));
        }

        if (filtered.length === 0) {
            statsEl.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
                    <i class="uil uil-calendar-slash" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
                    Tidak ada log churn pada periode dan filter ini.
                </div>
            `;
            if (side === 'A') this.statsA = null; else this.statsB = null;
            this.updatePeriodComparisonSummary(this.statsA, this.statsB);
            return;
        }

        const logCount = filtered.length;
        // Group by Client Name to find distinct clients in this period log
        const distinctClients = [...new Set(filtered.map(r => this.getClientName(r)))];
        const clientCount = distinctClients.length;

        let totalArr = 0;
        let validArrCount = 0;
        let totalAdoption = 0;
        let validAdoptionCount = 0;

        let riskHighCount = 0;
        let riskMediumCount = 0;
        let riskLowCount = 0;
        let renewYes = 0;
        let renewNo = 0;

        filtered.forEach(r => {
            const fields = r.fields || {};
            
            // ARR with fallbacks
            const arrVal = fields['ARR (USD)'] || fields['ARR'] || fields['account_last_effective_arr_usd'] || fields['oppo_closed_won_arr_usd'];
            if (arrVal) {
                totalArr += Number(arrVal);
                validArrCount++;
            }
            
            // Adoption with fallbacks
            const adoptionVal = fields['% Adoption'] || fields['Adoption'] || fields['adoption'] || fields['DAU'] || fields['suite_dau_avg_work_w1'];
            if (adoptionVal) {
                const ad = parseFloat(adoptionVal);
                totalAdoption += ad <= 1 ? ad * 100 : ad;
                validAdoptionCount++;
            }
            
            // Risk Distribution
            const risk = this.getChurnRisk(r).toLowerCase();
            if (risk.includes('critical') || risk.includes('high')) {
                riskHighCount++;
            } else if (risk.includes('medium')) {
                riskMediumCount++;
            } else {
                riskLowCount++;
            }
            
            // Renewal
            const renewVal = fields['Renew?'] || fields['Renew'] || fields['Renewal Date within T+90 Days'] || '';
            const renew = this.getDisplayVal(renewVal).toLowerCase();
            if (renew.includes('yes') || renew.includes('active')) renewYes++;
            else if (renew.includes('no')) renewNo++;
        });

        const avgAdoption = validAdoptionCount > 0 ? (totalAdoption / validAdoptionCount).toFixed(1) : null;
        const formatCurrency = (val) => {
            return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
        };

        const highRiskRate = ((riskHighCount / logCount) * 100).toFixed(1);
        const renewRate = (renewYes + renewNo) > 0 ? ((renewYes / (renewYes + renewNo)) * 100).toFixed(0) : null;

        const stats = {
            logCount,
            clientCount,
            totalArr,
            avgAdoption,
            highRiskRate,
            renewRate,
            riskHighCount
        };

        if (side === 'A') {
            this.statsA = stats;
        } else {
            this.statsB = stats;
        }

        statsEl.innerHTML = `
            <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Aggregate Stats -->
                <div class="grid grid-cols-2" style="gap: 12px;">
                    <div class="agg-metric-card">
                        <span class="agg-metric-title">Jumlah Log Aktif</span>
                        <span class="agg-metric-value" style="color: var(--text-primary);">${logCount} <small style="font-size:0.75rem; color:var(--text-secondary);">(${clientCount} klien)</small></span>
                    </div>
                    <div class="agg-metric-card">
                        <span class="agg-metric-title">Total ARR Terpantau</span>
                        <span class="agg-metric-value" style="color: var(--success);">${formatCurrency(totalArr)}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2" style="gap: 12px;">
                    <div class="agg-metric-card">
                        <span class="agg-metric-title">Rerata Adopsi</span>
                        <span class="agg-metric-value" style="color: var(--accent);">${avgAdoption !== null ? `${avgAdoption}%` : '-'}</span>
                    </div>
                    <div class="agg-metric-card">
                        <span class="agg-metric-title">Rasio Renewal</span>
                        <span class="agg-metric-value" style="color: ${renewRate >= 80 ? 'var(--success)' : 'var(--warning)'};">${renewRate !== null ? `${renewRate}%` : '-'}</span>
                    </div>
                </div>

                <!-- Churn Risk breakdown -->
                <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--border-radius-md);">
                    <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                        Sebaran Churn Risk dalam Log
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="color: var(--danger); font-weight: 600;"><i class="uil uil-exclamation-octagon"></i> High / Critical Risk</span>
                            <strong>${riskHighCount} log (${highRiskRate}%)</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="color: var(--warning); font-weight: 600;"><i class="uil uil-exclamation-triangle"></i> Medium Risk</span>
                            <strong>${riskMediumCount} log</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="color: var(--success); font-weight: 600;"><i class="uil uil-check-circle"></i> Low Risk</span>
                            <strong>${riskLowCount} log</strong>
                        </div>
                    </div>
                </div>

                <!-- Renewal status summary -->
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                    <span>Renewal Stats:</span>
                    <strong>${renewYes} Yes / ${renewNo} No / ${logCount - renewYes - renewNo} Lainnya</strong>
                </div>
            </div>
        `;

        this.updatePeriodComparisonSummary(this.statsA, this.statsB);
    },

    updatePeriodComparisonSummary(statsA, statsB) {
        const summaryCard = document.getElementById('periodsSummaryCard');
        if (!summaryCard) return;

        if (!statsA || !statsB) {
            summaryCard.style.display = 'none';
            return;
        }

        const clientDiff = statsB.clientCount - statsA.clientCount;
        const arrDiff = statsB.totalArr - statsA.totalArr;
        
        let adDiff = 0;
        if (statsA.avgAdoption !== null && statsB.avgAdoption !== null) {
            adDiff = parseFloat(statsB.avgAdoption) - parseFloat(statsA.avgAdoption);
        }

        const highRiskDiff = parseFloat(statsB.highRiskRate) - parseFloat(statsA.highRiskRate);
        const highRiskCountDiff = (statsB.riskHighCount || 0) - (statsA.riskHighCount || 0);

        const isRiskFilterActive = ['critical', 'high', 'medium'].includes(this.periodRiskFilter.toLowerCase());

        let clientColor = 'var(--text-primary)';
        if (clientDiff > 0) {
            clientColor = isRiskFilterActive ? 'var(--danger)' : 'var(--success)';
        } else if (clientDiff < 0) {
            clientColor = isRiskFilterActive ? 'var(--success)' : 'var(--danger)';
        }

        let arrColor = 'var(--text-primary)';
        if (arrDiff > 0) {
            arrColor = isRiskFilterActive ? 'var(--danger)' : 'var(--success)';
        } else if (arrDiff < 0) {
            arrColor = isRiskFilterActive ? 'var(--success)' : 'var(--danger)';
        }

        const clientLabel = isRiskFilterActive ? 'Perubahan Klien Berisiko' : 'Perubahan Klien';
        const arrLabel = isRiskFilterActive ? 'Perubahan ARR Berisiko' : 'Perubahan Total ARR';

        let summaryHtml = `
            <h4 style="margin-bottom: 12px; color: var(--primary-light); font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                <i class="uil uil-comparison"></i> Ringkasan Perubahan Makro (Periode A ke B)
            </h4>
            <div class="grid grid-cols-4" style="gap: 12px; margin-bottom: 16px;">
                <div style="background: rgba(255,255,255,0.01); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); text-align: center;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">${clientLabel}</span>
                    <strong style="font-size: 1.1rem; color: ${clientColor};">
                        ${clientDiff >= 0 ? '+' : ''}${clientDiff}
                    </strong>
                </div>
                <div style="background: rgba(255,255,255,0.01); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); text-align: center;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">${arrLabel}</span>
                    <strong style="font-size: 1.1rem; color: ${arrColor};">
                        ${arrDiff >= 0 ? '+' : ''}$${arrDiff.toLocaleString('en-US', {maximumFractionDigits:0})}
                    </strong>
                </div>
                <div style="background: rgba(255,255,255,0.01); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); text-align: center;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">Perubahan Rerata Adopsi</span>
                    <strong style="font-size: 1.1rem; color: ${adDiff >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${adDiff >= 0 ? '+' : ''}${adDiff.toFixed(1)}%
                    </strong>
                </div>
                <div style="background: rgba(255,255,255,0.01); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); text-align: center;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">Perubahan High Risk %</span>
                    <strong style="font-size: 1.1rem; color: ${highRiskDiff <= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${highRiskDiff > 0 ? '+' : ''}${highRiskDiff.toFixed(1)}%
                    </strong>
                </div>
            </div>
        `;

        // Check if there are negative indicators
        const isClientsIndicatorNegative = isRiskFilterActive ? (clientDiff > 0) : (clientDiff < 0);
        const isArrIndicatorNegative = isRiskFilterActive ? (arrDiff > 0) : (arrDiff < 0);
        const isAdoptionDecreased = adDiff < 0;
        const isHighRiskRateIncreased = highRiskDiff > 0;
        const isHighRiskCountIncreased = highRiskCountDiff > 0;

        const isNegativeTrend = isClientsIndicatorNegative || isArrIndicatorNegative || isAdoptionDecreased || isHighRiskRateIncreased || isHighRiskCountIncreased;

        let aiHtml = '';
        if (isNegativeTrend) {
            let analysisPoints = [];
            let recommendations = [];

            if (isRiskFilterActive) {
                if (clientDiff > 0) {
                    analysisPoints.push(`Jumlah **Klien Berisiko meningkat sebanyak +${clientDiff} klien** di segmen "${this.periodRiskFilter}" (dari ${statsA.clientCount} ke ${statsB.clientCount} klien). Ini menunjukkan penyebaran risiko churn baru.`);
                    recommendations.push("Identifikasi akun-akun baru yang masuk ke kategori risiko tinggi ini dan tugaskan tim CSM untuk intervensi langsung.");
                }
                if (arrDiff > 0) {
                    analysisPoints.push(`Nilai **ARR yang Terancam (At-Risk) bertambah sebesar +$${arrDiff.toLocaleString()}** (total ARR berisiko saat ini: $${statsB.totalArr.toLocaleString()}).`);
                    recommendations.push("Fokuskan penanganan khusus pada akun dengan nilai kontrak (ARR) terbesar untuk mencegah kerugian finansial yang signifikan.");
                }
            } else {
                if (clientDiff < 0) {
                    analysisPoints.push(`Jumlah **Klien Aktif berkurang sebanyak ${Math.abs(clientDiff)} klien**.`);
                    recommendations.push("Adakan post-mortem meeting untuk menganalisis mengapa klien tersebut churn.");
                }
                if (arrDiff < 0) {
                    analysisPoints.push(`Total **ARR menurun sebesar -$${Math.abs(arrDiff).toLocaleString()}**.`);
                    recommendations.push("Lakukan tinjauan harga atau negosiasi ulang kontrak pada akun yang mengalami penurunan nilai.");
                }
            }

            if (isHighRiskCountIncreased && !isRiskFilterActive) {
                analysisPoints.push(`Jumlah **Kasus High/Critical Risk meningkat sebanyak +${highRiskCountDiff} kasus** (dari ${statsA.riskHighCount} ke ${statsB.riskHighCount} log).`);
                recommendations.push("Segera jalankan audit kesehatan akun dan prioritaskan rencana pemulihan.");
            } else if (isHighRiskRateIncreased) {
                analysisPoints.push(`Rasio **High Churn Risk meningkat sebesar +${highRiskDiff.toFixed(1)}%**.`);
                recommendations.push("Jadwalkan rapat darurat tim CSM untuk membahas pembagian beban kerja akun berisiko.");
            }

            if (isAdoptionDecreased) {
                analysisPoints.push(`Rerata **Adopsi Produk menurun sebesar ${adDiff.toFixed(1)}%**.`);
                recommendations.push("Jadwalkan sesi refreshment training dan identifikasi hambatan adopsi fitur utama.");
            }

            if (recommendations.length < 3) {
                recommendations.push("Perketat KPI mingguan pemantauan WoW DAU pengguna.");
                recommendations.push("Lakukan audit onboarding untuk klien baru yang baru diaktifkan.");
            }

            aiHtml = `
                <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--danger); padding: 16px; border-radius: var(--border-radius-md);">
                    <h5 style="color: var(--danger); margin-bottom: 8px; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                        <i class="uil uil-exclamation-triangle" style="font-size: 1.1rem;"></i> Solusi Next Step AI (Kinerja Portofolio Menurun / Ancaman Risiko Meningkat)
                    </h5>
                    <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 12px;">
                        <p style="margin-bottom: 8px;">Analisis AI menunjukkan adanya tren negatif atau peningkatan risiko pada beberapa indikator utama:</p>
                        <ul style="padding-left: 20px; margin-bottom: 0; display: flex; flex-direction: column; gap: 4px;">
                            ${analysisPoints.map(pt => `<li>${pt}</li>`).join('')}
                        </ul>
                    </div>
                    <div style="border-top: 1px solid rgba(239, 68, 68, 0.15); padding-top: 10px;">
                        <strong style="color: var(--text-primary); font-size: 0.85rem; display: block; margin-bottom: 6px;">Rekomendasi Tindakan AI:</strong>
                        <ol style="font-size: 0.85rem; color: var(--text-secondary); padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
                            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
        } else {
            let highRiskDesc = '';
            if (highRiskDiff < 0) {
                highRiskDesc = `serta rasio pelanggan berisiko tinggi (High Churn Risk) berhasil berkurang sebesar **-${Math.abs(highRiskDiff).toFixed(1)}%**`;
            } else if (highRiskDiff > 0) {
                highRiskDesc = `serta rasio pelanggan berisiko tinggi (High Churn Risk) meningkat sebesar **+${highRiskDiff.toFixed(1)}%**`;
            } else {
                highRiskDesc = `serta rasio pelanggan berisiko tinggi (High Churn Risk) stabil (0.0%)`;
            }

            let successDescription = '';
            if (isRiskFilterActive) {
                successDescription = `Kondisi portofolio membaik! Terjadi penurunan jumlah klien berisiko sebanyak **${Math.abs(clientDiff)}**, pengurangan ARR terancam sebesar **-$${Math.abs(arrDiff).toLocaleString()}**, kenaikan rerata adopsi **+${adDiff.toFixed(1)}%**, ${highRiskDesc}.`;
            } else {
                successDescription = `Portofolio menunjukkan pertumbuhan yang sangat sehat! Terjadi penambahan klien sebanyak **+${clientDiff}**, peningkatan total ARR sebesar **+$${arrDiff.toLocaleString()}**, kenaikan rerata adopsi **+${adDiff.toFixed(1)}%**, ${highRiskDesc}.`;
            }

            aiHtml = `
                <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid var(--success); padding: 16px; border-radius: var(--border-radius-md);">
                    <h5 style="color: var(--success); margin-bottom: 8px; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                        <i class="uil uil-check-circle" style="font-size: 1.1rem;"></i> Solusi Next Step AI (Kinerja Portofolio Optimal)
                    </h5>
                    <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 12px;">
                        ${successDescription}
                    </p>
                    <div style="border-top: 1px solid rgba(16, 185, 129, 0.15); padding-top: 10px;">
                        <strong style="color: var(--text-primary); font-size: 0.85rem; display: block; margin-bottom: 6px;">Rekomendasi Tindakan AI:</strong>
                        <ol style="font-size: 0.85rem; color: var(--text-secondary); padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
                            <li>Dokumentasikan program sukses onboarding dari periode ini untuk dijadikan SOP baku onboarding akun baru.</li>
                            <li>Lakukan inisiatif ekspansi (Upsell/Cross-sell) secara proaktif pada klien stabil dengan tren DAU menanjak.</li>
                            <li>Publikasikan kisah sukses klien (Success Story) untuk memperkuat portofolio penjualan baru.</li>
                        </ol>
                    </div>
                </div>
            `;
        }

        summaryCard.innerHTML = summaryHtml + aiHtml;
        summaryCard.style.display = 'block';
    }
};
