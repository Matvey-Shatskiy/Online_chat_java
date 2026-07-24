// utils.js

export function formatTime(dateString) {
    if (!dateString) return 'недавно';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'недавно';
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'недавно';
    }
}

export function getImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Если путь начинается с '/', оставляем, иначе добавляем
    return path.startsWith('/') ? path : '/' + path;
}

export function getInitials(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
}