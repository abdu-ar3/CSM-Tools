const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const axios = require('axios');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Lark OAuth Configuration
const LARK_APP_ID = 'cli_a9636165c6ba5ed3';
const LARK_APP_SECRET = '6ZpkRpUkQWJ3YqOzw2phPeTJyhlk1UTp';
const LARK_REDIRECT_URI = process.env.LARK_REDIRECT_URI || 'http://localhost:3000/auth/lark/callback';

// Lark API Endpoints
const LARK_AUTH_URL = 'https://open.larksuite.com/open-apis/authen/v1/authorize';
const LARK_APP_TOKEN_URL = 'https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal';
const LARK_USER_TOKEN_URL = 'https://open.larksuite.com/open-apis/authen/v1/access_token';
const LARK_USER_INFO_URL = 'https://open.larksuite.com/open-apis/authen/v1/user_info';

// Helper: Get Lark app_access_token (required before exchanging code for user token)
async function getAppAccessToken() {
    const response = await axios.post(LARK_APP_TOKEN_URL, {
        app_id: LARK_APP_ID,
        app_secret: LARK_APP_SECRET
    }, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.data || !response.data.app_access_token) {
        throw new Error('Failed to obtain app_access_token from Lark: ' + JSON.stringify(response.data));
    }
    return response.data.app_access_token;
}

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'csm-dashboard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Trust proxy (needed behind Traefik/reverse proxy for secure cookies)
app.set('trust proxy', 1);

// Routes
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Lark OAuth routes
// Step 1: Redirect user to Lark authorization page
app.get('/auth/lark', (req, res) => {
  // Generate a random state to prevent CSRF
  const state = Math.random().toString(36).substring(2, 15);
  req.session.oauthState = state;

  const authUrl = `${LARK_AUTH_URL}?app_id=${LARK_APP_ID}&redirect_uri=${encodeURIComponent(LARK_REDIRECT_URI)}&state=${state}`;
  console.log('Redirecting to Lark auth:', authUrl);
  res.redirect(authUrl);
});

