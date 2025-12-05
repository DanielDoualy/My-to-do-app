// Fonction pour récupérer n'importe quel cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Est-ce que ce cookie string commence par le nom que nous voulons ?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Fonction spécifique pour CSRF
function getCSRFToken() {
    return getCookie('csrftoken');
}

// Exposez les fonctions globalement IMMÉDIATEMENT
window.getCookie = getCookie;
window.getCSRFToken = getCSRFToken;

console.log('✅ CSRF.js loaded - getCSRFToken is now available globally');