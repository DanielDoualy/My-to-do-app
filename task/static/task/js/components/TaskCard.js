// Composant ToastNotification intégré
function ToastNotification({ message, type = 'success', duration = 3000 }) {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    const icon = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle';

    return ReactDOM.createPortal(
        React.createElement('div', {
            className: `toast show ${bgClass} text-white`,
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1050,
                minWidth: '250px',
                animation: 'slideInRight 0.3s ease-out'
            }
        },
            React.createElement('div', { className: 'toast-body d-flex align-items-center justify-content-between' },
                React.createElement('div', { className: 'd-flex align-items-center' },
                    React.createElement('i', { className: `bi ${icon} me-2 fs-5` }),
                    React.createElement('span', null, message)
                ),
                React.createElement('button', {
                    type: 'button',
                    className: 'btn-close btn-close-white',
                    'aria-label': 'Close',
                    onClick: () => setIsVisible(false)
                })
            )
        ),
        document.body
    );
}

// Fonction utilitaire pour afficher un toast
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastContainer.appendChild(toastElement);
    
    ReactDOM.render(
        React.createElement(ToastNotification, { 
            message, 
            type,
            duration: type === 'success' ? 2000 : 4000 
        }),
        toastElement
    );
    
    setTimeout(() => {
        const element = document.getElementById(toastId);
        if (element) {
            ReactDOM.unmountComponentAtNode(element);
            element.remove();
        }
    }, type === 'success' ? 2500 : 4500);
}