// Step 2: Handle callback from Lark
app.get('/auth/lark/callback', async (req, res) => {
  const { code, state } = req.query;

  // Validate state to prevent CSRF
  if (!state || state !== req.session.oauthState) {
    console.error('OAuth state mismatch. Expected:', req.session.oauthState, 'Got:', state);
    return res.redirect('/login?error=state_mismatch');
  }
  delete req.session.oauthState;

  if (!code) {
    console.error('No authorization code received from Lark');
    return res.redirect('/login?error=no_code');
  }

  try {
    // Step 2a: Get app_access_token
    const appAccessToken = await getAppAccessToken();
    console.log('Got app_access_token successfully');

    // Step 2b: Exchange code for user_access_token
    const tokenResponse = await axios.post(LARK_USER_TOKEN_URL, {
      grant_type: 'authorization_code',
      code: code
    }, {
      headers: {
        'Authorization': `Bearer ${appAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const tokenData = tokenResponse.data;
    if (tokenData.code !== 0) {
      console.error('Failed to exchange code for user token:', tokenData);
      return res.redirect('/login?error=token_exchange_failed');
    }

    const userAccessToken = tokenData.data.access_token;
    console.log('Got user_access_token successfully');

    // Step 2c: Fetch user info
    const userInfoResponse = await axios.get(LARK_USER_INFO_URL, {
      headers: {
        'Authorization': `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const userInfoData = userInfoResponse.data;
    if (userInfoData.code !== 0) {
      console.error('Failed to get user info:', userInfoData);
      return res.redirect('/login?error=user_info_failed');
    }

    // Save user to session
    req.session.user = {
      id: userInfoData.data.user_id,
      name: userInfoData.data.name,
      email: userInfoData.data.email,
      avatar: userInfoData.data.avatar_url,
      accessToken: userAccessToken
    };

    console.log('User logged in successfully:', req.session.user.name);
    res.redirect('/');

  } catch (error) {
    console.error('Lark OAuth error:', error.response?.data || error.message);
    res.redirect('/login?error=auth_failed');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Serve static frontend files from this directory
app.use(express.static(__dirname));

// API routes (protected)
app.get('/api/user', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// API: Get all clients
app.get('/api/clients', requireAuth, (req, res) => {
    db.all("SELECT * FROM clients", [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// API: Create new client
app.post('/api/clients', requireAuth, (req, res) => {
    const { name, industry, plan, health_score, status } = req.body;
    const sql = 'INSERT INTO clients (name, industry, plan, health_score, status) VALUES (?,?,?,?,?)';
    const params = [name, industry || 'Other', plan || 'Basic', health_score || 0, status || 'Active'];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: { id: this.lastID, name, industry, plan, health_score, status }
        });
    });
});

// API: Get customer issues
app.get('/api/issues', requireAuth, (req, res) => {
    db.all('SELECT * FROM customer_issues ORDER BY updated_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// API: Create customer issue
app.post('/api/issues', requireAuth, (req, res) => {
    const { title, customer, description, status, priority, assigned_to } = req.body;
    const sql = 'INSERT INTO customer_issues (title, customer, description, status, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [title, customer, description || '', status || 'Open', priority || 'Medium', assigned_to || ''];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'success', data: { id: this.lastID, title, customer, description, status, priority, assigned_to } });
    });
});

// API: Update customer issue
app.put('/api/issues/:id', requireAuth, (req, res) => {
    const issueId = req.params.id;
    const { title, customer, description, status, priority, assigned_to } = req.body;
    const sql = `UPDATE customer_issues SET title = COALESCE(?, title), customer = COALESCE(?, customer), description = COALESCE(?, description), status = COALESCE(?, status), priority = COALESCE(?, priority), assigned_to = COALESCE(?, assigned_to), updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const params = [title || null, customer || null, description || null, status || null, priority || null, assigned_to || null, issueId];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'success' });
    });
});

// API: Delete customer issue
app.delete('/api/issues/:id', requireAuth, (req, res) => {
    const issueId = req.params.id;
    db.run('DELETE FROM customer_issues WHERE id = ?', [issueId], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

// API: Update client
app.put('/api/clients/:id', requireAuth, (req, res) => {
    const { name, industry, plan, health_score, status } = req.body;
    const sql = 'UPDATE clients SET name = ?, industry = ?, plan = ?, health_score = ?, status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?';
    const params = [name, industry, plan, health_score, status, req.params.id];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success" });
    });
});

// API: Delete client
app.delete('/api/clients/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM clients WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
});

// API: Get config
app.get('/api/config', requireAuth, (req, res) => {
    db.all("SELECT key, value FROM settings", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        const config = {};
        rows.forEach(r => config[r.key] = r.value);
        res.json({ data: config });
    });
});

// API: Save config
app.post('/api/config', requireAuth, (req, res) => {
    const config = req.body;
    let hasError = false;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        Object.keys(config).forEach(k => {
            stmt.run(k, config[k], (err) => { if(err) hasError = err; });
        });
        stmt.finalize();
        db.run("COMMIT", (err) => {
            if(err || hasError) res.status(400).json({ error: hasError || err });
            else res.json({ message: "success" });
        });
    });
});

// Helper: read app configuration
const getConfig = () => new Promise((resolve, reject) => {
    db.all("SELECT key, value FROM settings", (err, rows) => {
        if(err) reject(err);
        else {
            const config = {};
            rows.forEach(r => config[r.key] = r.value);
            resolve(config);
        }
    });
});

const getAppTokenFromUrl = (baseUrl) => {
    const url = new URL(baseUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1];
};

const findTableIdByName = (tables, targetName) => {
    if (!tables?.items?.length) return null;
    const exact = tables.items.find(t => t.name.toLowerCase() === targetName.toLowerCase());
    if (exact) return exact.table_id;
    return tables.items[0]?.table_id || null;
};

const fetchAllBitableRecords = async (appToken, tableId, token) => {
    let records = [];
    let cursor = undefined;
    do {
        const url = new URL(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
        url.searchParams.append('page_size', '100');
        if (cursor) url.searchParams.append('cursor', cursor);

        const resp = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.code !== 0) throw new Error(data.msg || 'Failed to fetch Bitable records');

        records = records.concat(data.data.items || []);
        cursor = data.data.next_cursor;
    } while (cursor);
    return records;
};

const DEFAULT_TIMELINE_TASKS = [
    { task_name: 'Kick off meeting', days: 1, order_index: 1 },
    { task_name: 'Training onboarding admin', days: 7, order_index: 2 },
    { task_name: 'Onboarding user', days: 14, order_index: 3 }
];

const getAllProjectRecords = async (appToken, token) => {
    const tablesRes = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tablesData = await tablesRes.json();
    if (tablesData.code !== 0) {
        throw new Error('Failed to fetch tables list from Lark. Check Base access.');
    }

    const table_id = findTableIdByName(tablesData.data, 'New Summary');
    if (!table_id) {
        throw new Error("Could not locate the 'New Summary' table in your Lark Base.");
    }

    return await fetchAllBitableRecords(appToken, table_id, token);
};

const createDefaultTimelineTasks = (recordId, baseDate = new Date()) => new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO project_timelines (record_id, task_name, due_date, status, order_index) VALUES (?, ?, ?, ?, ?)');
    DEFAULT_TIMELINE_TASKS.forEach(task => {
        const dueDate = new Date(baseDate.getTime() + task.days * 24 * 60 * 60 * 1000);
        const formatted = dueDate.toISOString().split('T')[0];
        stmt.run([recordId, task.task_name, formatted, 'Pending', task.order_index]);
    });
    stmt.finalize(err => {
        if (err) reject(err);
        else resolve();
    });
});

const ensureTimelineForProject = (recordOrId, defaultFields = {}) => new Promise((resolve, reject) => {
    const recordId = typeof recordOrId === 'object' ? recordOrId.record_id : recordOrId;
    const fields = typeof recordOrId === 'object' ? (recordOrId.fields || {}) : defaultFields;

    db.get('SELECT COUNT(*) AS count FROM project_timelines WHERE record_id = ?', [recordId], async (err, row) => {
        if (err) return reject(err);
        if (row && row.count > 0) return resolve();
        try {
            // Find base date from handover fields
            let baseDate = new Date();
            const handoverDateRaw = fields['New Logo Won Date'] || fields['Service Start Date'];
            if (handoverDateRaw) {
                const parsed = new Date(handoverDateRaw);
                if (!isNaN(parsed.getTime())) {
                    baseDate = parsed;
                }
            }
            await createDefaultTimelineTasks(recordId, baseDate);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
});

// API: Get Lark organization users for PIC assignment
// Cache users for 5 minutes to avoid excessive API calls
let larkUsersCache = { data: null, timestamp: 0 };
const LARK_USERS_CACHE_TTL = 5 * 60 * 1000;

app.get('/api/lark-users', requireAuth, async (req, res) => {
    try {
        // Return cached data if still fresh
        if (larkUsersCache.data && (Date.now() - larkUsersCache.timestamp) < LARK_USERS_CACHE_TTL) {
            return res.json({ data: larkUsersCache.data });
        }

        const config = await getConfig();
        if (!config.lark_app_id || !config.lark_app_secret) {
            return res.status(400).json({ error: 'Lark Configuration is incomplete' });
        }

        // Get tenant_access_token
        const authRes = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: config.lark_app_id,
                app_secret: config.lark_app_secret
            })
        });
        const authData = await authRes.json();
        if (!authData.tenant_access_token) {
            return res.status(400).json({ error: 'Failed to authenticate with Lark', details: authData });
        }

        const token = authData.tenant_access_token;
        let allUsers = [];
        let fetchedFromScope = false;

        // First, fetch the scope of contact permissions
        try {
            const scopeRes = await fetch('https://open.larksuite.com/open-apis/contact/v3/scopes?user_id_type=open_id', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const scopeData = await scopeRes.json();

            if (scopeData.code === 0 && scopeData.data) {
                const { user_ids, department_ids } = scopeData.data;

                // If there are specific users authorized
                if (user_ids && user_ids.length > 0) {
                    fetchedFromScope = true;
                    // Batch fetch user details (max 50 per batch)
                    const batchSize = 50;
                    for (let i = 0; i < user_ids.length; i += batchSize) {
                        const chunk = user_ids.slice(i, i + batchSize);
                        const url = new URL('https://open.larksuite.com/open-apis/contact/v3/users/batch');
                        url.searchParams.append('user_id_type', 'open_id');
                        chunk.forEach(id => url.searchParams.append('user_ids', id));

                        const batchRes = await fetch(url.toString(), {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const batchData = await batchRes.json();
                        if (batchData.code === 0 && batchData.data && batchData.data.items) {
                            allUsers = allUsers.concat(batchData.data.items.map(user => ({
                                user_id: user.user_id,
                                name: user.name,
                                email: user.email || '',
                                avatar: user.avatar?.avatar_72 || user.avatar?.avatar_origin || '',
                                department: user.department_ids?.[0] || ''
                            })));
                        }
                    }
                }

                // If there are specific departments authorized
                if (department_ids && department_ids.length > 0) {
                    fetchedFromScope = true;
                    for (const deptId of department_ids) {
                        let pageToken = '';
                        let hasMore = true;
                        while (hasMore) {
                            const url = new URL('https://open.larksuite.com/open-apis/contact/v3/users/find_by_department');
                            url.searchParams.append('department_id', deptId);
                            url.searchParams.append('page_size', '50');
                            url.searchParams.append('user_id_type', 'open_id');
                            if (pageToken) url.searchParams.append('page_token', pageToken);

                            const usersRes = await fetch(url.toString(), {
                                method: 'GET',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const usersData = await usersRes.json();
                            if (usersData.code === 0 && usersData.data) {
                                const items = usersData.data.items || [];
                                allUsers = allUsers.concat(items.map(user => ({
                                    user_id: user.user_id,
                                    name: user.name,
                                    email: user.email || '',
                                    avatar: user.avatar?.avatar_72 || user.avatar?.avatar_origin || '',
                                    department: user.department_ids?.[0] || ''
                                })));
                                hasMore = usersData.data.has_more || false;
                                pageToken = usersData.data.page_token || '';
                            } else {
                                hasMore = false;
                            }
                        }
                    }
                }
            }
        } catch (scopeErr) {
            console.error('Error fetching contact scopes:', scopeErr);
        }

        // If we didn't fetch from scopes (or as a fallback), try department 0
        if (!fetchedFromScope || allUsers.length === 0) {
            let pageToken = '';
            let hasMore = true;
            let dept0Error = null;

            while (hasMore) {
                const url = new URL('https://open.larksuite.com/open-apis/contact/v3/users/find_by_department');
                url.searchParams.append('department_id', '0');
                url.searchParams.append('page_size', '50');
                url.searchParams.append('user_id_type', 'open_id');
                if (pageToken) url.searchParams.append('page_token', pageToken);

                const usersRes = await fetch(url.toString(), {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usersData = await usersRes.json();

                if (usersData.code !== 0) {
                    dept0Error = usersData;
                    hasMore = false;
                    break;
                }

                const items = usersData.data?.items || [];
                allUsers = allUsers.concat(items.map(user => ({
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email || '',
                    avatar: user.avatar?.avatar_72 || user.avatar?.avatar_origin || '',
                    department: user.department_ids?.[0] || ''
                })));

                hasMore = usersData.data?.has_more || false;
                pageToken = usersData.data?.page_token || '';
            }

            if (allUsers.length === 0 && dept0Error) {
                console.error('Lark users API error:', dept0Error);
                let friendlyMsg = 'Failed to fetch users from Lark.';
                if (dept0Error.code === 40004) {
                    friendlyMsg += ' Error "no dept authority" (40004). Pastikan di Lark Developer Console -> Permissions & Scopes -> Contacts, opsi "Data Access Range" sudah diubah ke "All members" (Semua anggota), lalu BUAT VERSI BARU dan RILIS/PUBLISH aplikasi agar perubahan efek.';
                }
                return res.status(400).json({
                    error: friendlyMsg,
                    details: dept0Error
                });
            }
        }

        // De-duplicate users by user_id
        const uniqueUsers = [];
        const seen = new Set();
        for (const u of allUsers) {
            if (!seen.has(u.user_id)) {
                seen.add(u.user_id);
                uniqueUsers.push(u);
            }
        }

        // Cache the results
        larkUsersCache = { data: uniqueUsers, timestamp: Date.now() };
        res.json({ data: uniqueUsers });

    } catch (err) {
        console.error('Error fetching Lark users:', err);
        res.status(500).json({ error: err.message });
    }
});

// API: Sync to Lark
app.post('/api/sync-lark', async (req, res) => {
    const getClients = () => new Promise((resolve, reject) => {
        db.all("SELECT * FROM clients", (err, rows) => {
            if(err) reject(err); else resolve(rows);
        });
    });

    try {
        const config = await getConfig();
        if(!config.lark_app_id || !config.lark_app_secret || !config.lark_base_link) {
            return res.status(400).json({ error: "Lark Configuration is incomplete" });
        }

        let app_token;
        try {
            app_token = getAppTokenFromUrl(config.lark_base_link);
            if (!app_token) throw new Error("Invalid format");
        } catch (e) {
            return res.status(400).json({ error: "Invalid Lark Base Link provided. Ensure it is copied correctly." });
        }

        const authRes = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: config.lark_app_id,
                app_secret: config.lark_app_secret
            })
        });
        
        const authData = await authRes.json();
        if (!authData.tenant_access_token) {
            return res.status(400).json({ error: "Failed to authenticate with Lark", details: authData });
        }

        const tablesRes = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${app_token}/tables`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authData.tenant_access_token}` }
        });
        const tablesData = await tablesRes.json();
        if (tablesData.code !== 0) {
            return res.status(400).json({ error: "Failed to fetch tables list from Lark. Check Base access.", details: tablesData });
        }

        const targetTableName = "CSM Tools";
        const table_id = findTableIdByName(tablesData.data, targetTableName);
        if (!table_id) {
             return res.status(400).json({ error: `Could not find any tables in the specified Base.` });
        }

        const clients = await getClients();
        if(clients.length === 0) return res.json({ message: "No clients to sync" });

        const records = clients.map(client => ({
            fields: {
                "Client Name": client.name,
                "Industry": client.industry,
                "Plan": client.plan,
                "Health Score": client.health_score,
                "Status": client.status
            }
        }));

        const syncRes = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records/batch_create`, {
            method: 'POST',
            headers: {
                 'Authorization': `Bearer ${authData.tenant_access_token}`,
                 'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records })
        });
        
        const syncData = await syncRes.json();
        if (syncData.code !== 0) {
            return res.status(400).json({ error: "Failed to sync to Lark", details: syncData });
        }

        res.json({ message: "Sync successful", synced_records: records.length });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Lark Project Closed Won records
app.get('/api/projects', async (req, res) => {
    try {
        const config = await getConfig();
        if(!config.lark_app_id || !config.lark_app_secret || !config.lark_base_link) {
            return res.status(400).json({ error: "Lark Configuration is incomplete" });
        }

        const app_token = getAppTokenFromUrl(config.lark_base_link);
        const authRes = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: config.lark_app_id,
                app_secret: config.lark_app_secret
            })
        });
        const authData = await authRes.json();
        if (!authData.tenant_access_token) {
            return res.status(400).json({ error: "Failed to authenticate with Lark", details: authData });
        }

        const tablesRes = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${app_token}/tables`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authData.tenant_access_token}` }
        });
        const tablesData = await tablesRes.json();
        if (tablesData.code !== 0) {
            return res.status(400).json({ error: "Failed to fetch tables list from Lark. Check Base access.", details: tablesData });
        }

        const table_id = findTableIdByName(tablesData.data, 'New Summary');
        if (!table_id) {
            return res.status(400).json({ error: "Could not locate the 'New Summary' table in your Lark Base." });
        }

        const records = await fetchAllBitableRecords(app_token, table_id, authData.tenant_access_token);

        db.all('SELECT record_id, pic FROM project_pics', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const picMap = {};
            rows.forEach(row => picMap[row.record_id] = row.pic);

            const normalized = records.map(record => ({
                record_id: record.record_id,
                fields: record.fields || {},
                pic: picMap[record.record_id] || ''
            }));
            res.json({ data: normalized });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get all timelines and ensure default timeline exists for each project
app.get('/api/timelines', async (req, res) => {
    try {
        const config = await getConfig();
        if(!config.lark_app_id || !config.lark_app_secret || !config.lark_base_link) {
            return res.status(400).json({ error: 'Lark Configuration is incomplete' });
        }

        const app_token = getAppTokenFromUrl(config.lark_base_link);
        const authRes = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_id: config.lark_app_id, app_secret: config.lark_app_secret })
        });
        const authData = await authRes.json();
        if (!authData.tenant_access_token) {
            return res.status(400).json({ error: 'Failed to authenticate with Lark', details: authData });
        }

        const records = await getAllProjectRecords(app_token, authData.tenant_access_token);
        await Promise.all(records.map(record => ensureTimelineForProject(record)));

        db.all('SELECT record_id, pic FROM project_pics', [], (err, picRows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const picMap = {};
            picRows.forEach(r => picMap[r.record_id] = r.pic);

            db.all('SELECT * FROM project_timelines ORDER BY record_id, order_index', [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                const grouped = {};
                rows.forEach(row => {
                    if (!grouped[row.record_id]) grouped[row.record_id] = [];
                    grouped[row.record_id].push(row);
                });

                const projectMap = {};
                records.forEach(record => {
                    projectMap[record.record_id] = {
                        record_id: record.record_id,
                        fields: record.fields || {},
                        pic: picMap[record.record_id] || ''
                    };
                });

                const data = Object.keys(grouped).map(recordId => ({
                    record_id: recordId,
                    project: projectMap[recordId] || { record_id: recordId, fields: {}, pic: picMap[recordId] || '' },
                    tasks: grouped[recordId]
                }));

                res.json({ data });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get timeline items for a specific project record
app.get('/api/project-timeline/:recordId', async (req, res) => {
    const recordId = req.params.recordId;
    try {
        await ensureTimelineForProject(recordId);
        db.all('SELECT * FROM project_timelines WHERE record_id = ? ORDER BY order_index', [recordId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Update timeline task status, due date, or actual date
app.put('/api/project-timeline/:recordId/task/:taskId', (req, res) => {
    const recordId = req.params.recordId;
    const taskId = req.params.taskId;
    const { status, due_date, actual_date, task_name } = req.body;
    const sql = 'UPDATE project_timelines SET status = COALESCE(?, status), due_date = COALESCE(?, due_date), actual_date = COALESCE(?, actual_date), task_name = COALESCE(?, task_name), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND record_id = ?';
    const params = [status || null, due_date || null, actual_date || null, task_name || null, taskId, recordId];
    db.run(sql, params, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success' });
    });
});

// API: Delete a timeline task
app.delete('/api/project-timeline/:recordId/task/:taskId', (req, res) => {
    const recordId = req.params.recordId;
    const taskId = req.params.taskId;
    db.run('DELETE FROM project_timelines WHERE id = ? AND record_id = ?', [taskId, recordId], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', changes: this.changes });
    });
});

// API: Create a new timeline task for a project record
app.post('/api/project-timeline/:recordId/task', (req, res) => {
    const recordId = req.params.recordId;
    const { task_name, due_date } = req.body;
    if (!task_name || !task_name.trim()) {
        return res.status(400).json({ error: 'Task name is required' });
    }

    db.get('SELECT MAX(order_index) AS max_index FROM project_timelines WHERE record_id = ?', [recordId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const nextIndex = (row && typeof row.max_index === 'number') ? row.max_index + 1 : 1;
        const sql = 'INSERT INTO project_timelines (record_id, task_name, due_date, status, order_index) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [recordId, task_name.trim(), due_date || null, 'Pending', nextIndex], function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'success', data: { id: this.lastID, record_id: recordId, task_name: task_name.trim(), due_date: due_date || null, status: 'Pending', order_index: nextIndex } });
        });
    });
});

// API: Save or update PIC for a project record
app.post('/api/project-pic/:recordId', (req, res) => {
    const recordId = req.params.recordId;
    const { pic } = req.body;
    const sql = `INSERT INTO project_pics (record_id, pic, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(record_id) DO UPDATE SET pic = excluded.pic, updated_at = excluded.updated_at`;

    db.run(sql, [recordId, pic || ''], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'success', data: { record_id: recordId, pic } });
    });
});

// Fallback removed — root route is already defined above with auth check

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
