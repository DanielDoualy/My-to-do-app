function TaskList() {
    const [tasks, setTasks] = React.useState([]);
    const [filteredTasks, setFilteredTasks] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [hideCompleted, setHideCompleted] = React.useState(false);
    const [stats, setStats] = React.useState({
        total: 0,
        completed: 0,
        active: 0
    });

    React.useEffect(() => {
        fetchTasks();
    }, []);

    // Filtrer les tâches quand hideCompleted change
    React.useEffect(() => {
        if (hideCompleted) {
            setFilteredTasks(tasks.filter(task => !task.status));
        } else {
            setFilteredTasks(tasks);
        }
        
        // Mettre à jour les statistiques
        updateStats(tasks);
    }, [tasks, hideCompleted]);

    const fetchTasks = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/tasks/', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
                setFilteredTasks(data.tasks || []);
                updateStats(data.tasks || []);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Fetch tasks error:', error);
            setError('Failed to load tasks. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateStats = (taskList) => {
        const total = taskList.length;
        const completed = taskList.filter(task => task.status).length;
        const active = total - completed;
        
        setStats({ total, completed, active });
    };

    const handleDelete = (taskId) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    };

    const handleToggle = (taskId, newStatus) => {
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
    };

    const toggleHideCompleted = () => {
        setHideCompleted(!hideCompleted);
    };

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading your tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger text-center">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchTasks}>
                    <i className="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        );
    }

    // Afficher même s'il n'y a que des tâches complétées masquées
    const displayTasks = hideCompleted ? tasks.filter(task => !task.status) : tasks;

    if (displayTasks.length === 0) {
        return (
            <div>
                {/* Header avec statistiques et filtres */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="mb-0">My Tasks</h5>
                        <small className="text-muted">
                            {stats.active} active • {stats.completed} completed
                        </small>
                    </div>
                    {stats.completed > 0 && (
                        <button 
                            className={`btn btn-sm ${hideCompleted ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={toggleHideCompleted}
                        >
                            <i className={`bi ${hideCompleted ? 'bi-eye-fill' : 'bi-eye-slash'} me-1`}></i>
                            {hideCompleted ? 'Show Completed' : 'Hide Completed'}
                        </button>
                    )}
                </div>
                
                <div className="text-center py-5 mt-4">
                    <div className="mb-4">
                        {hideCompleted && stats.completed > 0 ? (
                            <i className="bi bi-check2-all" style={{ fontSize: '4rem', color: '#198754' }}></i>
                        ) : (
                            <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                        )}
                    </div>
                    <h4 className="text-muted mb-3">
                        {hideCompleted && stats.completed > 0 
                            ? 'All tasks are completed!' 
                            : 'No tasks yet'}
                    </h4>
                    <p className="text-muted mb-4">
                        {hideCompleted && stats.completed > 0
                            ? 'Great job! All your tasks are done.'
                            : 'Create your first task!'}
                    </p>
                    <a href="/" className="btn btn-primary">
                        <i className="bi bi-plus-circle me-2"></i> New Task
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header avec statistiques et filtres */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="mb-0">My Tasks</h5>
                    <small className="text-muted">
                        {stats.active} active • {stats.completed} completed
                    </small>
                </div>
                {stats.completed > 0 && (
                    <button 
                        className={`btn btn-sm ${hideCompleted ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={toggleHideCompleted}
                    >
                        <i className={`bi ${hideCompleted ? 'bi-eye-fill' : 'bi-eye-slash'} me-1`}></i>
                        {hideCompleted ? 'Show Completed' : 'Hide Completed'}
                    </button>
                )}
            </div>

            {/* Liste des tâches */}
            <div className="row g-4">
                {displayTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                    />
                ))}
            </div>

            {/* Message si des tâches sont masquées */}
            {hideCompleted && stats.completed > 0 && (
                <div className="alert alert-success alert-dismissible fade show mt-4" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>{stats.completed} completed task{stats.completed > 1 ? 's' : ''}</strong> {stats.completed > 1 ? 'are' : 'is'} hidden. 
                    <button 
                        type="button" 
                        className="btn btn-sm btn-outline-success ms-2"
                        onClick={toggleHideCompleted}
                    >
                        Show them
                    </button>
                    <button type="button" className="btn-close" onClick={toggleHideCompleted}></button>
                </div>
            )}
        </div>
    );
}

// Exposez TaskList globalement
if (typeof window !== 'undefined') {
    window.TaskList = TaskList;
}