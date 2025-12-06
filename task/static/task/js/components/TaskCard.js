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

// Main TaskCard Component - Avec affichage de l'heure
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

    const formatTime = (timeString) => {
        if (!timeString) return null;
        try {
            // timeString est au format "HH:MM"
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return timeString;
        }
    };

    return (
        <div className="col-12 col-sm-6 col-xl-4 mb-4">
            <div 
                className={`task-card-modern ${taskStatus ? 'completed' : ''} ${isDeleting ? 'deleting' : ''}`}
            >
                {/* Effet de complétion */}
                {showCompletionEffect && (
                    <div className="completion-effect"></div>
                )}
                
                {/* Header avec toggle et badge */}
                <div className="task-card-header-modern">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        {/* Toggle Switch amélioré */}
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id={`toggle-${task.id}`}
                                checked={taskStatus}
                                onChange={handleToggle}
                                disabled={isToggling || isDeleting}
                            />
                            <label htmlFor={`toggle-${task.id}`}>
                                <div className="toggle-slider">
                                    <div className="toggle-icon">
                                        {taskStatus ? '✓' : ''}
                                    </div>
                                </div>
                            </label>
                        </div>
                        
                        {/* Badge de statut */}
                        <div className={`status-badge ${taskStatus ? 'completed' : 'pending'}`}>
                            {taskStatus ? (
                                <>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span>Done</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-clock"></i>
                                    <span>Pending</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Titre avec icône */}
                    <h5 className="task-title-modern">
                        <i className="bi bi-bookmark-fill title-icon"></i>
                        {task.title}
                    </h5>
                    
                    {/* Date et Heure avec design amélioré */}
                    <div className="task-meta-info">
                        <div className="task-date-modern">
                            <i className="bi bi-calendar-event"></i>
                            <span>{formatDate(task.created_at)}</span>
                        </div>
                        
                        {/* Affichage de l'heure de la tâche - NOUVEAU */}
                        {task.task_time && (
                            <div className="task-time-modern">
                                <i className="bi bi-alarm"></i>
                                <span>{formatTime(task.task_time)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description avec scroll */}
                <div className="task-description-modern">
                    {task.description ? (
                        <p>{task.description}</p>
                    ) : (
                        <p className="no-description">
                            <i className="bi bi-file-text"></i> No description provided
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="task-divider"></div>

                {/* Actions avec design moderne */}
                <div className="task-actions-modern">
                    <button 
                        className="btn-action btn-edit-modern"
                        onClick={handleEdit}
                        disabled={isDeleting || isToggling}
                        title="Edit task"
                    >
                        <i className="bi bi-pencil-square"></i>
                        <span>Edit</span>
                    </button>
                    <button 
                        className="btn-action btn-delete-modern"
                        onClick={handleDelete}
                        disabled={isDeleting || isToggling}
                        title="Delete task"
                    >
                        {isDeleting ? (
                            <>
                                <span className="spinner-border spinner-border-sm"></span>
                                <span>Deleting</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash3"></i>
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

// Styles CSS modernes avec l'heure
const cardStyles = `
/* === CARD PRINCIPALE - DESIGN MODERNE === */
.task-card-modern {
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 1.75rem;
    height: 100%;
    min-height: 320px;
    max-height: 450px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid #f1f5f9;
}

.task-card-modern:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    border-color: #e2e8f0;
}

.task-card-modern.completed {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #86efac;
}

.task-card-modern.completed:hover {
    box-shadow: 0 12px 40px rgba(34, 197, 94, 0.15);
}

.task-card-modern.deleting {
    opacity: 0.4;
    pointer-events: none;
    transform: scale(0.95);
}

/* === HEADER MODERNE === */
.task-card-header-modern {
    margin-bottom: 1.25rem;
}

/* Toggle Switch personnalisé */
.custom-toggle {
    position: relative;
}

.custom-toggle input[type="checkbox"] {
    display: none;
}

.custom-toggle label {
    display: block;
    width: 60px;
    height: 32px;
    background: #e2e8f0;
    border-radius: 50px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-toggle input:checked + label {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.toggle-slider {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 26px;
    height: 26px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
}

.custom-toggle input:checked + label .toggle-slider {
    transform: translateX(28px);
}

.toggle-icon {
    font-size: 14px;
    font-weight: bold;
    color: #22c55e;
    transition: all 0.3s ease;
}

.custom-toggle input:disabled + label {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Badge de statut moderne */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.875rem;
    border-radius: 50px;
    font-size: 0.8125rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.status-badge.pending {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    border: 1px solid #fbbf24;
}

.status-badge.completed {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
    border: 1px solid #34d399;
}

.status-badge i {
    font-size: 0.875rem;
}

/* Titre moderne */
.task-title-modern {
    font-size: 1.375rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.875rem 0;
    line-height: 1.4;
    word-wrap: break-word;
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
}

.title-icon {
    color: #3b82f6;
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.task-card-modern.completed .task-title-modern {
    color: #16a34a;
}

.task-card-modern.completed .title-icon {
    color: #22c55e;
}

/* === META INFO (Date + Heure) - NOUVEAU === */
.task-meta-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

/* Date moderne */
.task-date-modern {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.task-date-modern i {
    font-size: 0.875rem;
    color: #94a3b8;
}

/* Heure de tâche - NOUVEAU */
.task-time-modern {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #92400e;
    border: 1px solid #fbbf24;
    animation: pulseTime 2s ease-in-out infinite;
}

.task-time-modern i {
    font-size: 0.875rem;
    color: #d97706;
}

@keyframes pulseTime {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
    }
    50% {
        box-shadow: 0 0 0 4px rgba(251, 191, 36, 0);
    }
}

/* === DESCRIPTION MODERNE === */
.task-description-modern {
    flex: 1;
    margin-bottom: 1.25rem;
    overflow-y: auto;
    max-height: 120px;
    padding-right: 0.5rem;
}

.task-description-modern::-webkit-scrollbar {
    width: 6px;
}

.task-description-modern::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
}

.task-description-modern::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

.task-description-modern::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.task-description-modern p {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: #475569;
    margin: 0;
}

.task-description-modern .no-description {
    color: #94a3b8;
    font-style: italic;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.task-card-modern.completed .task-description-modern p {
    color: #16a34a;
    opacity: 0.85;
}

/* === DIVIDER === */
.task-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e2e8f0, transparent);
    margin: 0 0 1.25rem 0;
}

/* === ACTIONS MODERNES === */
.task-actions-modern {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.875rem;
}

.btn-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    border: none;
    border-radius: 12px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 48px;
    position: relative;
    overflow: hidden;
}

.btn-action::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.btn-action:hover::before {
    width: 300px;
    height: 300px;
}

.btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-action i {
    font-size: 1.125rem;
    z-index: 1;
}

.btn-action span {
    z-index: 1;
}

.btn-edit-modern {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-edit-modern:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-edit-modern:active:not(:disabled) {
    transform: translateY(-1px);
}

.btn-delete-modern {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-delete-modern:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.btn-delete-modern:active:not(:disabled) {
    transform: translateY(-1px);
}

/* === EFFET DE COMPLÉTION === */
.completion-effect {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(34, 197, 94, 0.4), transparent);
    z-index: 10;
    animation: completionPulse 1s ease-out;
    pointer-events: none;
}

@keyframes completionPulse {
    0% {
        opacity: 0;
        transform: scale(0.5);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
        transform: scale(1.5);
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
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    border: none;
}

/* === RESPONSIVE === */
@media (max-width: 576px) {
    .task-card-modern {
        padding: 1.5rem;
        min-height: 300px;
    }
    
    .task-title-modern {
        font-size: 1.25rem;
    }
    
    .title-icon {
        font-size: 1.125rem;
    }
    
    .task-meta-info {
        gap: 0.375rem;
    }
    
    .task-date-modern,
    .task-time-modern {
        font-size: 0.75rem;
        padding: 0.3rem 0.6rem;
    }
    
    .task-description-modern {
        max-height: 100px;
    }
    
    .task-description-modern p {
        font-size: 0.875rem;
    }
    
    .btn-action {
        font-size: 0.875rem;
        padding: 0.75rem;
    }
    
    .btn-action span {
        display: none;
    }
    
    .btn-action i {
        font-size: 1.25rem;
    }
    
    .task-actions-modern {
        gap: 0.625rem;
    }
    
    .status-badge {
        padding: 0.375rem 0.625rem;
        font-size: 0.75rem;
    }
    
    .status-badge span {
        display: none;
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
    .task-card-modern {
        padding: 1.625rem;
    }
    
    .task-title-modern {
        font-size: 1.3rem;
    }
}

@media (min-width: 1200px) and (max-width: 1399px) {
    .task-card-modern {
        min-height: 340px;
    }
}

@media (min-width: 1400px) {
    .task-card-modern {
        min-height: 350px;
    }
}

@media (hover: none) {
    .btn-action:active:not(:disabled) {
        transform: scale(0.95);
    }
    
    .task-card-modern:active {
        transform: scale(0.98);
    }
}

/* === ANIMATIONS D'ENTRÉE === */
@keyframes cardFadeIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.task-card-modern {
    animation: cardFadeIn 0.5s ease-out backwards;
}

.task-card-modern:nth-child(1) { animation-delay: 0s; }
.task-card-modern:nth-child(2) { animation-delay: 0.1s; }
.task-card-modern:nth-child(3) { animation-delay: 0.2s; }
.task-card-modern:nth-child(4) { animation-delay: 0.3s; }
.task-card-modern:nth-child(5) { animation-delay: 0.4s; }
.task-card-modern:nth-child(6) { animation-delay: 0.5s; }
.task-card-modern:nth-child(7) { animation-delay: 0.6s; }
.task-card-modern:nth-child(8) { animation-delay: 0.7s; }
.task-card-modern:nth-child(9) { animation-delay: 0.8s; }

.custom-toggle input:focus + label {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

.btn-action:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
    .task-card-modern {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    .task-card-modern:hover {
        border-color: #475569;
    }
    
    .task-title-modern {
        color: #f1f5f9;
    }
    
    .task-description-modern p {
        color: #cbd5e1;
    }
    
    .task-date-modern {
        background: #0f172a;
        border-color: #334155;
        color: #94a3b8;
    }
}
`;

// Injectez les styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = cardStyles;
    document.head.appendChild(styleSheet);
}