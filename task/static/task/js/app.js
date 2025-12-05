console.log('🚀 React app starting...');

function initReactApp() {
    const rootElement = document.getElementById('react-task-root');
    
    if (!rootElement) {
        console.log('ℹ️ No React root found on this page');
        return;
    }

    console.log('✅ Found React root');
    
    // Vérifications simples
    if (typeof React === 'undefined') {
        rootElement.innerHTML = '<div class="alert alert-danger">React not loaded</div>';
        return;
    }
    
    if (typeof ReactDOM === 'undefined') {
        rootElement.innerHTML = '<div class="alert alert-danger">ReactDOM not loaded</div>';
        return;
    }
    
    if (typeof TaskList === 'undefined') {
        rootElement.innerHTML = '<div class="alert alert-danger">TaskList component not loaded</div>';
        return;
    }

    try {
        ReactDOM.render(
            React.createElement(TaskList, null),
            rootElement
        );
        console.log('✅ TaskList mounted successfully!');
    } catch (error) {
        console.error('❌ Mount error:', error);
        rootElement.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error loading tasks</h5>
                <p>Please refresh the page</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Démarrer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactApp);
} else {
    initReactApp();
}