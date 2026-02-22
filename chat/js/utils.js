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

const SALT = 'nemuwiki-chat-salt';
async function generatePeerId(roomId, email) {
  const input = `${roomId || SALT}:${email}`; // 고유 조합 생성
  const msgBuffer = new TextEncoder().encode(input);
  
  // SHA-256 해시 생성
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  
  // 바이너리 데이터를 16진수 문자열로 변환
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // (선택 사항) UUID 형식(8-4-4-4-12)으로 자르기
  return `${hashHex.substring(0, 8)}-${hashHex.substring(8, 12)}-${hashHex.substring(12, 16)}-${hashHex.substring(16, 20)}-${hashHex.substring(20, 32)}`;
}