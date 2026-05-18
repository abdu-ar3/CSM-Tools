window.App = window.App || { views: {} };
window.App.views.settings = {
    render() {
        return `
            <div class="will-animate">
                <h2 style="margin-bottom: 24px;">Configuration</h2>
                <div class="card">
                    <h3 style="margin-bottom: 16px;">Lark Base Connection</h3>
                    <p class="text-secondary" style="margin-bottom: 20px;">Provide your Lark Open API credentials to sync clients to Bitable.</p>
                    
                    <div class="grid grid-cols-2" style="gap: 16px;">
                        <div class="form-group">
                            <label>App ID (cli_...)</label>
                            <input type="text" id="lark_app_id" class="form-control" placeholder="cli_a4b...">
                        </div>
                        <div class="form-group">
                            <label>App Secret</label>
                            <input type="password" id="lark_app_secret" class="form-control" placeholder="••••••••••••••">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Lark Base URL Link</label>
                            <input type="text" id="lark_base_link" class="form-control" placeholder="https://yourdomain.larksuite.com/base/bascn...?table=tbl...">
                            <small class="text-secondary" style="display: block; margin-top: 4px;">Copy and paste the full web link of your Bitable database table.</small>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2" style="gap: 16px; margin-top: 24px; align-items: center;">
                        <div class="form-group">
                            <label>UI Theme</label>
                            <select id="ui_theme" class="form-control">
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                            <small class="text-secondary" style="display: block; margin-top: 4px;">Choose the interface color mode for the dashboard.</small>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button class="btn btn-primary" id="btnSaveSettings"><i class="uil uil-save"></i> Save Configuration</button>
                        </div>
                    </div>
                    
                    <div id="settingsResult" style="margin-top: 16px; display: none;"></div>
                </div>
            </div>
        `;
    },
    
    async afterRender() {
        const btnSave = document.getElementById('btnSaveSettings');
        const resultEl = document.getElementById('settingsResult');
        
        btnSave.textContent = 'Loading...';
        btnSave.disabled = true;
        try {
            const config = await window.App.api.getConfig();
            if(config.lark_app_id) document.getElementById('lark_app_id').value = config.lark_app_id;
            if(config.lark_app_secret) document.getElementById('lark_app_secret').value = config.lark_app_secret;
            if(config.lark_base_link) document.getElementById('lark_base_link').value = config.lark_base_link;
            if(config.ui_theme) document.getElementById('ui_theme').value = config.ui_theme;
        } catch(err) {
            console.error("Failed to load config.");
        }
        btnSave.innerHTML = '<i class="uil uil-save"></i> Save Configuration';
        btnSave.disabled = false;

        const themeSelect = document.getElementById('ui_theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (event) => {
                window.App.setTheme(event.target.value);
            });
        }
        
        btnSave.addEventListener('click', async () => {
            const configData = {
                lark_app_id: document.getElementById('lark_app_id').value.trim(),
                lark_app_secret: document.getElementById('lark_app_secret').value.trim(),
                lark_base_link: document.getElementById('lark_base_link').value.trim(),
                ui_theme: document.getElementById('ui_theme').value
            };
            
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="uil uil-spinner"></i> Saving...';
            try {
                await window.App.api.saveConfig(configData);
                resultEl.style.display = 'block';
                resultEl.innerHTML = `<span class="text-success" style="padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; display: block;"><i class="uil uil-check-circle"></i> Settings saved successfully.</span>`;
                setTimeout(() => resultEl.style.display = 'none', 4000);
            } catch(err) {
                resultEl.style.display = 'block';
                resultEl.innerHTML = `<span class="text-danger" style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; display: block;"><i class="uil uil-exclamation-triangle"></i> Failed to save settings.</span>`;
            }
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="uil uil-save"></i> Save Configuration';
        });
    }
};
