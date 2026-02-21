function formatTime(date) {
    if (!date) return '';
    if (date instanceof Date === false) date = new Date(date);

    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분`;
    if (hours < 24) return `${hours}시간`;
    if (days < 7) return `${days}일`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}