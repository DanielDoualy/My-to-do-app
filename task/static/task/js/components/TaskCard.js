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

// Main TaskCard Component - Toggle parfaitement ajusté
function TaskCard({ task, onDelete, onToggle }) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
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
                    showToast(`Task "${task.title}" deleted successfully`, 'success');
                    onDelete(task.id);
                } else {
                    showToast(data.error || 'Delete failed', 'error');
                    setIsDeleting(false);
                }
            } else {
                const errorText = await response.text();
                console.error('Delete failed:', errorText);
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
                    showToast(`Task "${task.title}" ${action}`, 'success');
                } else {
                    showToast('Failed to update task status', 'error');
                    setTaskStatus(!newStatus); // Revert visual state
                }
            } else {
                showToast('Failed to update task status', 'error');
                setTaskStatus(!newStatus); // Revert visual state
            }
        } catch (error) {
            console.error('Toggle error:', error);
            showToast('Network error. Please try again.', 'error');
            setTaskStatus(!newStatus); // Revert visual state
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
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Classes conditionnelles basées sur le statut
    const cardClasses = `
        card 
        h-100 
        shadow 
        border-0 
        ${isHovered ? 'shadow-lg' : ''}
        ${isDeleting ? 'opacity-50' : ''}
        ${taskStatus ? 'border-success border-3 bg-success bg-opacity-5' : 'border-1'}
        ${showCompletionEffect ? 'completion-effect' : ''}
        transition-all
        position-relative
        overflow-hidden
        task-card-item
        ${taskStatus ? 'completed-task' : 'active-task'}
    `.trim();

    const cardStyle = {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? 'none' : 'auto',
        borderRadius: '15px',
        borderWidth: taskStatus ? '3px' : '1px',
        position: 'relative'
    };

    const overlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: taskStatus ? 
            'linear-gradient(90deg, #198754, #20c997)' : 
            'linear-gradient(90deg, #0d6efd, #0dcaf0)',
        opacity: isHovered ? 1 : 0.9,
        transition: 'all 0.3s ease',
        zIndex: 1
    };

    return (
        <div className="col-12 col-md-6 col-xl-4 mb-4">
            <div 
                className={cardClasses}
                style={cardStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Barre supérieure colorée */}
                <div style={overlayStyle}></div>
                
                {/* Effet de complétion visuel */}
                {showCompletionEffect && (
                    <div className="completion-overlay"></div>
                )}
                
                {/* Badge de statut - seulement visible quand complété */}
                {taskStatus && (
                    <div className="position-absolute top-0 end-0 m-3 z-2 completion-badge">
                        <span className="badge bg-success rounded-pill shadow px-3 py-2 d-flex align-items-center">
                            <i className="bi bi-check2-circle me-2"></i>
                            Completed
                        </span>
                    </div>
                )}
                
                <div className="card-body p-4 d-flex flex-column h-100 position-relative z-2">
                    {/* En-tête avec toggle centré */}
                    <div className="mb-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="flex-grow-1 me-4">
                                <h5 
                                    className="card-title mb-2 fw-bold"
                                    style={{
                                        fontSize: '1.35rem',
                                        lineHeight: '1.3',
                                        textDecoration: taskStatus ? 'line-through' : 'none',
                                        color: taskStatus ? '#6c757d' : 'var(--bs-dark)',
                                        opacity: taskStatus ? 0.8 : 1
                                    }}
                                >
                                    {task.title}
                                </h5>
                                
                                <div className="d-flex align-items-center text-muted">
                                    <i className="bi bi-clock me-2"></i>
                                    <small>{formatDate(task.created_at)}</small>
                                    <span className="mx-2">•</span>
                                    <small className="text-muted">ID: #{task.id}</small>
                                </div>
                            </div>
                            
                            {/* Toggle Switch - Design amélioré */}
                            <div className="flex-shrink-0 toggle-container">
                                <div className="d-flex flex-column align-items-center">
                                    <div className="toggle-wrapper position-relative">
                                        <div 
                                            className="form-check form-switch"
                                            style={{
                                                transform: 'scale(1.4)',
                                                transformOrigin: 'center'
                                            }}
                                        >
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id={`toggle-${task.id}`}
                                                checked={taskStatus}
                                                onChange={handleToggle}
                                                disabled={isToggling}
                                                style={{
                                                    cursor: isToggling ? 'not-allowed' : 'pointer',
                                                    width: '3.2em',
                                                    height: '1.7em',
                                                    marginTop: '0.1em'
                                                }}
                                            />
                                        </div>
                                        {isToggling && (
                                            <div className="toggle-spinner">
                                                <span className="spinner-border spinner-border-sm"></span>
                                            </div>
                                        )}
                                    </div>
                                    <small className="text-muted mt-2 fw-medium toggle-label">
                                        {taskStatus ? 'COMPLETED' : 'PENDING'}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex-grow-1 mb-4">
                        {task.description ? (
                            <div 
                                className={`rounded-3 p-3 description-scroll ${taskStatus ? 'bg-success bg-opacity-10' : 'bg-light bg-opacity-50'}`}
                                style={{
                                    height: '100%',
                                    minHeight: '120px',
                                    maxHeight: '220px',
                                    overflowY: 'auto'
                                }}
                            >
                                <div className="d-flex">
                                    <i className={`bi ${taskStatus ? 'bi-check-circle text-success' : 'bi-text-paragraph text-primary'} me-3 mt-1`}></i>
                                    <p 
                                        className="card-text mb-0 flex-grow-1"
                                        style={{
                                            lineHeight: '1.7',
                                            fontSize: '1rem',
                                            color: taskStatus ? '#6c757d' : '#495057',
                                            textDecoration: taskStatus ? 'line-through' : 'none',
                                            opacity: taskStatus ? 0.8 : 1
                                        }}
                                    >
                                        {task.description}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className={`rounded-3 p-4 d-flex align-items-center justify-content-center h-100 ${taskStatus ? 'bg-success bg-opacity-10' : 'bg-light bg-opacity-50'}`}
                                style={{ minHeight: '120px' }}
                            >
                                <div className="text-center">
                                    <i className="bi bi-dash-circle display-6 mb-3" style={{
                                        color: taskStatus ? '#198754' : '#6c757d',
                                        opacity: 0.5
                                    }}></i>
                                    <p 
                                        className="card-text fst-italic mb-0"
                                        style={{
                                            color: taskStatus ? '#6c757d' : '#6c757d',
                                            opacity: taskStatus ? 0.8 : 1,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        No description provided
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Boutons */}
                    <div className="mt-auto pt-4 border-top">
                        <div className="row g-3">
                            <div className="col-6">
                                <button 
                                    className={`
                                        btn 
                                        w-100 
                                        d-flex 
                                        align-items-center 
                                        justify-content-center 
                                        ${isHovered ? (taskStatus ? 'btn-success' : 'btn-primary') : (taskStatus ? 'btn-outline-success' : 'btn-outline-primary')}
                                        transition-all
                                        py-3
                                        rounded-3
                                        fw-medium
                                        position-relative
                                        overflow-hidden
                                    `}
                                    onClick={handleEdit}
                                    disabled={isDeleting || isToggling}
                                    style={{
                                        fontSize: '1rem'
                                    }}
                                >
                                    <span className="position-relative z-1 d-flex align-items-center">
                                        <i className="bi bi-pencil-square me-3"></i>
                                        <span>Edit Task</span>
                                    </span>
                                </button>
                            </div>
                            <div className="col-6">
                                <button 
                                    className={`
                                        btn 
                                        w-100 
                                        d-flex 
                                        align-items-center 
                                        justify-content-center 
                                        ${isHovered ? (taskStatus ? 'btn-outline-success' : 'btn-danger') : (taskStatus ? 'btn-outline-success' : 'btn-outline-danger')}
                                        transition-all
                                        py-3
                                        rounded-3
                                        fw-medium
                                        position-relative
                                        overflow-hidden
                                    `}
                                    onClick={handleDelete}
                                    disabled={isDeleting || isToggling}
                                    style={{
                                        fontSize: '1rem'
                                    }}
                                >
                                    <span className="position-relative z-1 d-flex align-items-center">
                                        {isDeleting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-3"></span>
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-3"></i>
                                                <span>Remove</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
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

// Styles CSS pour le toggle parfait
const cardStyles = `
/* Cartes larges et bien espacées */
.task-card-item {
    border-radius: 15px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Grille élargie */
.row.g-4 > [class*="col-"] {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    margin-bottom: 2.5rem !important;
}

.row.g-4 {
    margin-left: -1.5rem;
    margin-right: -1.5rem;
}

/* TOGGLE SWITCH - DESIGN PARFAIT */
.toggle-wrapper {
    position: relative;
    display: inline-block;
}

.toggle-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
}

.toggle-spinner .spinner-border {
    width: 1rem;
    height: 1rem;
    border-width: 0.15em;
}

/* Toggle switch personnalisé */
.form-check-input {
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    position: relative;
    z-index: 2;
}

/* Toggle OFF state */
.form-check-input:not(:checked) {
    background-color: #e9ecef !important;
    border-color: #adb5bd !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e") !important;
}

/* Toggle ON state */
.form-check-input:checked {
    background-color: #198754 !important;
    border-color: #198754 !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e") !important;
}

/* Focus state amélioré */
.form-check-input:focus {
    border-color: #198754 !important;
    outline: none;
    box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25) !important;
}

.form-check-input:not(:checked):focus {
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
    border-color: #0d6efd !important;
}

/* Animation du toggle */
@keyframes toggleSlide {
    0% { transform: translateX(0); }
    100% { transform: translateX(100%); }
}

@keyframes toggleOn {
    0% { 
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4);
    }
    50% { 
        transform: scale(1.1);
        box-shadow: 0 0 0 8px rgba(25, 135, 84, 0.2);
    }
    100% { 
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(25, 135, 84, 0);
    }
}

@keyframes toggleOff {
    0% { 
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4);
    }
    50% { 
        transform: scale(1.1);
        box-shadow: 0 0 0 8px rgba(13, 110, 253, 0.2);
    }
    100% { 
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(13, 110, 253, 0);
    }
}

.form-check-input:checked {
    animation: toggleOn 0.5s ease;
}

.form-check-input:not(:checked):active {
    animation: toggleOff 0.3s ease;
}

/* Label du toggle */
.toggle-label {
    font-size: 0.75rem;
    font-weight: 600 !important;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #6c757d !important;
    transition: color 0.3s ease;
}

.toggle-container:hover .toggle-label {
    color: #495057 !important;
}

/* Effet de complétion visuel */
.completion-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(25, 135, 84, 0.1), rgba(32, 201, 151, 0.1));
    z-index: 1;
    animation: completionFlash 1s ease-out;
    pointer-events: none;
}

@keyframes completionFlash {
    0% {
        opacity: 0;
        transform: scale(0.95);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
        transform: scale(1);
    }
}

/* Badge de complétion */
.completion-badge {
    animation: badgeAppear 0.5s ease-out;
}

@keyframes badgeAppear {
    0% {
        opacity: 0;
        transform: translateY(-10px) scale(0.8);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Effet hover amélioré */
.task-card-item:hover {
    transform: translateY(-6px) scale(1.02) !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15) !important;
}

.task-card-item.completed-task:hover {
    box-shadow: 0 15px 35px rgba(25, 135, 84, 0.15) !important;
}

/* Cartes complétées */
.task-card-item.completed-task {
    border: 3px solid rgba(25, 135, 84, 0.4) !important;
    background-color: rgba(25, 135, 84, 0.03) !important;
}

/* Barre supérieure */
.task-card-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    border-radius: 15px 15px 0 0;
    background: linear-gradient(90deg, #0d6efd, #0dcaf0);
    opacity: 0.9;
    transition: opacity 0.3s ease;
    z-index: 1;
}

.task-card-item.completed-task::before {
    background: linear-gradient(90deg, #198754, #20c997);
}

.task-card-item:hover::before {
    opacity: 1;
}

/* Scrollbar */
.description-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.description-scroll::-webkit-scrollbar {
    width: 6px;
}

.description-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
}

.description-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
}

/* Boutons */
.btn.rounded-3 {
    border-radius: 12px !important;
    transition: all 0.2s ease-in-out !important;
}

.btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
}

/* Badge */
.badge.rounded-pill {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Animation d'entrée */
@keyframes cardSlideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.task-card-item {
    animation: cardSlideIn 0.5s ease-out;
}

/* Toast */
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.toast {
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    border-radius: 12px;
    border: none;
}

.toast.show {
    animation: slideInRight 0.4s ease-out;
}

/* Responsive */
@media (max-width: 768px) {
    .row.g-4 > [class*="col-"] {
        padding-left: 1rem;
        padding-right: 1rem;
        margin-bottom: 2rem !important;
    }
    
    .row.g-4 {
        margin-left: -1rem;
        margin-right: -1rem;
    }
    
    .form-check-input {
        width: 2.8em !important;
        height: 1.5em !important;
    }
    
    .toggle-label {
        font-size: 0.7rem;
    }
}

@media (min-width: 1200px) {
    .col-xl-4 {
        flex: 0 0 auto;
        width: 33.33333333%;
    }
}

/* Indicateur de chargement du toggle */
.toggle-wrapper.loading .form-check-input {
    opacity: 0.5;
}

/* Z-index pour empilement correct */
.position-relative.z-2 {
    z-index: 2;
}

/* Texte barré pour les tâches complétées */
.completed-task .card-title,
.completed-task .card-text {
    position: relative;
}

.completed-task .card-title::after,
.completed-task .card-text::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(25, 135, 84, 0.3);
    transform: translateY(-50%);
    animation: lineThrough 0.5s ease-out;
}

@keyframes lineThrough {
    from {
        transform: translateY(-50%) scaleX(0);
    }
    to {
        transform: translateY(-50%) scaleX(1);
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