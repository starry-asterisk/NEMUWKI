// 데이터 저장소
let chatRooms = [];
let currentRoom = null;
let messagesUnsubscribe = null;
let roomsUnsubscribe = null;
let selectedParticipant = 'me'; // 메시지 발신자 선택 (me 또는 참여자 이메일)
let commandHistory = []; // 명령어 기록 (localStorage에 저장)

// DOM 요소 선택
const chatList = document.getElementById('chatList');
const chatRoom = document.getElementById('chatRoom');
const emptyState = document.getElementById('emptyState');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const roomTitle = document.getElementById('roomTitle');
const roomStatus = document.getElementById('roomStatus');
const backBtn = document.getElementById('backBtn');
const searchInput = document.getElementById('searchInput');
const chatSidebar = document.querySelector('.chat-sidebar');

// 모달 요소
const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomModal = document.getElementById('createRoomModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const roomTitleInput = document.getElementById('roomTitleInput');
const roomDescriptionInput = document.getElementById('roomDescription');
const participantEmailsInput = document.getElementById('participantEmails');

// 채팅방 관리 모달
const manageRoomModal = document.getElementById('manageRoomModal');
const closeManageModalBtn = document.getElementById('closeManageModalBtn');
const editRoomTitle = document.getElementById('editRoomTitle');
const editRoomDescription = document.getElementById('editRoomDescription');
const participantsList = document.getElementById('participantsList');
const deleteRoomBtn = document.getElementById('deleteRoomBtn');
const cancelManageBtn = document.getElementById('cancelManageBtn');
const saveRoomBtn = document.getElementById('saveRoomBtn');

// 채팅방 정보 모달
const roomInfoModal = document.getElementById('roomInfoModal');
const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');
const infoRoomTitle = document.getElementById('infoRoomTitle');
const infoRoomDescription = document.getElementById('infoRoomDescription');
const infoCreatedDate = document.getElementById('infoCreatedDate');
const infoParticipants = document.getElementById('infoParticipants');
const infoMessageCount = document.getElementById('infoMessageCount');
const closeInfoBtn = document.getElementById('closeInfoBtn');

// 공유 모달 요소
const shareRoomModal = document.getElementById('shareRoomModal');
const closeShareModalBtn = document.getElementById('closeShareModalBtn');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const shareEmail = document.getElementById('shareEmail');
const addParticipantBtn = document.getElementById('addParticipantBtn');
const shareParticipantsList = document.getElementById('shareParticipantsList');
const closeShareBtn = document.getElementById('closeShareBtn');

// 채팅방 헤더 버튼
const settingsBtn = document.getElementById('settingsBtn');
const shareBtn = document.getElementById('shareBtn');
const infoBtn = document.getElementById('infoBtn');

// 컨텍스트 메뉴
const roomContextMenu = document.getElementById('roomContextMenu');
const editRoomMenuItem = document.getElementById('editRoomMenuItem');
const leaveRoomMenuItem = document.getElementById('leaveRoomMenuItem');

// 참여자 선택 모달
const selectParticipantBtn = document.getElementById('selectParticipantBtn');
const participantSelector = document.getElementById('participantSelector');
const participantDropdown = document.getElementById('participantDropdown');

// 초기화: 비로그인 상태에서도 채팅방 열람 가능
window.addEventListener('DOMContentLoaded', () => {
    // 공개 채팅방 로드 (비로그인 상태)
    initializePublicChats();
});

// 초기화: 사용자 로그인 확인
window.addEventListener('userLoggedIn', () => {
    if (window.currentUser) {
        console.log("채팅 모듈 초기화:", window.currentUser.email);
        initializeChatApp();
    }
});

window.addEventListener('userLoggedOut', () => {
    console.log("사용자 로그아웃, 채팅 종료");
    cleanupSubscriptions();
    chatRooms = [];
    currentRoom = null;
    renderChatList([]);

    // 비로그인 상태에서도 채팅방 열람 가능
    initializePublicChats();
});

// 공개 채팅방 로드 (비로그인 상태)
async function initializePublicChats() {
    if (!window.chatFb || !window.firebase) return;

    try {
        // URL 파라미터로 채팅방 ID 확인
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('room');

        if (roomId) {
            const room = await window.chatFb.getRoom(roomId);
            if (room) {
                // 비로그인 사용자도 메시지는 볼 수 있음
                if (!currentRoom) {
                    selectRoom(room);
                }
                return;
            }
        }
    } catch (error) {
        console.log("공개 채팅방 로드 실패:", error);
    }
}

// 채팅 앱 초기화
async function initializeChatApp() {
    if (!window.chatFb) {
        console.error("chatFb 모듈이 로드되지 않았습니다");
        return;
    }

    try {
        // 채팅방 목록 실시간 구독
        roomsUnsubscribe = window.chatFb.subscribeToRooms(
            window.currentUser.email,
            (rooms) => {
                chatRooms = rooms;
                renderChatList(rooms);

                // URL 파라미터로 자동 열기
                const params = new URLSearchParams(window.location.search);
                const roomId = params.get('room');
                if (roomId && !currentRoom) {
                    const room = rooms.find(r => r.id === roomId);
                    if (room) {
                        selectRoom(room);
                        // URL에서 파라미터 제거 (깔끔함)
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
            }
        );
    } catch (error) {
        console.error("채팅 초기화 실패:", error);
    }
}

// 구독 정리
function cleanupSubscriptions() {
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
        messagesUnsubscribe = null;
    }
    if (roomsUnsubscribe) {
        roomsUnsubscribe();
        roomsUnsubscribe = null;
    }
}

// 채팅방 목록 렌더링
function renderChatList(rooms = chatRooms) {
    chatList.innerHTML = '';

    if (rooms.length === 0) {
        chatList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">채팅방이 없습니다</div>';
        return;
    }

    rooms.forEach(room => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${currentRoom?.id === room.id ? 'active' : ''}`;

        const lastMessageTime = room.lastMessageTime ? formatTime(room.lastMessageTime.toDate?.() || room.lastMessageTime) : '';
        const lastMessage = room.lastMessage || '새로운 채팅';

        chatItem.innerHTML = `
            <div class="chat-avatar">${room.title ? room.title[0].toUpperCase() : 'C'}</div>
            <div class="chat-info">
                <div class="chat-header-info">
                    <span class="chat-name">${room.title || '채팅방'}</span>
                    <span class="chat-time">${lastMessageTime}</span>
                </div>
                <div class="chat-preview">
                    ${lastMessage}
                </div>
            </div>
        `;

        chatItem.style.position = 'relative';
        // 채팅방 선택
        chatItem.addEventListener('click', () => selectRoom(room));

        chatList.appendChild(chatItem);
    });
}

// 시간 포맷팅
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

// 채팅방 선택
async function selectRoom(room) {
    currentRoom = room;
    selectedParticipant = 'me'; // 초기값으로 설정

    // 이전 구독 정리
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }

    // UI 업데이트
    emptyState.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    roomTitle.textContent = room.title || '채팅방';
    roomStatus.textContent = room.lastMessageBy ? `마지막 메시지: ${room.lastMessageBy}` : '채팅방';

    // 참여자 선택 드롭다운 렌더링
    renderParticipantSelector();

    // 메시지 입력 영역 활성화/비활성화
    updateMessageInputState();

    // 채팅방 목록 업데이트
    renderChatList();

    // 메시지 렌더링 및 실시간 구독
    try {
        messagesUnsubscribe = window.chatFb.subscribeToMessages(room.id, (msgs) => {
            renderMessages(msgs);
        });
    } catch (error) {
        console.error("메시지 로드 실패:", error);
    }

    // 메시지 입력창에 포커스
    messageInput.focus();

    // 모바일: 사이드바 완전히 숨기기
    if (window.innerWidth <= 480) {
        chatSidebar.classList.add('hidden');
    }
}

// 참여자 선택 드롭다운 렌더링
function renderParticipantSelector() {
    if (!currentRoom) {
        selectParticipantBtn.style.display = 'none';
        return;
    }

    // 생성자만 참여자 선택 가능
    if (window.currentUser?.uid !== currentRoom.createdBy) {
        selectParticipantBtn.style.display = 'none';
        return;
    }

    selectParticipantBtn.style.display = 'flex';
    participantDropdown.innerHTML = '';

    // '나' 옵션
    const meOption = document.createElement('button');
    meOption.textContent = '나';
    meOption.style.cssText = 'width: 100%; padding: 10px 12px; border: none; background: transparent; cursor: pointer; text-align: left; transition: background 0.2s;';
    meOption.addEventListener('mouseenter', () => meOption.style.background = '#f0f0f0');
    meOption.addEventListener('mouseleave', () => meOption.style.background = 'transparent');
    meOption.addEventListener('click', () => {
        selectedParticipant = 'me';
        selectParticipantBtn.title = '발신자: 나';
        participantSelector.style.display = 'none';
        updateMessageInputState();
    });
    participantDropdown.appendChild(meOption);

    // 참여자 옵션들
    (currentRoom.participants || []).forEach(participant => {
        if (participant === window.currentUser.email) return; // 자신은 제외

        const option = document.createElement('button');
        option.textContent = participant;
        option.style.cssText = 'width: 100%; padding: 10px 12px; border: none; background: transparent; cursor: pointer; text-align: left; transition: background 0.2s; border-top: 1px solid #f0f0f0;';
        option.addEventListener('mouseenter', () => option.style.background = '#f0f0f0');
        option.addEventListener('mouseleave', () => option.style.background = 'transparent');
        option.addEventListener('click', () => {
            selectedParticipant = participant;
            selectParticipantBtn.title = `발신자: ${participant} (명령어)`;
            participantSelector.style.display = 'none';
            updateMessageInputState();
        });
        participantDropdown.appendChild(option);
    });
}

// 메시지 입력 상태 업데이트
function updateMessageInputState() {
    if (!currentRoom || !window.currentUser) {
        messageInput.disabled = true;
        sendBtn.disabled = true;
        settingsBtn.disabled = true;
        addParticipantBtn.disabled = true;
        shareEmail.disabled = true;
        messageInput.placeholder = '로그인이 필요합니다';
        return;
    }

    if (currentRoom.createdBy !== window.currentUser.uid) {
        messageInput.disabled = true;
        sendBtn.disabled = true;
        settingsBtn.disabled = true;
        addParticipantBtn.disabled = true;
        shareEmail.disabled = true;
        messageInput.placeholder = '채팅방 생성자만 메시지 작성 가능';
        return;
    }

    messageInput.disabled = false;
    sendBtn.disabled = false;
    settingsBtn.disabled = false;
    addParticipantBtn.disabled = false;
    shareEmail.disabled = false;
    messageInput.placeholder = selectedParticipant === 'me'
        ? `명령어를 입력하세요...`
        : `${selectedParticipant}의 메시지를 입력하세요...`;
}

// 메시지 렌더링
function renderMessages(msgs = []) {
    messages.innerHTML = '';

    if (!currentRoom) {
        messages.innerHTML = '<div style="text-align: center; color: #999; margin: auto;">채팅방을 선택해주세요</div>';
        return;
    }

    // Firebase 메시지와 명령어 메시지 병합
    let allMessages = msgs || [];

    // localStorage에서 명령어 기록 로드
    try {
        const stored = localStorage.getItem(`commands_${currentRoom.id}`);
        if (stored) {
            const commands = JSON.parse(stored);
            commandHistory = commands;
            // 타임스탬프 기준으로 병합
            allMessages = [...allMessages, ...commands].sort((a, b) => {
                const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
                const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
                return new Date(timeA) - new Date(timeB);
            });
        }
    } catch (e) {
        console.warn('localStorage 로드 실패:', e);
    }

    if (allMessages.length === 0) {
        messages.innerHTML = '<div style="text-align: center; color: #999; margin: auto;">채팅을 시작해보세요</div>';
        return;
    }

    allMessages.forEach(renderSingleMessage);

    // 스크롤을 맨 아래로
    messages.scrollTop = messages.scrollHeight;
}

function renderSingleMessage(msg) {
    const messageDiv = document.createElement('div');
    const isCommand = msg.type === 'command';
    // '나'의 명령어 또는 사용자가 선택한 참여자로서의 메시지는 우측 정렬
    const isOwn = msg.participant === 'me';
    const isCreater = currentRoom.createdBy === window.currentUser?.uid;
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;


    const time = formatTime(msg.timestamp?.toDate?.() || msg.timestamp);

    messageDiv.innerHTML = `
            ${isOwn ? '' : `<div class="message-avatar">${msg.participant || msg.senderName ? (msg.participant || msg.senderName)[0].toUpperCase() : 'U'}</div>`}
            <div class="message-bubble" style="${isCommand ? 'opacity: 0.7; font-style: italic;' : ''}">${escapeHtml(msg.text)}</div>
            <span class="message-time">${time}</span>
        `;

    messageDiv.style.position = 'relative';
    messageDiv.style.cursor = 'context-menu';

    // 우클릭 메뉴 (자신이 작성한 메시지만: '나'의 명령어 또는 현재 선택된 참여자의 메시지)
    if (isOwn || isCreater) {
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMessageContextMenu(msg, e, isOwn, messageDiv);
        });

        // 롱터치 메뉴 (모바일)
        let touchStartTime = 0;
        messageDiv.addEventListener('touchstart', () => {
            touchStartTime = Date.now();
        });
        messageDiv.addEventListener('touchend', (e) => {
            if (Date.now() - touchStartTime > 500) { // 500ms 이상 누르면
                const touch = e.changedTouches[0];
                const mouseEvent = new MouseEvent('contextmenu', {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    bubbles: true
                });
                messageDiv.dispatchEvent(mouseEvent);
            }
        });
    }

    messages.appendChild(messageDiv);
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 메시지 전송
async function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || !currentRoom) return;

    // 채팅방 생성자만 메시지 작성 가능 (window.currentUser가 null이면 비로그인 상태)
    if (!window.currentUser) {
        alert('로그인이 필요합니다');
        return;
    }

    // 생성자가 아니면 메시지 작성 불가
    if (currentRoom.createdBy !== window.currentUser.uid) {
        alert('채팅방 생성자만 메시지를 작성할 수 있습니다');
        return;
    }

    try {
        // '나'로 선택: 명령어로 처리 (localStorage 저장)
        if (selectedParticipant === 'me') {
            handleCommand(text, 'me');
        } else {
            // 참여자로 선택: Firebase에 메시지 저장 (그 참여자로서 발신)
            await window.chatFb.sendMessage(currentRoom.id, {
                text: text,
                senderId: selectedParticipant,
                senderName: selectedParticipant.split('@')[0]
            });
        }

        // UI 업데이트
        messageInput.value = '';
        messageInput.style.opacity = '0.5';
    } catch (error) {
        console.error("메시지 전송 실패:", error);
        alert('메시지 전송에 실패했습니다');
    }
}

// 명령어 처리 (참여자로서의 메시지)
function handleCommand(text, participant) {
    const command = {
        text: text,
        participant: participant,
        timestamp: new Date(),
        type: 'command'
    };

    // localStorage에 명령어 기록 저장
    if (!commandHistory) commandHistory = [];
    commandHistory.push(command);

    // localStorage 에 저장 (최대 100개)
    const maxHistory = 100;
    if (commandHistory.length > maxHistory) {
        commandHistory = commandHistory.slice(-maxHistory);
    }

    try {
        localStorage.setItem(`commands_${currentRoom.id}`, JSON.stringify(commandHistory));
    } catch (e) {
        console.warn('localStorage 저장 실패:', e);
    }

    // UI 업데이트 (다음 메시지 렌더링 시 반영됨)
    console.log('명령어 기록됨:', command);

    renderSingleMessage(command);
    messages.scrollTop = messages.scrollHeight;
}

// 뒤로 가기 (모바일)
function goBack() {
    currentRoom = null;
    emptyState.classList.remove('hidden');
    chatRoom.classList.add('hidden');
    renderChatList();
    cleanupSubscriptions();

    if (window.innerWidth <= 480) {
        chatSidebar.classList.remove('hidden');
    }
}

// 검색 기능
function searchRooms(query) {
    const filtered = chatRooms.filter(room =>
        room.title.toLowerCase().includes(query.toLowerCase())
    );
    renderChatList(filtered);
}

// 모달 열기
function openCreateRoomModal() {
    createRoomModal.classList.remove('hidden');
    roomTitleInput.focus();
}

// 모달 닫기
function closeCreateRoomModal() {
    createRoomModal.classList.add('hidden');
    // 입력값 초기화
    roomTitleInput.value = '';
    roomDescriptionInput.value = '';
    participantEmailsInput.value = '';
}

// 채팅방 생성
async function createChatRoom() {
    const title = roomTitleInput.value.trim();
    const description = roomDescriptionInput.value.trim();
    const emailsInput = participantEmailsInput.value.trim();

    // 유효성 검사
    if (!title) {
        alert('채팅방 이름을 입력해주세요');
        roomTitleInput.focus();
        return;
    }

    if (!emailsInput) {
        alert('참여자 이메일을 입력해주세요');
        participantEmailsInput.focus();
        return;
    }

    try {
        // 이메일 파싱
        const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
        const currentUserEmail = window.currentUser.email;
        const participants = [currentUserEmail, ...emails];

        // 중복 제거
        const uniqueParticipants = [...new Set(participants)];

        // 채팅방 생성
        confirmCreateBtn.disabled = true;
        confirmCreateBtn.textContent = '생성 중...';

        const roomId = await window.chatFb.createRoom({
            title: title,
            description: description,
            participants: uniqueParticipants,
            createdBy: window.currentUser.uid
        });

        console.log('채팅방 생성됨:', roomId);

        // 모달 닫기
        closeCreateRoomModal();

        // 버튼 상태 복구
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = '생성';

        alert('채팅방이 생성되었습니다');
    } catch (error) {
        console.error('채팅방 생성 실패:', error);
        alert('채팅방 생성에 실패했습니다: ' + error.message);
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = '생성';
    }
}

// 채팅방 설정 열기
function openManageRoomModal() {
    if (!currentRoom) return;

    editRoomTitle.value = currentRoom.title || '';
    editRoomDescription.value = currentRoom.description || '';
    renderParticipantsList();
    manageRoomModal.classList.remove('hidden');
}

// 채팅방 설정 모달 닫기
function closeManageRoomModal() {
    manageRoomModal.classList.add('hidden');
}

// 참여자 목록 렌더링
function renderParticipantsList() {
    participantsList.innerHTML = '';
    const participants = currentRoom.participants || [];

    participants.forEach(participant => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 8px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;';

        const span = document.createElement('span');
        span.textContent = participant;
        span.style.fontSize = '14px';

        div.appendChild(span);
        participantsList.appendChild(div);
    });
}

// 채팅방 정보 모달 열기
function openRoomInfoModal() {
    if (!currentRoom) return;

    infoRoomTitle.textContent = currentRoom.title || '-';
    infoRoomDescription.textContent = currentRoom.description || '-';
    infoCreatedDate.textContent = currentRoom.createdAt
        ? new Date(currentRoom.createdAt.toDate?.() || currentRoom.createdAt).toLocaleDateString('ko-KR')
        : '-';
    infoParticipants.textContent = (currentRoom.participants || []).length + '명';
    infoMessageCount.textContent = (currentRoom.messages || []).length + '개';

    roomInfoModal.classList.remove('hidden');
}

// 채팅방 정보 모달 닫기
function closeRoomInfoModal() {
    roomInfoModal.classList.add('hidden');
}

// 공유 모달 열기
function openShareRoomModal() {
    if (!currentRoom) return;

    // 링크 생성
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${currentRoom.id}`;
    shareLink.value = shareUrl;

    shareEmail.value = '';
    renderShareParticipantsList();
    shareRoomModal.classList.remove('hidden');
}

// 공유 모달 닫기
function closeShareRoomModal() {
    shareRoomModal.classList.add('hidden');
}

// 공유 참여자 목록 렌더링
function renderShareParticipantsList() {
    shareParticipantsList.innerHTML = '';
    const participants = currentRoom.participants || [];

    participants.forEach(participant => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;';

        const span = document.createElement('span');
        span.textContent = participant;
        span.style.fontSize = '14px';

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '제거';
        removeBtn.style.cssText = 'padding: 4px 8px; border: 1px solid #e5e5e5; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px;';
        removeBtn.addEventListener('click', () => removeParticipant(participant));

        div.appendChild(span);
        div.appendChild(removeBtn);
        shareParticipantsList.appendChild(div);
    });
}

// 참여자 추가
async function addParticipant() {
    const email = shareEmail.value.trim();
    if (!email) {
        alert('이메일을 입력해주세요');
        return;
    }

    if ((currentRoom.participants || []).includes(email)) {
        alert('이미 참여자입니다');
        shareEmail.value = '';
        return;
    }

    try {
        addParticipantBtn.disabled = true;
        addParticipantBtn.textContent = '추가 중...';

        await window.chatFb.updateRoom(currentRoom.id, {
            participants: firebase.arrayUnion(email)
        });

        // 현재 방 정보 업데이트
        if (!currentRoom.participants) currentRoom.participants = [];
        currentRoom.participants.push(email);

        shareEmail.value = '';
        renderShareParticipantsList();

        addParticipantBtn.disabled = false;
        addParticipantBtn.textContent = '추가';
    } catch (error) {
        console.error('참여자 추가 실패:', error);
        alert('참여자 추가에 실패했습니다');
        addParticipantBtn.disabled = false;
        addParticipantBtn.textContent = '추가';
    }
}

// 참여자 제거
async function removeParticipant(email) {
    if (!confirm(`${email}를 제거하시겠습니까?`)) return;

    try {
        // 자신을 제거하는 경우
        if (email === window.currentUser.email) {
            if (!confirm('채팅방에서 나가시겠습니까?')) return;
            await leaveChatRoom();
            return;
        }

        await window.chatFb.updateRoom(currentRoom.id, {
            participants: firebase.arrayRemove(email)
        });

        currentRoom.participants = (currentRoom.participants || []).filter(p => p !== email);
        renderShareParticipantsList();
    } catch (error) {
        console.error('참여자 제거 실패:', error);
        alert('참여자 제거에 실패했습니다');
    }
}

// 채팅방 저장
async function saveChatRoom() {
    try {
        saveRoomBtn.disabled = true;
        saveRoomBtn.textContent = '저장 중...';

        await window.chatFb.updateRoom(currentRoom.id, {
            title: editRoomTitle.value,
            description: editRoomDescription.value
        });

        currentRoom.title = editRoomTitle.value;
        currentRoom.description = editRoomDescription.value;

        roomTitle.textContent = currentRoom.title;
        closeManageRoomModal();

        saveRoomBtn.disabled = false;
        saveRoomBtn.textContent = '저장';

        alert('채팅방이 수정되었습니다');
    } catch (error) {
        console.error('채팅방 수정 실패:', error);
        alert('채팅방 수정에 실패했습니다');
        saveRoomBtn.disabled = false;
        saveRoomBtn.textContent = '저장';
    }
}

// 채팅방 삭제
async function deleteChatRoom() {
    if (!confirm('정말 채팅방을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;

    try {
        deleteRoomBtn.disabled = true;

        await window.chatFb.deleteRoom(currentRoom.id);

        closeManageRoomModal();
        goBack();

        alert('채팅방이 삭제되었습니다');
    } catch (error) {
        console.error('채팅방 삭제 실패:', error);
        alert('채팅방 삭제에 실패했습니다');
        deleteRoomBtn.disabled = false;
    }
}

// 채팅방 나가기
async function leaveChatRoom() {
    if (!currentRoom) return;

    try {
        await window.chatFb.updateRoom(currentRoom.id, {
            participants: firebase.arrayRemove(window.currentUser.email)
        });

        goBack();
        alert('채팅방에서 나왔습니다');
    } catch (error) {
        console.error('채팅방 나가기 실패:', error);
        alert('채팅방 나가기에 실패했습니다');
    }
}

// 컨텍스트 메뉴 표시
function showRoomContextMenu(room, event) {
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    roomContextMenu.style.left = rect.right - 150 + 'px';
    roomContextMenu.style.top = rect.bottom + 8 + 'px';
    roomContextMenu.classList.remove('hidden');

    // 현재 선택된 방을 저장 (메뉴 아이템에서 사용)
    window._menuTargetRoom = room;
}

// 컨텍스트 메뉴 숨기기
function hideRoomContextMenu() {
    roomContextMenu.classList.add('hidden');
}

// 메시지 컨텍스트 메뉴 표시
function showMessageContextMenu(message, event, isOwn, messageDiv) {
    event.stopPropagation();

    // 기존 메시지 메뉴 제거
    const existingMenu = document.querySelector('.message-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'message-context-menu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 999;
        min-width: 100px;
        animation: fadeIn 0.15s ease-out;
    `;

    const rect = event.target.getBoundingClientRect();
    menu.style.left = isOwn ?  rect.left - 100 + 'px' : rect.right + 8 + 'px' ;
    menu.style.top = rect.top + 'px';

    menu.innerHTML = (isOwn ? '' : `
        <button class="msg-menu-item" data-action="edit">
            <span class="material-icons">edit</span>
            <span>수정</span>
        </button>
    ` ) +
    `
        <button class="msg-menu-item" data-action="delete">
            <span class="material-icons">delete</span>
            <span>삭제</span>
        </button>
    `;

    // 메뉴 아이템 스타일
    const styles = document.createElement('style');
    if (!document.querySelector('style[data-msg-menu]')) {
        styles.setAttribute('data-msg-menu', 'true');
        styles.textContent = `
            .msg-menu-item {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 10px 12px;
                border: none;
                background: transparent;
                cursor: pointer;
                font-size: 13px;
                color: #333;
                transition: all 0.2s;
                text-align: left;
            }
            .msg-menu-item:first-child { border-radius: 8px 8px 0 0; }
            .msg-menu-item:last-child { border-radius: 0 0 8px 8px; }
            .msg-menu-item:hover { background: #f0f0f0; }
            .msg-menu-item .material-icons { font-size: 16px; }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(menu);

    menu.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        editMessage(message);
        menu.remove();
    });

    menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
        deleteMessage(message, isOwn, messageDiv);
        menu.remove();
    });

    // 메뉴 외부 클릭 시 제거
    setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        });
    }, 0);
}

