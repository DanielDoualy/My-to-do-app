// Configuration de base
const API_BASE_URL = "/api/tasks";

// Helper pour gérer les erreurs
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Request failed');
    }
    return response.json();
};

// Récupère toutes les tâches
async function getTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await handleResponse(response);
        return data.tasks || [];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
}

// Récupère une tâche par ID
async function getTask(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/`);
        return handleResponse(response);
    } catch (error) {
        console.error(`Error fetching task ${id}:`, error);
        throw error;
    }
}

// Crée une tâche
async function createTask(task) {
    try {
        const response = await fetch(`${API_BASE_URL}/create/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify(task)
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
}

// Met à jour une tâche
async function updateTask(id, task) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/update/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify(task)
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`Error updating task ${id}:`, error);
        throw error;
    }
}

// Supprime une tâche
async function deleteTask(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/delete/`, {
            method: "DELETE",
            headers: {
                "X-CSRFToken": getCSRFToken()
            }
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`Error deleting task ${id}:`, error);
        throw error;
    }
}

// Toggle le statut de complétion
async function toggleTaskComplete(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/toggle/`, {
            method: "PATCH",
            headers: {
                "X-CSRFToken": getCSRFToken()
            }
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`Error toggling task ${id}:`, error);
        throw error;
    }
}