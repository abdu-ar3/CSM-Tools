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
    }
};