// 메시지 수정
function editMessage(message) {
    const newText = prompt('메시지를 수정하세요:', message.text);
    if (newText === null || newText.trim() === '') return;
    if (newText === message.text) return;

    updateMessageInFirestore(message.id, newText);
}

// Firebase에서 메시지 수정
async function updateMessageInFirestore(messageId, newText) {
    try {
        const messages = currentRoom.messages || [];
        const messageIndex = messages.findIndex(m => m.id === messageId);

        if (messageIndex !== -1) {
            messages[messageIndex].text = newText;
            messages[messageIndex].edited = true;
            messages[messageIndex].editedAt = firebase.Timestamp.fromDate(new Date());

            await window.chatFb.updateRoom(currentRoom.id, {
                messages: messages
            });

            alert('메시지가 수정되었습니다');
        }
    } catch (error) {
        console.error('메시지 수정 실패:', error);
        alert('메시지 수정에 실패했습니다');
    }
}

// 메시지 삭제
function deleteMessage(message, isOwn, messageDiv) {
    if (!confirm('정말 메시지를 삭제하시겠습니까?')) return;

    if (isOwn) {
        commandHistory = commandHistory.filter(cmd => cmd.timestamp !== message.timestamp);
        localStorage.setItem(`commands_${currentRoom.id}`, JSON.stringify(commandHistory));
        messageDiv.remove();
    } else {
        deleteMessageFromFirestore(message.id);
    }
}

