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
                minWidth: '250px'
            }
        },
            React.createElement('div', { className: 'toast-body d-flex align-items-center' },
                React.createElement('i', { className: `bi ${icon} me-2` }),
                message
            )
        ),
        document.body
    );
}

// Fonction utilitaire pour afficher un toast
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    ReactDOM.render(
        React.createElement(ToastNotification, { message, type }),
        document.getElementById('toast-container')
    );
}

// Exposez globalement
if (typeof window !== 'undefined') {
    window.showToast = showToast;
}