
function renderChatList(rooms = chatRooms) {
    chatList.innerHTML = '';

    if (rooms.length === 0) {
        chatList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">채팅방이 없습니다</div>';
        return;
    }

    rooms.forEach(room => {
        if (room.id === currentRoom?.id) {
            currentRoom = room;
            updateMessageInputState();
        }
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${currentRoom?.id === room.id ? 'active' : ''}`;

        const lastMessageTime = room.lastMessageTime ? formatTime(room.lastMessageTime.toDate?.() || room.lastMessageTime) : '';
        const lastMessage = room.lastMessage || '새로운 채팅';
        const profileImage = room.profileImage || '';


        chatItem.innerHTML = `
            ${profileImage ?
                `<div class="chat-avatar" style="background-image: url('${profileImage}');"></div>` :
                `<div class="chat-avatar">${room.title ? room.title[0].toUpperCase() : 'C'}</div>`}
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

async function selectRoom(room) {
    if (!room) return;
    currentRoom = room;
    selectedSpeaker = currentUser?.email || uuid;
    if (messagesUnsubscribe) messagesUnsubscribe();
    emptyState.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    roomTitle.textContent = room.title || '채팅방';
    roomStatus.textContent = room.lastMessageBy ? `마지막 메시지: ${room.lastMessageBy}` : '채팅방';
    applyRoomBackground();
    renderSpeakerSelector();
    updateMessageInputState();
    renderChatList();
    try {
        messagesUnsubscribe = window.chatFb.subscribeToMessages(room.id, (msgs) => {
            renderMessages(msgs);
            focusRandomRecievedMessage();
        });
    } catch (error) {
        console.error("메시지 로드 실패:", error);
    }
    messageInput.focus();
    if (window.innerWidth <= 480) chatSidebar.classList.add('hidden');
}

function renderSpeakerSelector() {
    if (!currentRoom || !(isCreator() || isNarrator())) {
        selectSpeakerBtn.style.display = 'none';
        return;
    }

    selectSpeakerBtn.style.display = '';
    speakerDropdown.innerHTML = '';
    if (currentUser) renderSpeakerSelectorOption(`${currentUser.email}`);
    (currentRoom.speakers || []).forEach(renderSpeakerSelectorOption);
}

function renderSpeakerSelectorOption(speaker) {
    const option = document.createElement('button');
    option.textContent = speaker;
    option.addEventListener('click', () => {
        selectedSpeaker = speaker;
        selectSpeakerBtn.title = `발신자: ${speaker}`;
        speakerSelector.style.display = 'none';
        updateMessageInputState();
    });
    speakerDropdown.appendChild(option);
}

function updateMessageInputState() {
    var items = {
        messageInput: { el: messageInput, disabled: true },
        sendBtn: { el: sendBtn, disabled: true },
        settingsBtn: { el: settingsBtn, disabled: true },
        addNarratorBtn: { el: addNarratorBtn, disabled: true },
        addSpeakerBtn: { el: addSpeakerBtn, disabled: true },
        shareEmail: { el: shareEmail, disabled: true },
        speakerName: { el: speakerName, disabled: true },
        selectSpeakerBtn: { el: selectSpeakerBtn, disabled: true },
    };

    let placeholder = '';

    if (currentRoom) {
        placeholder = '명령어를 입력하세요...';
        items.messageInput.disabled = false;
        items.sendBtn.disabled = false;
        if (isCreator() || isNarrator()) {
            if (selectedSpeaker !== uuid) placeholder = `${selectedSpeaker}의 메시지를 입력하세요...`;

            items.settingsBtn.disabled = false;
            items.addNarratorBtn.disabled = false;
            items.shareEmail.disabled = false;
            items.selectSpeakerBtn.disabled = false;
            items.speakerName.disabled = false;
            items.addSpeakerBtn.disabled = false;
        }
    } else placeholder = '채팅방을 선택하세요';

    messageInput.placeholder = placeholder;
    for (const item of Object.values(items)) item.el.disabled = item.disabled;

    renderSpeakerSelector();
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
    const isRightBool = isRight(msg.speaker);
    const isOwn = isMe(msg.speaker);
    messageDiv.className = `message ${isRightBool ? 'own' : 'other'} ${isCommand ? 'command' : ''}`;

    const time = formatTime(msg.timestamp?.toDate?.() || msg.timestamp);
    const displayName = msg.speaker;
    let profileImage = '';
    if (displayName === currentRoom.title && currentRoom.profileImage) profileImage = currentRoom.profileImage || '';

    messageDiv.innerHTML = `
            ${isRightBool ? '' : `<div class="message-avatar" style="${profileImage ? `background-image: url('${profileImage}'); background-size: cover; background-position: center;` : ''}">${!profileImage ? (displayName ? displayName[0].toUpperCase() : 'U') : ''}</div>`}
            <div class="message-info">
                <div class="message-namespace">${escapeHtml(displayName)}</div>
                <div class="message-bubble">${escapeHtml(msg.text)}</div>
            </div>
            <span class="message-time">${time}</span>
        `;

    messageDiv.style.position = 'relative';
    messageDiv.style.cursor = 'context-menu';
    const canContext = (msg.type === 'command') || (isCreator() || isNarrator());
    if (canContext) {
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMessageContextMenu(msg, e, isRightBool, isCreator(), isOwn, messageDiv);
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
    const isCommand = text.startsWith('/');
    const currentUser = window.currentUser;

    if (!text || !currentRoom) return;

    try {
        if (isCommand) {
            handleCommand(text);
        } else if (currentUser) {
            if (isNarrator() || isCreator()) {
                await window.chatFb.sendMessage(currentRoom.id, {
                    text: text,
                    type: 'text',
                    senderName: currentUser.displayName || (currentUser.email || '').split('@')[0],
                    senderId: currentUser.email,
                    speaker: selectedSpeaker
                });
            } else alert('채팅방 생성자 또는 서술자만 참여자 메시지를 작성할 수 있습니다');
        } else {
            alert('로그인이 필요합니다');
        }
        messageInput.value = '';
        messageInput.style.opacity = '0.5';
    } catch (error) {
        console.error("메시지 전송 실패:", error);
        alert('메시지 전송에 실패했습니다');
    }

    refreshTextareaHeight();
}

// Command handlers registry
const commandHandlers = {
    me: (args, ctx) => {
        const name = ctx.currentUser ? (ctx.currentUser.displayName || (ctx.currentUser.email || '').split('@')[0]) : '나';
        const action = args.join(' ').trim();
        if (!action) return { message: '사용법: /me <동작>' };
        return { message: `*${name} ${action}` };
    },
    nick: (args, ctx) => {
        const newNick = args.join(' ').trim();
        if (!newNick) return { message: '사용법: /nick "이메일|화자이름" "새닉네임"' };
        try {
            const key = `nicks_${ctx.currentRoom.id}`;
            const raw = localStorage.getItem(key);
            const map = raw ? JSON.parse(raw) : {};
            const currentEmail = ctx.currentUser?.email || -1;
            map[currentEmail] = newNick;
            localStorage.setItem(key, JSON.stringify(map));
            // 닉네임에 대한 불러오기/적용 로직 추가 필요
            return { message: `닉네임이 ${newNick}으로 변경되었습니다` };
        } catch (e) {
            console.error('nick 명령어 실패:', e);
            return { message: '닉네임 변경 중 오류가 발생했습니다' };
        }
    },
    clear: (args, ctx) => {
        try {
            localStorage.removeItem(`commands_${ctx.currentRoom.id}`);
            commandHistory = [];
            renderMessages(ctx.currentRoom.messages || []);
            return { message: '명령어 기록이 삭제되었습니다', temp: true };
        } catch (e) {
            console.error('clear 명령어 실패:', e);
            return { message: '삭제 중 오류가 발생했습니다' };
        }
    }
};

function pushCommandToHistory(command) {
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
}

function handleCommand(text) {
    const now = new Date();
    const isSlash = text.startsWith('/');
    const speaker = window.currentUser?.email || uuid;

    if (isSlash) {
        const parts = text.slice(1).trim().split(/\s+/);
        const cmd = parts.shift().toLowerCase();
        const args = parts;
        const handler = commandHandlers[cmd];
        const ctx = { currentRoom, currentUser: window.currentUser };
        if (handler) {
            const result = handler(args, ctx) || {};
            const messageText = result.message ? result.message : `명령어 실행: /${cmd}`;
            const command = {
                text: messageText,
                speaker: speaker,
                timestamp: now,
                type: 'command',
                cmd: cmd
            };
            if (!result.temp) pushCommandToHistory(command);
            renderSingleMessage(command);
            messages.scrollTop = messages.scrollHeight;
            return;
        } else {
            const command = {
                text: `알 수 없는 명령어: /${cmd}`,
                speaker: speaker,
                timestamp: now,
                type: 'command'
            };
            pushCommandToHistory(command);
            renderSingleMessage(command);
            messages.scrollTop = messages.scrollHeight;
            return;
        }
    }

    // plain (non-slash) commands are stored as local command entries
    const command = {
        text: text,
        speaker: speaker,
        timestamp: now,
        type: 'text'
    };
    pushCommandToHistory(command);
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
    narratorEmailsInput.value = '';
    speakerNamesInput.value = '';
    roomProfileImageInput.value = '';
    roomBackgroundImageInput.value = '';
    roomBackgroundPatternInput.value = '';
}

async function createChatRoom() {
    const title = roomTitleInput.value.trim();
    const description = roomDescriptionInput.value.trim();
    const emailsInput = narratorEmailsInput.value.trim();
    const namesInput = speakerNamesInput.value.trim();
    const profileImage = roomProfileImageInput.value.trim();
    const backgroundImage = roomBackgroundImageInput.value.trim();
    const backgroundPattern = roomBackgroundPatternInput.value;

    if (!namesInput) {
        alert('화자 이름을 입력해주세요');
        speakerNamesInput.focus();
        return;
    }

    try {
        const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
        const names = namesInput.split(',').map(n => n.trim()).filter(n => n);
        const currentUserEmail = window.currentUser.email;
        const narrators = [currentUserEmail, ...emails];
        const uniqueNarrators = [...new Set(narrators)];
        const uniqueSpeakers = [...new Set(names)]
        confirmCreateBtn.disabled = true;
        confirmCreateBtn.textContent = '생성 중...';

        const roomId = await window.chatFb.createRoom({
            title: title || namesInput,
            description: description,
            createdBy: window.currentUser.uid,
            profileImage: profileImage || '',
            backgroundImage: backgroundImage || '',
            backgroundPattern: backgroundPattern || '',
            narrators: uniqueNarrators,
            speakers: uniqueSpeakers,
            mainSpeaker: ''
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
    renderNarratorAndSpeakerList();
    manageRoomModal.classList.remove('hidden');
}

function closeManageRoomModal() {
    manageRoomModal.classList.add('hidden');
}

function renderNarratorAndSpeakerList(room = currentRoom) {
    // Speakers
    const speakers = room.speakers || [];
    speakerList.innerHTML = '';
    speakers.forEach(speaker => {
        let value = speaker;
        const div = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = speaker;
        div.appendChild(span);
        const setMainBtn = document.createElement('button');
        setMainBtn.textContent = '1인칭으로 설정';
        setMainBtn.style.marginLeft = 'auto';
        setMainBtn.addEventListener('click', async () => {
            try {
                await window.chatFb.updateRoom(room.id, { mainSpeaker: value });
                room.mainSpeaker = value;
                renderNarratorAndSpeakerList();
            } catch (err) {
                console.error('1인칭 설정 실패:', err);
                alert('1인칭 설정에 실패했습니다');
            }
        });
        div.appendChild(setMainBtn);
        if (room.mainSpeaker === speaker) {
            setMainBtn.textContent = '1인칭 설정 취소';
            span.textContent += '(1인칭)';
            value = '';
        }
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '제거';
        deleteBtn.style.marginLeft = '6px';
        deleteBtn.addEventListener('click', async () => {
            if (!confirm(`화자 ${speaker}를 제거하시겠습니까?`)) return;
            try {
                await window.chatFb.updateRoom(room.id, { speakers: firebase.arrayRemove(speaker) });
                room.speakers = (room.speakers || []).filter(x => x !== speaker);
                renderNarratorAndSpeakerList(room);
            } catch (err) {
                console.error('화자 제거 실패:', err);
                alert('화자 제거에 실패했습니다');
            }
        });
        div.appendChild(deleteBtn);
        speakerList.appendChild(div);
    });

    // Narrators
    const narrators = room.narrators || [];
    narratorList.innerHTML = '';
    narrators.forEach(n => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = n + (n === room.createdBy ? ' (생성자)' : '');
        div.appendChild(span);
        if (room.createdBy === window.currentUser?.uid) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '제거';
            removeBtn.addEventListener('click', async () => {
                if (!confirm(`서술자 ${n}를 제거하시겠습니까?`)) return;
                try {
                    await window.chatFb.updateRoom(room.id, { narrators: firebase.arrayRemove(n) });
                    room.narrators = (room.narrators || []).filter(x => x !== n);
                    renderNarratorAndSpeakerList();
                } catch (err) {
                    console.error('서술자 제거 실패:', err);
                    alert('서술자 제거에 실패했습니다');
                }
            });
            div.appendChild(removeBtn);
        }
        narratorList.appendChild(div);
    });
}

function openRoomInfoModal() {
    if (!currentRoom) return;

    infoRoomTitle.textContent = currentRoom.title || '-';
    infoRoomDescription.textContent = currentRoom.description || '-';
    infoCreatedDate.textContent = currentRoom.createdAt
        ? new Date(currentRoom.createdAt.toDate?.() || currentRoom.createdAt).toLocaleDateString('ko-KR')
        : '-';
    infoNarrators.textContent = (currentRoom.narrators || []).length + '명';
    infoSpeakers.textContent = (currentRoom.speakers || []).length + '명';
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
    renderShareNarratorList();
    shareRoomModal.classList.remove('hidden');
}

function closeShareRoomModal() {
    shareRoomModal.classList.add('hidden');
}

function renderShareNarratorList() {
    shareNarratorList.innerHTML = '';
    const narrators = currentRoom.narrators || [];
    if (narrators.length > 0) {
        narrators.forEach(n => {
            const div = document.createElement('div');
            const span = document.createElement('span');
            span.textContent = n + (n === currentRoom.createdBy ? ' (생성자)' : '');
            div.appendChild(span);
            if (currentRoom.createdBy === window.currentUser?.uid) {
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '제거';
                removeBtn.addEventListener('click', async () => {
                    try {
                        await window.chatFb.updateRoom(currentRoom.id, { narrators: firebase.arrayRemove(n) });
                        currentRoom.narrators = (currentRoom.narrators || []).filter(x => x !== n);
                        renderShareNarratorList();
                    } catch (err) {
                        console.error('서술자 제거 실패:', err);
                        alert('서술자 제거에 실패했습니다');
                    }
                });
                div.appendChild(removeBtn);
            }
            shareNarratorList.appendChild(div);
        });
    }
}

async function addNarrator() {
    const email = shareEmail.value.trim();
    if (!email) {
        alert('이메일을 입력해주세요');
        return;
    }

    if ((currentRoom.narrators || []).includes(email)) {
        alert('이미 참여자입니다');
        shareEmail.value = '';
        return;
    }

    try {
        addNarratorBtn.disabled = true;
        addNarratorBtn.textContent = '추가 중...';

        await window.chatFb.updateRoom(currentRoom.id, {
            narrators: firebase.arrayUnion(email)
        });

        shareEmail.value = '';
        renderShareNarratorList();

        addNarratorBtn.disabled = false;
        addNarratorBtn.textContent = '추가';
    } catch (error) {
        console.error('서술자 추가 실패:', error);
        alert('서술자 추가에 실패했습니다');
        addNarratorBtn.disabled = false;
        addNarratorBtn.textContent = '추가';
    }
}

async function addSpeaker() {
    const name = speakerName.value.trim();
    if (!name) {
        alert('화자 이름을 입력해주세요');
        return;
    }
    if ((currentRoom.speakers || []).includes(name)) {
        alert('이미 존재하는 화자입니다');
        speakerName.value = '';
        return;
    }
    try {
        addSpeakerBtn.disabled = true;
        addSpeakerBtn.textContent = '추가 중...';
        await window.chatFb.updateRoom(currentRoom.id, {
            speakers: firebase.arrayUnion(name)
        });
        speakerName.value = '';
        renderSpeakerSelector();
        renderNarratorAndSpeakerList();
        addSpeakerBtn.disabled = false;
        addSpeakerBtn.textContent = '추가';
    } catch (error) {
        console.error('화자 추가 실패:', error);
        alert('화자 추가에 실패했습니다');
        addSpeakerBtn.disabled = false;
        addSpeakerBtn.textContent = '추가';
    }
}

async function removeNarrator(email) {
    if (!confirm(`${email}를 제거하시겠습니까?`)) return;

    try {
        if (email === window.currentUser.email) {
            if (!confirm('채팅방에서 나가시겠습니까?')) return;
            await leaveChatRoom();
            return;
        }

        await window.chatFb.updateRoom(currentRoom.id, {
            narrators: firebase.arrayRemove(email)
        });

        currentRoom.narrators = (currentRoom.narrators || []).filter(p => p !== email);
        renderShareNarratorList();
    } catch (error) {
        console.error('서술자 제거 실패:', error);
        alert('서술자 제거에 실패했습니다');
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
    if (!isCreator()) return alert('채팅방 생성자만 삭제할 수 있습니다');
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
            narrators: firebase.arrayRemove(window.currentUser.email)
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

function showMessageContextMenu(message, event, isRight, isCreator, isOwn, messageDiv) {
    event.stopPropagation();
    const existingMenu = document.querySelector('.message-context-menu');
    const editable = message.type === 'command' || (message.speaker.indexOf('@') > -1 ? isOwn : true);
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu message-context-menu';

    const rect = event.target.getBoundingClientRect();
    menu.style.left = isRight ? rect.left - 126 + 'px' : rect.right + 8 + 'px';
    menu.style.top = rect.top + 'px';

    menu.innerHTML = (editable ? `
        <button class="menu-item" data-action="edit">
            <span class="material-icons">edit</span>
            <span>수정</span>
        </button>
    ` : '') + ( isCreator || editable ? `
        <button class="menu-item" data-action="delete">
            <span class="material-icons">delete</span>
            <span>삭제</span>
        </button>
    ` : '');

    document.body.appendChild(menu);

    menu.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        editMessage(message);
        menu.remove();
    });

    menu.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        deleteMessage(message, messageDiv);
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

    // 권한 확인: 작성자(creator) 또는 서술자만 Firestore 메시지 수정 가능
    if (!(isCreator() || isNarrator())) {
        alert('메시지 수정을 할 권한이 없습니다');
        return;
    }

    updateMessageInFirestore(message.id, newText);
}

async function updateMessageInFirestore(messageId, newText) {
    try {
        if (!(isCreator() || isNarrator())) {
            alert('메시지를 수정할 권한이 없습니다');
            return;
        }
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

function deleteMessage(message, messageDiv) {
    if (!confirm('정말 메시지를 삭제하시겠습니까?')) return;

    if (message.type !== 'text') {
        commandHistory = commandHistory.filter(cmd => cmd.timestamp !== message.timestamp);
        localStorage.setItem(`commands_${currentRoom.id}`, JSON.stringify(commandHistory));
        messageDiv.remove();
    } else {
        // Only creator or narrators can delete Firestore messages
        if (!(isCreator() || isNarrator())) {
            alert('메시지를 삭제할 권한이 없습니다');
            return;
        }
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

function focusRandomRecievedMessage() {
    if (!currentRoom) return;
    const lastFocusKey = `lastMessageFocus_${currentRoom.id}`;
    const lastFocusDate = localStorage.getItem(lastFocusKey);
    const today = new Date().toDateString();
    if (lastFocusDate === today) return;
    const messageElements = document.querySelectorAll('.message:not(.command)');
    const recievedMessages = Array.from(messageElements).filter(msg => {
        return msg.classList.contains('other');
    });

    if (recievedMessages.length === 0) return;
    const randomIndex = Math.floor(Math.random() * recievedMessages.length);
    const randomMessage = recievedMessages[randomIndex];
    randomMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    randomMessage.classList.add('highlight');
    setTimeout(() => {
        randomMessage.classList.remove('highlight');
        setTimeout(() => messages.lastChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }, 2000);
    localStorage.setItem(lastFocusKey, today);
}

function isCreator(uid = window.currentUser?.uid, room = currentRoom) {
    return room && room?.createdBy === uid;
}

function isNarrator(email = window.currentUser?.email, room = currentRoom) {
    return room && (room.narrators || []).includes(email);
}

function isMe(namespace, room = currentRoom) {
    return namespace === uuid || namespace === window.currentUser?.email;
}

function isRight(namespace, room = currentRoom) {
    return namespace === uuid || namespace === room?.mainSpeaker || namespace === window.currentUser?.email;
}