// Main TaskCard Component - Optimisé Mobile
function TaskCard({ task, onDelete, onToggle }) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isToggling, setIsToggling] = React.useState(false);
    const [taskStatus, setTaskStatus] = React.useState(task.status || false);
    const [showCompletionEffect, setShowCompletionEffect] = React.useState(false);

    // FONCTION GARANTIE pour obtenir le token CSRF
    const getCSRFTokenSafe = () => {
        if (typeof window.getCSRFToken === 'function') {
            const token = window.getCSRFToken();
            if (token) return token;
        }
        
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('csrftoken=')) {
                return cookie.substring('csrftoken='.length);
            }
        }
        
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        console.error('CSRF token not found!');
        return '';
    };

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const csrfToken = getCSRFTokenSafe();
            
            if (!csrfToken) {
                throw new Error("Authentication error");
            }

            const response = await fetch(`/api/tasks/${task.id}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && onDelete) {
                    showToast(`Task deleted successfully`, 'success');
                    onDelete(task.id);
                } else {
                    showToast(data.error || 'Delete failed', 'error');
                    setIsDeleting(false);
                }
            } else {
                showToast('Failed to delete task', 'error');
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Network error. Please try again.', 'error');
            setIsDeleting(false);
        }
    };

    const handleToggle = async () => {
        if (isToggling) return;
        
        setIsToggling(true);
        const newStatus = !taskStatus;
        
        // Effet visuel immédiat
        if (newStatus) {
            setShowCompletionEffect(true);
            setTimeout(() => setShowCompletionEffect(false), 1000);
        }

        try {
            const csrfToken = getCSRFTokenSafe();
            
            if (!csrfToken) {
                throw new Error("Authentication error");
            }

            const response = await fetch(`/api/tasks/${task.id}/toggle/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTaskStatus(newStatus);
                    if (onToggle) {
                        onToggle(task.id, newStatus);
                    }
                    const action = newStatus ? 'completed' : 'marked as pending';
                    showToast(`Task ${action}`, 'success');
                } else {
                    showToast('Failed to update task', 'error');
                    setTaskStatus(!newStatus);
                }
            } else {
                showToast('Failed to update task', 'error');
                setTaskStatus(!newStatus);
            }
        } catch (error) {
            console.error('Toggle error:', error);
            showToast('Network error', 'error');
            setTaskStatus(!newStatus);
        } finally {
            setIsToggling(false);
        }
    };

    const handleEdit = () => {
        window.location.href = `/task/edit/${task.id}/`;
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="col-12 col-sm-6 col-lg-4 mb-4">
            <div 
                className={`task-card ${taskStatus ? 'completed' : ''} ${isDeleting ? 'deleting' : ''}`}
            >
                {/* Badge de statut */}
                {taskStatus && (
                    <div className="task-status-badge">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                )}
                
                {/* Effet de complétion */}
                {showCompletionEffect && (
                    <div className="completion-effect"></div>
                )}
                
                <div className="task-card-header">
                    {/* Toggle Switch */}
                    <div className="task-toggle">
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`toggle-${task.id}`}
                                checked={taskStatus}
                                onChange={handleToggle}
                                disabled={isToggling || isDeleting}
                            />
                            <label className="form-check-label" htmlFor={`toggle-${task.id}`}>
                                {taskStatus ? 'Done' : 'Pending'}
                            </label>
                        </div>
                    </div>
                    
                    {/* Titre */}
                    <h5 className="task-title">
                        {task.title}
                    </h5>
                    
                    {/* Date */}
                    <div className="task-date">
                        <i className="bi bi-calendar3"></i>
                        <span>{formatDate(task.created_at)}</span>
                    </div>
                </div>

                {/* Description */}
                <div className="task-description">
                    {task.description ? (
                        <p>{task.description}</p>
                    ) : (
                        <p className="text-muted fst-italic">No description</p>
                    )}
                </div>

                {/* Actions */}
                <div className="task-actions">
                    <button 
                        className={`btn-task btn-edit ${taskStatus ? 'btn-success' : 'btn-primary'}`}
                        onClick={handleEdit}
                        disabled={isDeleting || isToggling}
                    >
                        <i className="bi bi-pencil"></i>
                        <span>Edit</span>
                    </button>
                    <button 
                        className="btn-task btn-delete"
                        onClick={handleDelete}
                        disabled={isDeleting || isToggling}
                    >
                        {isDeleting ? (
                            <>
                                <span className="spinner-border spinner-border-sm"></span>
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash"></i>
                                <span>Delete</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Exposez les fonctions globalement
if (typeof window !== 'undefined') {
    window.TaskCard = TaskCard;
    window.showToast = showToast;
}

// Styles CSS optimisés pour mobile
const cardStyles = `
/* === CARD PRINCIPALE === */
.task-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 1.25rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.task-card.completed {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #86efac;
}

.task-card.deleting {
    opacity: 0.5;
    pointer-events: none;
}

/* === HEADER === */
.task-card-header {
    margin-bottom: 1rem;
}

/* Toggle Switch */
.task-toggle {
    margin-bottom: 1rem;
}

.task-toggle .form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: auto;
}

.task-toggle .form-check-input {
    width: 3rem;
    height: 1.5rem;
    cursor: pointer;
    margin: 0;
    flex-shrink: 0;
}

.task-toggle .form-check-input:checked {
    background-color: #22c55e;
    border-color: #22c55e;
}

.task-toggle .form-check-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    margin: 0;
    cursor: pointer;
}

.task-card.completed .form-check-label {
    color: #16a34a;
}

/* Titre */
.task-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
    word-wrap: break-word;
}

.task-card.completed .task-title {
    color: #16a34a;
    text-decoration: line-through;
    opacity: 0.8;
}

/* Date */
.task-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
}

.task-date i {
    font-size: 0.875rem;
}

/* === DESCRIPTION === */
.task-description {
    flex: 1;
    margin-bottom: 1rem;
    overflow: hidden;
}

.task-description p {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: #475569;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.task-card.completed .task-description p {
    color: #16a34a;
    text-decoration: line-through;
    opacity: 0.7;
}

/* === ACTIONS === */
.task-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: auto;
}

.btn-task {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: none;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;
}

.btn-task:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-task i {
    font-size: 1rem;
}

/* Bouton Edit */
.btn-edit {
    background: #3b82f6;
    color: white;
}

.btn-edit:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-edit.btn-success {
    background: #22c55e;
}

.btn-edit.btn-success:hover:not(:disabled) {
    background: #16a34a;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

/* Bouton Delete */
.btn-delete {
    background: #ef4444;
    color: white;
}

.btn-delete:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* === BADGE DE STATUT === */
.task-status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    background: #22c55e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    z-index: 2;
    animation: badgePop 0.4s ease-out;
}

@keyframes badgePop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* === EFFET DE COMPLÉTION === */
.completion-effect {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(34, 197, 94, 0.3), transparent);
    z-index: 1;
    animation: completionPulse 0.8s ease-out;
    pointer-events: none;
}

@keyframes completionPulse {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
        transform: scale(1.2);
    }
}

/* === TOAST === */
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.toast {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    border: none;
}

/* === RESPONSIVE === */
@media (max-width: 576px) {
    .task-card {
        padding: 1rem;
    }
    
    .task-title {
        font-size: 1.125rem;
    }
    
    .task-description p {
        font-size: 0.875rem;
        -webkit-line-clamp: 3;
    }
    
    .btn-task {
        font-size: 0.875rem;
        padding: 0.625rem;
    }
    
    .btn-task span {
        display: none;
    }
    
    .btn-task i {
        font-size: 1.125rem;
    }
    
    .task-actions {
        gap: 0.5rem;
    }
    
    .toast {
        left: 10px !important;
        right: 10px !important;
        top: 10px !important;
        min-width: auto !important;
        max-width: calc(100% - 20px) !important;
    }
}

@media (min-width: 577px) and (max-width: 768px) {
    .task-card {
        padding: 1.125rem;
    }
}

/* Amélioration tactile */
@media (hover: none) {
    .btn-task:active:not(:disabled) {
        transform: scale(0.95);
    }
}

/* === ANIMATIONS D'ENTRÉE === */
@keyframes cardFadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.task-card {
    animation: cardFadeIn 0.4s ease-out;
}

/* Stagger animation pour les cartes */
.task-card:nth-child(1) { animation-delay: 0s; }
.task-card:nth-child(2) { animation-delay: 0.1s; }
.task-card:nth-child(3) { animation-delay: 0.2s; }
.task-card:nth-child(4) { animation-delay: 0.3s; }
.task-card:nth-child(5) { animation-delay: 0.4s; }
.task-card:nth-child(6) { animation-delay: 0.5s; }
`;

// Injectez les styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = cardStyles;
    document.head.appendChild(styleSheet);
}