// Firebase에서 메시지 삭제
async function deleteMessageFromFirestore(messageId) {
    try {
        const messages = currentRoom.messages || [];
        const filteredMessages = messages.filter(m => m.id !== messageId);

        await window.chatFb.updateRoom(currentRoom.id, {
            messages: filteredMessages
        });

        alert('메시지가 삭제되었습니다');
    } catch (error) {
        console.error('메시지 삭제 실패:', error);
        alert('메시지 삭제에 실패했습니다');
    }
}

// 링크 공유
function shareRoomLink() {
    if (!currentRoom) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${currentRoom.id}`;

    // 클립보드에 복사
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('채팅방 링크가 복사되었습니다!\n\n' + shareUrl);
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('링크: ' + shareUrl + '\n\n수동으로 복사해주세요');
    });
}

// 이벤트 리스너
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

backBtn.addEventListener('click', goBack);

searchInput.addEventListener('input', (e) => {
    if (e.target.value.trim() === '') {
        renderChatList();
    } else {
        searchRooms(e.target.value);
    }
});

// 채팅방 생성 모달 이벤트
createRoomBtn.addEventListener('click', openCreateRoomModal);
closeModalBtn.addEventListener('click', closeCreateRoomModal);
cancelBtn.addEventListener('click', closeCreateRoomModal);
confirmCreateBtn.addEventListener('click', createChatRoom);

// 모달 외부 클릭 시 닫기
createRoomModal.addEventListener('click', (e) => {
    if (e.target === createRoomModal) {
        closeCreateRoomModal();
    }
});

// Enter 키로 생성
roomTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createChatRoom();
    }
});

participantEmailsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        createChatRoom();
    }
});

// 채팅방 관리 모달
closeManageModalBtn.addEventListener('click', closeManageRoomModal);
cancelManageBtn.addEventListener('click', closeManageRoomModal);
saveRoomBtn.addEventListener('click', saveChatRoom);
deleteRoomBtn.addEventListener('click', deleteChatRoom);

manageRoomModal.addEventListener('click', (e) => {
    if (e.target === manageRoomModal) {
        closeManageRoomModal();
    }
});

// 채팅방 정보 모달
closeInfoModalBtn.addEventListener('click', closeRoomInfoModal);
closeInfoBtn.addEventListener('click', closeRoomInfoModal);

roomInfoModal.addEventListener('click', (e) => {
    if (e.target === roomInfoModal) {
        closeRoomInfoModal();
    }
});

// 공유 모달
closeShareModalBtn.addEventListener('click', closeShareRoomModal);
closeShareBtn.addEventListener('click', closeShareRoomModal);
addParticipantBtn.addEventListener('click', addParticipant);

copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareLink.value).then(() => {
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = '복사됨!';
        setTimeout(() => {
            copyLinkBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('수동으로 복사해주세요');
    });
});

shareEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addParticipant();
    }
});

shareRoomModal.addEventListener('click', (e) => {
    if (e.target === shareRoomModal) {
        closeShareRoomModal();
    }
});

// 채팅방 헤더 버튼
settingsBtn.addEventListener('click', openManageRoomModal);
shareBtn.addEventListener('click', openShareRoomModal);
infoBtn.addEventListener('click', openRoomInfoModal);

// 컨텍스트 메뉴
editRoomMenuItem.addEventListener('click', () => {
    currentRoom = window._menuTargetRoom;
    hideRoomContextMenu();
    openManageRoomModal();
});

leaveRoomMenuItem.addEventListener('click', () => {
    currentRoom = window._menuTargetRoom;
    hideRoomContextMenu();
    leaveChatRoom();
});

// 다른 곳 클릭 시 컨텍스트 메뉴 숨기기
document.addEventListener('click', hideRoomContextMenu);

// 참여자 선택 버튼 이벤트
selectParticipantBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    participantSelector.style.display = participantSelector.style.display === 'none' ? 'block' : 'none';
});

// 참여자 드롭다운 외부 클릭 시 닫기
document.addEventListener('click', (e) => {
    if (e.target !== selectParticipantBtn && !participantSelector.contains(e.target)) {
        participantSelector.style.display = 'none';
    }
});

// 윈도우 리사이즈 처리
window.addEventListener('resize', () => {
    if (window.innerWidth > 480) {
        chatSidebar.classList.remove('hidden');
    }
});

// 메시지 입력 시 전송 버튼 활성화/비활성화
messageInput.addEventListener('input', () => {
    sendBtn.style.opacity = messageInput.value.trim() ? '1' : '0.5';
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 입력 필드 초기 상태
    messageInput.disabled = true;
    sendBtn.disabled = true;
    messageInput.placeholder = '채팅방을 선택하세요';
});
