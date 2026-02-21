
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
        chatItem.addEventListener('click', () => selectRoom(room));

        chatList.appendChild(chatItem);
    });
}

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

async function selectRoom(room) {
    if (!room) return;
    currentRoom = room;
    selectedParticipant = 'me';
    if (messagesUnsubscribe) messagesUnsubscribe();
    emptyState.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    roomTitle.textContent = room.title || '채팅방';
    roomStatus.textContent = room.lastMessageBy ? `마지막 메시지: ${room.lastMessageBy}` : '채팅방';
    applyRoomBackground();
    renderParticipantSelector();
    updateMessageInputState();
    renderChatList();
    try {
        messagesUnsubscribe = window.chatFb.subscribeToMessages(room.id, (msgs) => {
            renderMessages(msgs);
            focusRandomParticipantMessage();
        });
    } catch (error) {
        console.error("메시지 로드 실패:", error);
    }
    messageInput.focus();
    if (window.innerWidth <= 480) chatSidebar.classList.add('hidden');
}

function renderParticipantSelector() {
    if (!currentRoom) {
        selectParticipantBtn.style.display = 'none';
        return;
    }
    if (window.currentUser?.uid !== currentRoom.createdBy) {
        selectParticipantBtn.style.display = 'none';
        return;
    }

    selectParticipantBtn.style.display = '';
    participantDropdown.innerHTML = '';
    renderParticipantSelectorOption('me');
    (currentRoom.participants || []).forEach(participant => {
        if (participant === window.currentUser.email) return; 

        renderParticipantSelectorOption(participant);
    });
}

function renderParticipantSelectorOption(participant) {
    const option = document.createElement('button');
    option.textContent = participant === 'me' ? '나' : participant;
    option.addEventListener('click', () => {
        selectedParticipant = participant;
        selectParticipantBtn.title = participant === 'me' ? '발신자: 나' : `발신자: ${participant} (명령어)`;
        participantSelector.style.display = 'none';
        updateMessageInputState();
    });
    participantDropdown.appendChild(option);
}

function updateMessageInputState() {
    var items = {
        messageInput: {el: messageInput, disabled: true},
        sendBtn: {el: sendBtn, disabled: true},
        settingsBtn: {el: settingsBtn, disabled: true},
        addParticipantBtn: {el: addParticipantBtn, disabled: true},
        shareEmail: {el: shareEmail, disabled: true},
        selectParticipantBtn: {el: selectParticipantBtn, disabled: true},
    };

    let placeholder = '';

    if (currentRoom) {
        placeholder = '명령어를 입력하세요...';
        items.messageInput.disabled = false;
        items.sendBtn.disabled = false;
        if (window.currentUser) {
            if (currentRoom.createdBy === window.currentUser.uid) {
                if (selectedParticipant !== 'me') placeholder = `${selectedParticipant}의 메시지를 입력하세요...`;

                items.messageInput.placeholder = placeholder;
                items.settingsBtn.disabled = false;
                items.addParticipantBtn.disabled = false;
                items.shareEmail.disabled = false;
                items.selectParticipantBtn.disabled = false;
            } else placeholder = '채팅방 생성자만 메시지 작성 가능';
        } else placeholder = '로그인이 필요합니다';
    } else placeholder = '채팅방을 선택하세요';

    items.messageInput.placeholder = placeholder;
    for(const item of Object.values(items)) item.el.disabled = item.disabled;
}

