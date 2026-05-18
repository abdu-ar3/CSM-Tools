const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Lark OAuth Configuration
const LARK_CLIENT_ID = 'cli_a9636165c6ba5ed3';
const LARK_CLIENT_SECRET = '6ZpkRpUkQWJ3YqOzw2phPeTJyhlk1UTp';
const LARK_REDIRECT_URI = 'http://localhost:3000/auth/lark/callback';

// Configure Passport with Lark OAuth2
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://open.larksuite.com/open-apis/authen/v1/authorize',
    tokenURL: 'https://open.larksuite.com/open-apis/authen/v1/access_token',
    clientID: LARK_CLIENT_ID,
    clientSecret: LARK_CLIENT_SECRET,
    callbackURL: LARK_REDIRECT_URI,
    scope: ['user.read']
  },
  function(accessToken, refreshToken, profile, done) {
    // Get user info from Lark
    axios.get('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      const userData = response.data;
      const user = {
        id: userData.data.user_id,
        name: userData.data.name,
        email: userData.data.email,
        avatar: userData.data.avatar_url,
        accessToken: accessToken
      };
      return done(null, user);
    })
    .catch(err => {
      console.error('Error getting user info:', err);
      return done(err, null);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'csm-dashboard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Lark OAuth routes
app.get('/auth/lark',
  passport.authenticate('oauth2'));

app.get('/auth/lark/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to dashboard
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
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
  res.json({ user: req.user });
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

const createDefaultTimelineTasks = (recordId) => new Promise((resolve, reject) => {
    const now = new Date();
    const stmt = db.prepare('INSERT INTO project_timelines (record_id, task_name, due_date, status, order_index) VALUES (?, ?, ?, ?, ?)');
    DEFAULT_TIMELINE_TASKS.forEach(task => {
        const dueDate = new Date(now.getTime() + task.days * 24 * 60 * 60 * 1000);
        const formatted = dueDate.toISOString().split('T')[0];
        stmt.run([recordId, task.task_name, formatted, 'Pending', task.order_index]);
    });
    stmt.finalize(err => {
        if (err) reject(err);
        else resolve();
    });
});

const ensureTimelineForProject = (recordId) => new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM project_timelines WHERE record_id = ?', [recordId], async (err, row) => {
        if (err) return reject(err);
        if (row && row.count > 0) return resolve();
        try {
            await createDefaultTimelineTasks(recordId);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
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
        await Promise.all(records.map(record => ensureTimelineForProject(record.record_id)));

        db.all('SELECT * FROM project_timelines ORDER BY record_id, order_index', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const grouped = {};
            rows.forEach(row => {
                if (!grouped[row.record_id]) grouped[row.record_id] = [];
                grouped[row.record_id].push(row);
            });

            const projectMap = {};
            records.forEach(record => {
                projectMap[record.record_id] = { record_id: record.record_id, fields: record.fields || {} };
            });

            const data = Object.keys(grouped).map(recordId => ({
                record_id: recordId,
                project: projectMap[recordId] || { record_id: recordId, fields: {} },
                tasks: grouped[recordId]
            }));

            res.json({ data });
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

// Fallback to index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
