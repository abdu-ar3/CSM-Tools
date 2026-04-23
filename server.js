const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from this directory
app.use(express.static(__dirname));

// API: Get all clients
app.get('/api/clients', (req, res) => {
    db.all("SELECT * FROM clients", [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// API: Create new client
app.post('/api/clients', (req, res) => {
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

// API: Update client
app.put('/api/clients/:id', (req, res) => {
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
app.delete('/api/clients/:id', (req, res) => {
    db.run('DELETE FROM clients WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
});

// Fallback to index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
