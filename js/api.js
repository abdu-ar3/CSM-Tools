const API_URL = '/api';

window.App = window.App || {};
window.App.api = {
    async getClients() {
        try {
            const response = await fetch(`${API_URL}/clients`);
            if (!response.ok) throw new Error('Failed to fetch clients');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getLarkUsers() {
        try {
            const response = await fetch(`${API_URL}/lark-users`);
            if (!response.ok) throw new Error('Failed to fetch Lark users');
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching Lark users:', error);
            return [];
        }
    },
    
    async addClient(clientData) {
        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });
        if (!response.ok) throw new Error('Failed to add client');
        return await response.json();
    },
    
    async updateClient(id, clientData) {
        const response = await fetch(`${API_URL}/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });
        if (!response.ok) throw new Error('Failed to update client');
        return await response.json();
    },
    
    async deleteClient(id) {
        const response = await fetch(`${API_URL}/clients/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete client');
        return await response.json();
    },

    async getConfig() {
        try {
            const response = await fetch(`${API_URL}/config`);
            if (!response.ok) throw new Error('Failed to fetch config');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return {};
        }
    },
    
    async saveConfig(configData) {
        const response = await fetch(`${API_URL}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });
        if (!response.ok) throw new Error('Failed to save config');
        return await response.json();
    },

    async getProjects() {
        try {
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getIssues() {
        const response = await fetch(`${API_URL}/issues`);
        if (!response.ok) throw new Error('Failed to fetch customer issues');
        const data = await response.json();
        return data.data;
    },

    async createIssue(issueData) {
        const response = await fetch(`${API_URL}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });
        if (!response.ok) throw new Error('Failed to create issue');
        return await response.json();
    },

    async updateIssue(issueId, issueData) {
        const response = await fetch(`${API_URL}/issues/${encodeURIComponent(issueId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });
        if (!response.ok) throw new Error('Failed to update issue');
        return await response.json();
    },

    async deleteIssue(issueId) {
        const response = await fetch(`${API_URL}/issues/${encodeURIComponent(issueId)}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete issue');
        return await response.json();
    },

    async setProjectPic(recordId, pic) {
        const response = await fetch(`${API_URL}/project-pic/${encodeURIComponent(recordId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pic })
        });
        if (!response.ok) throw new Error('Failed to update PIC');
        return await response.json();
    },

    async getTimelines() {
        const response = await fetch(`${API_URL}/timelines`);
        if (!response.ok) throw new Error('Failed to fetch timelines');
        const data = await response.json();
        return data.data;
    },

    async createTimelineTask(recordId, taskData) {
        const response = await fetch(`${API_URL}/project-timeline/${encodeURIComponent(recordId)}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to create timeline task');
        }
        return await response.json();
    },

    async deleteTimelineTask(recordId, taskId) {
        const response = await fetch(`${API_URL}/project-timeline/${encodeURIComponent(recordId)}/task/${encodeURIComponent(taskId)}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete timeline task');
        }
        return await response.json();
    },

    async updateTimelineTask(recordId, taskId, taskData) {
        const response = await fetch(`${API_URL}/project-timeline/${encodeURIComponent(recordId)}/task/${encodeURIComponent(taskId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to update timeline task');
        return await response.json();
    },

    async syncLark() {
        const response = await fetch(`${API_URL}/sync-lark`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to save config');
        return await response.json();
    },

    async syncLark() {
        const response = await fetch(`${API_URL}/sync-lark`, {
            method: 'POST'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to sync');
        return data;
    },

    async getChurnActivity() {
        try {
            const response = await fetch(`${API_URL}/churn-activity`);
            if (!response.ok) throw new Error('Failed to fetch churn activity');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return [];
        }
    }
};