function renderMessages(msgs = []) {
    messages.innerHTML = '';

    if (!currentRoom) {
        messages.innerHTML = '<div style="text-align: center; color: #999; margin: auto;">채팅방을 선택해주세요</div>';
        return;
    }
    let allMessages = msgs || [];
    try {
        const stored = localStorage.getItem(`commands_${currentRoom.id}`);
        if (stored) {
            const commands = JSON.parse(stored);
            commandHistory = commands;
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
    messages.scrollTop = messages.scrollHeight;
}

function renderSingleMessage(msg) {
    const messageDiv = document.createElement('div');
    const isCommand = msg.type === 'command';
    const isOwn = msg.participant === 'me';
    const isCreater = currentRoom.createdBy === window.currentUser?.uid;
    messageDiv.className = `message ${isOwn ? 'own' : 'other'} ${isCommand ? 'command' : ''}`;

    const time = formatTime(msg.timestamp?.toDate?.() || msg.timestamp);
    const namespace = msg.namespace || msg.senderName || msg.participant || '';
    const displayName = isCommand ? (msg.participant === 'me' ? '나' : msg.participant) : namespace;
    let profileImage = currentRoom.profileImage || '';
    if (displayName === currentRoom.title && currentRoom.profileImage) {
        profileImage = currentRoom.profileImage;
    }

    messageDiv.innerHTML = `
            ${isOwn ? '' : `<div class="message-avatar" style="${profileImage ? `background-image: url('${profileImage}'); background-size: cover; background-position: center;` : ''}">${!profileImage ? (displayName ? displayName[0].toUpperCase() : 'U') : ''}</div>`}
            <div class="message-info">
                <div class="message-namespace">${escapeHtml(displayName)}</div>
                <div class="message-bubble" style="${isCommand ? 'opacity: 0.7; font-style: italic;' : ''}">${escapeHtml(msg.text)}</div>
            </div>
            <span class="message-time">${time}</span>
        `;

    messageDiv.style.position = 'relative';
    messageDiv.style.cursor = 'context-menu';
    if (isOwn || isCreater) {
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMessageContextMenu(msg, e, isOwn, messageDiv);
        });
        let touchStartTime = 0;
        messageDiv.addEventListener('touchstart', () => {
            touchStartTime = Date.now();
        });
        messageDiv.addEventListener('touchend', (e) => {
            if (Date.now() - touchStartTime > 500) { 
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

async function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || !currentRoom) return;
    if (selectedParticipant !== 'me') {
        if (!window.currentUser) {
            alert('로그인이 필요합니다');
            return;
        }

        if (currentRoom.createdBy !== window.currentUser.uid) {
            alert('채팅방 생성자만 참여자 메시지를 작성할 수 있습니다');
            return;
        }
    }

    try {
        if (selectedParticipant === 'me') {
            handleCommand(text, 'me');
        } else {
            await window.chatFb.sendMessage(currentRoom.id, {
                text: text,
                senderId: selectedParticipant,
                senderName: selectedParticipant.split('@')[0],
                namespace: selectedParticipant 
            });
        }
        messageInput.value = '';
        messageInput.style.opacity = '0.5';
    } catch (error) {
        console.error("메시지 전송 실패:", error);
        alert('메시지 전송에 실패했습니다');
    }
}

function handleCommand(text, participant) {
    const command = {
        text: text,
        participant: participant,
        timestamp: new Date(),
        type: 'command'
    };
    if (!commandHistory) commandHistory = [];
    commandHistory.push(command);
    const maxHistory = 100;
    if (commandHistory.length > maxHistory) {
        commandHistory = commandHistory.slice(-maxHistory);
    }

    try {
        localStorage.setItem(`commands_${currentRoom.id}`, JSON.stringify(commandHistory));
    } catch (e) {
        console.warn('localStorage 저장 실패:', e);
    }
    console.log('명령어 기록됨:', command);

    renderSingleMessage(command);
    messages.scrollTop = messages.scrollHeight;
}

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

function searchRooms(query) {
    const filtered = chatRooms.filter(room =>
        room.title.toLowerCase().includes(query.toLowerCase())
    );
    renderChatList(filtered);
}

function openCreateRoomModal() {
    createRoomModal.classList.remove('hidden');
    roomTitleInput.focus();
}

function closeCreateRoomModal() {
    createRoomModal.classList.add('hidden');
    roomTitleInput.value = '';
    roomDescriptionInput.value = '';
    participantEmailsInput.value = '';
    roomProfileImageInput.value = '';
    roomBackgroundImageInput.value = '';
    roomBackgroundPatternInput.value = '';
}

async function createChatRoom() {
    const title = roomTitleInput.value.trim();
    const description = roomDescriptionInput.value.trim();
    const emailsInput = participantEmailsInput.value.trim();
    const profileImage = roomProfileImageInput.value.trim();
    const backgroundImage = roomBackgroundImageInput.value.trim();
    const backgroundPattern = roomBackgroundPatternInput.value;
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
        const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
        const currentUserEmail = window.currentUser.email;
        const participants = [currentUserEmail, ...emails];
        const uniqueParticipants = [...new Set(participants)];
        confirmCreateBtn.disabled = true;
        confirmCreateBtn.textContent = '생성 중...';

        const roomId = await window.chatFb.createRoom({
            title: title,
            description: description,
            participants: uniqueParticipants,
            createdBy: window.currentUser.uid,
            profileImage: profileImage || '',
            backgroundImage: backgroundImage || '',
            backgroundPattern: backgroundPattern || ''
        });

        console.log('채팅방 생성됨:', roomId);
        closeCreateRoomModal();
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
function openManageRoomModal() {
    if (!currentRoom) return;

    editRoomTitle.value = currentRoom.title || '';
    editRoomDescription.value = currentRoom.description || '';
    editRoomProfileImageInput.value = currentRoom.profileImage || '';
    editRoomBackgroundImageInput.value = currentRoom.backgroundImage || '';
    editRoomBackgroundPatternInput.value = currentRoom.backgroundPattern || '';
    renderParticipantsList();
    manageRoomModal.classList.remove('hidden');
}

function closeManageRoomModal() {
    manageRoomModal.classList.add('hidden');
}

function renderParticipantsList() {
    participantsList.innerHTML = '';
    const participants = currentRoom.participants || [];

    participants.forEach(participant => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = participant;

        div.appendChild(span);
        participantsList.appendChild(div);
    });
}

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

function closeRoomInfoModal() {
    roomInfoModal.classList.add('hidden');
}

function openShareRoomModal() {
    if (!currentRoom) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${currentRoom.id}`;
    shareLink.value = shareUrl;

    shareEmail.value = '';
    renderShareParticipantsList();
    shareRoomModal.classList.remove('hidden');
}

function closeShareRoomModal() {
    shareRoomModal.classList.add('hidden');
}

function renderShareParticipantsList() {
    shareParticipantsList.innerHTML = '';
    const participants = currentRoom.participants || [];

    participants.forEach(participant => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = participant;
        div.appendChild(span);

        if (currentRoom.createdBy === window.currentUser?.uid) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '제거';
            removeBtn.addEventListener('click', () => removeParticipant(participant));
            div.appendChild(removeBtn);
        }

        shareParticipantsList.appendChild(div);
    });
}

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

async function removeParticipant(email) {
    if (!confirm(`${email}를 제거하시겠습니까?`)) return;

    try {
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

async function saveChatRoom() {
    try {
        saveRoomBtn.disabled = true;
        saveRoomBtn.textContent = '저장 중...';

        await window.chatFb.updateRoom(currentRoom.id, {
            title: editRoomTitle.value,
            description: editRoomDescription.value,
            profileImage: editRoomProfileImageInput.value,
            backgroundImage: editRoomBackgroundImageInput.value,
            backgroundPattern: editRoomBackgroundPatternInput.value
        });

        currentRoom.title = editRoomTitle.value;
        currentRoom.description = editRoomDescription.value;
        currentRoom.profileImage = editRoomProfileImageInput.value;
        currentRoom.backgroundImage = editRoomBackgroundImageInput.value;
        currentRoom.backgroundPattern = editRoomBackgroundPatternInput.value;

        roomTitle.textContent = currentRoom.title;
        applyRoomBackground(); 
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

function showRoomContextMenu(room, event) {
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    roomContextMenu.style.left = rect.right - 150 + 'px';
    roomContextMenu.style.top = rect.bottom + 8 + 'px';
    roomContextMenu.classList.remove('hidden');
    window._menuTargetRoom = room;
}

function hideRoomContextMenu() {
    roomContextMenu.classList.add('hidden');
}

function showMessageContextMenu(message, event, isOwn, messageDiv) {
    event.stopPropagation();
    const existingMenu = document.querySelector('.message-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu message-context-menu';

    const rect = event.target.getBoundingClientRect();
    menu.style.left = isOwn ? rect.left - 126 + 'px' : rect.right + 8 + 'px';
    menu.style.top = rect.top + 'px';

    menu.innerHTML = (isOwn ? '' : `
        <button class="menu-item" data-action="edit">
            <span class="material-icons">edit</span>
            <span>수정</span>
        </button>
    ` ) +
        `
        <button class="menu-item" data-action="delete">
            <span class="material-icons">delete</span>
            <span>삭제</span>
        </button>
    `;

    document.body.appendChild(menu);

    menu.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        editMessage(message);
        menu.remove();
    });

    menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
        deleteMessage(message, isOwn, messageDiv);
        menu.remove();
    });
    setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        });
    }, 0);
}

function editMessage(message) {
    const newText = prompt('메시지를 수정하세요:', message.text);
    if (newText === null || newText.trim() === '') return;
    if (newText === message.text) return;

    updateMessageInFirestore(message.id, newText);
}

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

function shareRoomLink() {
    if (!currentRoom) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${currentRoom.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('채팅방 링크가 복사되었습니다!\n\n' + shareUrl);
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('링크: ' + shareUrl + '\n\n수동으로 복사해주세요');
    });
}
function applyRoomBackground() {
    if (!currentRoom) return;
    messages.style.backgroundImage = '';
    messages.style.backgroundColor = '#fff';
    messages.classList.remove('pattern-dots', 'pattern-lines', 'pattern-grid', 'pattern-diagonal', 'pattern-waves');
    if (currentRoom.backgroundImage) {
        messages.style.backgroundImage = `url('${currentRoom.backgroundImage}')`;
        messages.style.backgroundSize = 'cover';
        messages.style.backgroundPosition = 'center';
        messages.style.backgroundAttachment = 'fixed';
    }
    if (currentRoom.backgroundPattern) {
        messages.classList.add(`pattern-${currentRoom.backgroundPattern}`);
    }
}

function focusRandomParticipantMessage() {
    if (!currentRoom) return;
    const lastFocusKey = `lastMessageFocus_${currentRoom.id}`;
    const lastFocusDate = localStorage.getItem(lastFocusKey);
    const today = new Date().toDateString();
    if (lastFocusDate === today) return;
    const messageElements = document.querySelectorAll('.message:not(.command)');
    const participantMessages = Array.from(messageElements).filter(msg => {
        return msg.classList.contains('other'); 
    });

    if (participantMessages.length === 0) return;
    const randomIndex = Math.floor(Math.random() * participantMessages.length);
    const randomMessage = participantMessages[randomIndex];
    randomMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    randomMessage.classList.add('highlight');
    setTimeout(() => {
        randomMessage.classList.remove('highlight');
        setTimeout(() => messages.lastChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }, 2000);
    localStorage.setItem(lastFocusKey, today);
}