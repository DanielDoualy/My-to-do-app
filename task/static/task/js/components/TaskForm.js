function TaskForm({ onTaskCreated }) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/tasks/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),  // fonction dans csrf.js
                },
                body: JSON.stringify({ title, description }),
            });

            if (response.ok) {
                const data = await response.json();
                onTaskCreated(data.task);  // ajoute la nouvelle tâche au state
                setTitle('');
                setDescription('');
            } else {
                console.error('Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <div className="form-group mb-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Task title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                />
            </div>
            <div className="form-group mb-2">
                <textarea
                    className="form-control"
                    placeholder="Task description (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                ></textarea>
            </div>
            <button type="submit" className="btn btn-success">
                <i className="bi bi-plus-circle"></i> Add Task
            </button>
        </form>
    );
}
