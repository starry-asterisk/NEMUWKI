
// --- Render Functions ---
function renderChatList(rooms = chatRooms) {
    chatList.innerHTML = '';
    if (rooms.length === 0) {
        chatList.innerHTML = '<div class="empty-msg">채팅방이 없습니다</div>';
        return;
    }
    rooms.forEach(createChatItem);
}

function createChatItem(room) {
    if (room.id === currentRoom?.id) {
        updateMessageInputState();
    }

    if (room.narrators && room.narrators.length > 0) RTC.joinRoom(room.id, false);

    const existingItem = document.querySelector(`.chat-item[data-room-id="${room.id}"]`);

    const chatItem = document.createElement('div');
    chatItem.dataset.roomId = room.id;
    chatItem.className = `chat-item ${currentRoom?.id === room.id ? 'active' : ''}`;
    chatItem.style.position = 'relative';
    chatItem.innerHTML = `
        ${room.profileImage ?
            `<div class="chat-avatar" style="background-image: url('${room.profileImage}');"></div>` :
            `<div class="chat-avatar">${room.title ? room.title[0].toUpperCase() : 'C'}</div>`}
        <div class="chat-info">
            <div class="chat-header-info">
                <span class="chat-name">${room.title || '채팅방'}</span>
                <span class="chat-time">${room.lastMessageTime ? formatTime(room.lastMessageTime.toDate?.() || room.lastMessageTime) : ''}</span>
            </div>
            <div class="chat-preview">
                ${room.lastMessage || '새로운 채팅'}
            </div>
        </div>
    `;
    chatItem.addEventListener('click', () => selectRoom(room));
    if (existingItem) {
        chatList.replaceChild(chatItem, existingItem);
    } else {
        chatList.appendChild(chatItem);
    }
}

async function selectRoom(room) {
    if (!room) return;
    currentRoom = room;
    selectedSpeaker = currentUser?.email || uuid;
    emptyState.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    roomTitle.textContent = room.title || '채팅방';
    roomStatus.textContent = room.lastMessageBy ? `마지막 메시지: ${room.lastMessageBy}` : '채팅방';
    applyRoomBackground();
    renderSpeakerSelector();
    updateMessageInputState();
    renderChatList();
    try {
        window.chatFb.getMessages(room.id, (msgs) => {
            renderMessages(msgs);
            focusRandomRecievedMessage();
        });
        setBackTrigger();
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
    const items = {
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
        messages.innerHTML = '<div class="empty-msg type2">채팅방을 선택해주세요</div>';
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
        messages.innerHTML = '<div class="empty-msg type2">채팅을 시작해보세요</div>';
        return;
    }

    allMessages.forEach(renderSingleMessage);
    messages.scrollTop = messages.scrollHeight;
}

function renderSingleMessage(msg) {
    const messageDiv = createMessageDiv(msg);
    messageDiv.dataset.id = msg.id || Math.random().toString(36).substring(2);
    const oldMessage = messages.querySelector(`.message[data-id="${messageDiv.dataset.id}"]`);
    if (oldMessage) {
        messages.replaceChild(messageDiv, oldMessage);
    } else {
        messages.appendChild(messageDiv);
    }
}

function createMessageDiv(msg) {
    const isCommand = msg.type === 'command';
    const isRightBool = isRight(msg.speaker);
    const isOwn = isMe(msg.speaker);
    const speakerAvatars = currentRoom.speakerAvatars || {};
    const profileImage = speakerAvatars[msg.speaker] || '';
    const time = formatTime(msg.timestamp?.toDate?.() || msg.timestamp);
    const displayName = msg.speaker;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isRightBool ? 'right' : 'other'} ${isCommand ? 'command' : ''} ${isOwn ? 'own' : ''}`;
    messageDiv.innerHTML = `
        ${isRightBool ? '' : `<div class="message-avatar" style="${profileImage ? `background-image: url('${profileImage}');` : ''}">${!profileImage ? (displayName ? displayName[0].toUpperCase() : 'U') : ''}</div>`}
        <div class="message-info">
            <div class="message-namespace">${escapeHtml(displayName)}</div>
            <div class="message-bubble">${markdown(escapeHtml(msg.text))}</div>
        </div>
        <span class="message-time">${time}</span>
    `;
    messageDiv.style.position = 'relative';
    messageDiv.style.cursor = 'context-menu';
    attachMessageContextEvents(messageDiv, msg, isRightBool, isOwn);
    return messageDiv;
}

function attachMessageContextEvents(messageDiv, msg, isRightBool, isOwn) {
    const canContext = (msg.type === 'command') || (isCreator() || isNarrator());
    if (canContext) {
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMessageContextMenu(msg, e, isRightBool, isCreator(), isOwn, messageDiv);
        });
        let touchStartTime = 0;
        messageDiv.addEventListener('touchstart', (e) => {
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
    if (!msg.isUserMessage && isNarrator()) {
        const avatar = messageDiv.querySelector('.message-avatar');
        if (avatar) {
            avatar.addEventListener('contextmenu', e => {
                e.stopPropagation();
                e.preventDefault();
                openImageSelector(async (url) => {
                    currentRoom.speakerAvatars = currentRoom.speakerAvatars || {};
                    currentRoom.speakerAvatars[msg.speaker] = url;
                    await window.chatFb.updateRoom(currentRoom.id, { speakerAvatars: currentRoom.speakerAvatars });
                    renderMessages(currentRoom.messages);
                    toAllNarrators((conn) => {
                        rtcFn.send.infoOne(conn, { type: 'avatar', speaker: msg.speaker, avatar: url, roomId: currentRoom.id });
                    }, currentRoom);
                });
            });
            let touchStartTime2 = 0;
            avatar.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                touchStartTime2 = Date.now();
            });
            avatar.addEventListener('touchend', (e) => {
                e.stopPropagation();
                if (Date.now() - touchStartTime2 > 500) {
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
    }
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

    if (!text || !currentRoom) return;

    try {
        if (isCommand) {
            handleCommand(text);
        } else if (currentUser) {
            if (isNarrator() || isCreator()) {
                const messageData = await window.chatFb.sendMessage(currentRoom.id, {
                    text: text,
                    type: 'text',
                    senderName: currentUser.displayName || (currentUser.email || '').split('@')[0],
                    senderId: currentUser.email,
                    speaker: selectedSpeaker,
                    isUserMessage: isMe(selectedSpeaker)
                });
                currentRoom.messages = currentRoom.messages || [];
                currentRoom.messages.push(messageData);
                renderSingleMessage(messageData);
                messages.scrollTop = messages.scrollHeight;
                toAllNarrators(conn => {
                    rtcFn.send.messageOne(conn, messageData, currentRoom.id);
                }, currentRoom);
            } else await Notify.alert('채팅방 생성자 또는 서술자만 참여자 메시지를 작성할 수 있습니다');
        } else {
            await Notify.alert('로그인이 필요합니다');
        }
        messageInput.value = '';
        messageInput.style.opacity = '0.5';
    } catch (error) {
        console.error("메시지 전송 실패:", error);
        await Notify.alert('메시지 전송에 실패했습니다');
    }

    refreshTextareaHeight();
}

// Command handlers registry
const commandHandlers = {};

const commnadDefine = [
    {
        alias: ['test'],
        description: () => `변수 입력이 정상적인지 확인합니다.`,
        fn(args, ctx, ret) {
            return JSON.stringify(args);
        }
    },
    {
        alias: ['image', 'images', '이미지', '사진'],
        description: () => `이미지를 보내기 위한 명령어`,
        fn(args, ctx, ret) {
            if (args.length > 0) {
                let msg = '';
                for(let url of args) msg += `[image:${url}]\n`;
                messageInput.value = msg;
            } else openImageSelector(async (url) => {
                messageInput.value = `[image:${url}]`;
            });
            return false;
        }
    },
    {
        alias: ['help', '도움말', '?'],
        description: () => `명령어들의 설명을 확인합니다.`,
        fn(args, ctx, ret) {
            let msg = [], defines = [];
            if (args.length > 0) {
                for (let cmd of args) {
                    if (cmd in commandHandlers) defines.push(commandHandlers[cmd]._define_);
                    else msg.push(`${cmd}는 존재하지 않는 명령어 입니다.`);
                }
            } else {
                for (let cmd in commandHandlers) defines.push(commandHandlers[cmd]._define_);
            }
            defines = [...new Set(defines)];
            for (let define of defines) {
                msg.push(`명령어 : ${define.alias.join(', ')}\n설명 : ${define.description()}`);
            }
            return msg.join('\n\n');
        }
    },
    {
        alias: ['명령어기록제거', '청소', '정리', 'clear'],
        description: () => `명령어 사용 기록을 삭제합니다.`,
        fn(args, ctx, ret) {
            try {
                localStorage.removeItem(`commands_${ctx.currentRoom.id}`);
                commandHistory = [];
                renderMessages(ctx.currentRoom.messages || []);
                Notify.alert('명령어 기록이 삭제되었습니다');
                return false;
            } catch (e) {
                console.error('clear 명령어 실패:', e);
                return '삭제 중 오류가 발생했습니다';
            }
        }
    },
    {
        alias: ['tmi', '오늘의티엠아이', '티엠아이'],
        description: () => `랜덤으로 메시지 하나를 보여줍니다.`,
        fn(args, ctx, ret) {
            focusRandomRecievedMessage(true);
            return false;
        }
    },
    {
        alias: ['화자목록', '화자', 'speakerlist', 'speaker'],
        description: () => `화자목록을 보여줍니다.`,
        fn(args, ctx, ret) {
            const speakers = currentRoom?.speakers || [];
            return '화자 목록 :\n\n' + (speakers.join('\n') || '현재 설정된 화자가 없습니다.');
        }
    },
    {
        alias: ['서술자목록', '서술자', 'narratorlist', 'narrator'],
        description: () => `서술자목록을 보여줍니다.`,
        fn(args, ctx, ret) {
            const narrators = currentRoom?.narrators || [];
            return '서술자 목록 :\n\n' + (narrators.join('\n') || '현재 설정된 서술자가 없습니다.');
        }
    },
    {
        alias: ['업타임', 'uptime'],
        description: () => `현재시간을 보여줍니다.`,
        fn(args, ctx, ret) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            return `현재 시각은 ${hours}:${minutes}:${seconds}입니다.`;
        }
    },
    {
        alias: ['공유', '공유링크', 'share', 'sharelink'],
        description: () => `공유링크를 보여줍니다.`,
        fn(args, ctx, ret) {
            const url = getShareLink();
            return url || '유효한 방이 열려 있지 않습니다.';
        }
    },
    {
        alias: 'me',
        description: () => `행동 기록을 생성합니다.`,
        experimental: true,
        fn(args, ctx, ret) {
            const name = ctx.currentUser ? (ctx.currentUser.displayName || (ctx.currentUser.email || '').split('@')[0]) : '나';
            const action = args.join(' ').trim();
            if (!action) return '사용법: /me <동작>';
            return `*${name} ${action}`;
        }
    },
    {
        alias: 'nick',
        description: () => `닉네임을 변경합니다.`,
        experimental: true,
        fn(args, ctx, ret) {
            const newNick = args.join(' ').trim();
            if (!newNick) return '사용법: /nick "이메일|화자이름" "새닉네임"';
            try {
                const key = `nicks_${ctx.currentRoom.id}`;
                const raw = localStorage.getItem(key);
                const map = raw ? JSON.parse(raw) : {};
                const currentEmail = ctx.currentUser?.email || -1;
                map[currentEmail] = newNick;
                localStorage.setItem(key, JSON.stringify(map));
                // 닉네임에 대한 불러오기/적용 로직 추가 필요
                return `닉네임이 ${newNick}으로 변경되었습니다`;
            } catch (e) {
                return `닉네임 변경 중 오류가 발생했습니다`;
            }
        }
    },
];

for (let define of commnadDefine) {
    if (define.experimental && !['localhost', '127.0.0.1'].includes(location.hostname)) continue;
    if (typeof define.alias == 'string') define.alias = [define.alias];
    let handler = (args, ctx) => {
        let ret = { temp: false, no_message: false, message: null };
        let result = define.fn(args, ctx, ret);
        if (result === false) return { no_message: true };
        if (typeof result === 'string') ret.message = result;
        return ret;
    }
    handler._define_ = define;
    for (let namespace of define.alias) commandHandlers[namespace] = handler;
}

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

function parseCommandAdvanced(input) {
    if (!input.startsWith('/')) return null;

    // 정규식 설명: 
    // [^\s"']+ -> 따옴표나 공백이 아닌 연속된 문자
    // "[^"]*"  -> 큰따옴표로 둘러싸인 문자열
    // '[^']*'  -> 작은따옴표로 둘러싸인 문자열
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const matches = [];
    let match;

    const content = input.slice(1);

    while ((match = regex.exec(content)) !== null) {
        // match[1]은 큰따옴표 내부, match[2]는 작은따옴표 내부, match[0]은 일반 단어
        matches.push(match[1] || match[2] || match[0]);
    }

    return {
        cmd: matches[0],
        args: matches.slice(1)
    };
}

function handleCommand(text) {
    const now = new Date();
    const isSlash = text.startsWith('/');
    const speaker = currentUser?.email || uuid;

    if (isSlash) {
        const { args, cmd } = parseCommandAdvanced(text);
        const handler = commandHandlers[cmd];
        const ctx = { currentRoom, currentUser: currentUser };
        if (handler) {
            const result = handler(args, ctx) || {};
            if (!result.no_message) {
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
            }
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

function goBack(render = true) {
    currentRoom = null;
    emptyState.classList.remove('hidden');
    chatRoom.classList.add('hidden');
    if (render) renderChatList();

    if (window.innerWidth <= 480) {
        chatSidebar.classList.remove('hidden');
    }
    // history.back();
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
        await Notify.alert('화자 이름을 입력해주세요');
        speakerNamesInput.focus();
        return;
    }

    try {
        const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
        const names = namesInput.split(',').map(n => n.trim()).filter(n => n);
        const currentUserEmail = currentUser.email;
        const narrators = [currentUserEmail, ...emails];
        const uniqueNarrators = [...new Set(narrators)];
        const uniqueSpeakers = [...new Set(names)]
        confirmCreateBtn.disabled = true;
        confirmCreateBtn.textContent = '생성 중...';

        const roomInfo = {
            title: title || namesInput,
            description: description,
            createdBy: currentUser.uid,
            profileImage: profileImage || '',
            backgroundImage: backgroundImage || '',
            backgroundPattern: backgroundPattern || '',
            narrators: uniqueNarrators,
            speakers: uniqueSpeakers,
            mainSpeaker: ''
        };
        const room = await window.chatFb.createRoom(roomInfo);

        for (const email of uniqueNarrators) {
            if (email === currentUserEmail) continue;
            rtcFn.send.invite_room(email, room.id);
        }

        chatRooms.push(room);
        createChatItem(room);
        selectRoom(room);

        console.log('채팅방 생성됨:', room.id);
        closeCreateRoomModal();
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = '생성';

        await Notify.alert('채팅방이 생성되었습니다');
    } catch (error) {
        console.error('채팅방 생성 실패:', error);
        await Notify.alert('채팅방 생성에 실패했습니다: ' + error.message);
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
        setMainBtn.addEventListener('click', () => changeMainSpeaker(room, value));
        div.appendChild(setMainBtn);
        if (room.mainSpeaker === speaker) {
            setMainBtn.textContent = '1인칭 설정 취소';
            span.textContent += '(1인칭)';
            value = '';
        }
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '제거';
        deleteBtn.style.marginLeft = '6px';
        deleteBtn.addEventListener('click', () => deleteSpeaker(room, speaker));
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
        if (room.createdBy === currentUser?.uid) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '제거';
            removeBtn.addEventListener('click', async () => {
                if (!(await Notify.confirm(`서술자 ${n}를 제거하시겠습니까?`))) return;
                try {
                    await window.chatFb.updateRoom(room.id, { narrators: firebase.arrayRemove(n) });
                    toAllNarrators(conn => rtcFn.send.quit_roomOne(conn, n, room.id), room);
                    deleteNarrator(n, room);
                } catch (err) {
                    console.error('서술자 제거 실패:', err);
                    await Notify.alert('서술자 제거에 실패했습니다');
                }
            });
            div.appendChild(removeBtn);
        }
        narratorList.appendChild(div);
    });
}

async function changeMainSpeaker(room, speaker) {
    try {
        await window.chatFb.updateRoom(room.id, { mainSpeaker: speaker });
        room.mainSpeaker = speaker;
        toAllNarrators(conn => rtcFn.send.infoOne(conn, { type: 'mainSpeaker', speaker: speaker, roomId: room.id }), room);
        renderNarratorAndSpeakerList(room);
        if (currentRoom && currentRoom.id === room.id) renderMessages(room.messages);
    } catch (err) {
        console.error('1인칭 설정 실패:', err);
        await Notify.alert('1인칭 설정에 실패했습니다');
    }
}

async function deleteSpeaker(room, speaker) {
    if (!(await Notify.confirm(`화자 ${speaker}를 제거하시겠습니까?`))) return;
    try {
        await window.chatFb.updateRoom(room.id, { speakers: firebase.arrayRemove(speaker) });
        room.speakers = (room.speakers || []).filter(x => x !== speaker);
        toAllNarrators(conn => rtcFn.send.infoOne(conn, { type: 'deleteSpeaker', speaker: speaker, roomId: room.id }), room);
        renderNarratorAndSpeakerList(room);
        if (currentRoom && currentRoom.id === room.id) renderSpeakerSelector();
    } catch (err) {
        console.error('화자 제거 실패:', err);
        await Notify.alert('화자 제거에 실패했습니다');
    }
}

async function deleteNarrator(email, room) {
    room.narrators = (room.narrators || []).filter(x => x !== email);
    if (currentRoom && currentRoom.id === room.id) {
        renderSpeakerSelector();
        renderNarratorAndSpeakerList(room);
        renderShareNarratorList();
    }
    for (let _room of chatRooms) if (_room.narrators && _room.narrators.includes(email)) return;
    generatePeerId(null, email).then(
        peerId => {
            const conn = RTC.connections.find(c => c.peer === peerId);
            if (conn) removeConnection(conn);
        }
    );
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

function getShareLink() {
    if (!currentRoom) return false;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?room=${currentRoom.id}`;
}

function openShareRoomModal() {
    const shareUrl = getShareLink();
    if (!shareUrl) return;
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
            if (currentRoom.createdBy === currentUser?.uid) {
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '제거';
                removeBtn.addEventListener('click', async () => {
                    if (!(await Notify.confirm(`서술자 ${n}를 제거하시겠습니까?`))) return;
                    try {
                        await window.chatFb.updateRoom(currentRoom.id, { narrators: firebase.arrayRemove(n) });
                        toAllNarrators(conn => rtcFn.send.quit_roomOne(conn, n, currentRoom.id), currentRoom);
                        deleteNarrator(n, currentRoom);
                        renderShareNarratorList();
                    } catch (err) {
                        console.error('서술자 제거 실패:', err);
                        await Notify.alert('서술자 제거에 실패했습니다');
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
        await Notify.alert('이메일을 입력해주세요');
        return;
    }

    if ((currentRoom.narrators || []).includes(email)) {
        await Notify.alert('이미 참여자입니다');
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
        rtcFn.send.invite_room(email, currentRoom.id);
        currentRoom.narrators = currentRoom.narrators || [];
        currentRoom.narrators.push(email);
        renderShareNarratorList();
        renderNarratorAndSpeakerList();

        addNarratorBtn.disabled = false;
        addNarratorBtn.textContent = '추가';
    } catch (error) {
        console.error('서술자 추가 실패:', error);
        await Notify.alert('서술자 추가에 실패했습니다');
        addNarratorBtn.disabled = false;
        addNarratorBtn.textContent = '추가';
    }
}

async function addSpeaker() {
    const name = speakerName.value.trim();
    if (!name) {
        await Notify.alert('화자 이름을 입력해주세요');
        return;
    }
    if ((currentRoom.speakers || []).includes(name)) {
        await Notify.alert('이미 존재하는 화자입니다');
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
        toAllNarrators(conn => rtcFn.send.infoOne(conn, { type: 'addSpeaker', speaker: name, roomId: currentRoom.id }), currentRoom);
        renderSpeakerSelector();
        renderNarratorAndSpeakerList();
        addSpeakerBtn.disabled = false;
        addSpeakerBtn.textContent = '추가';
    } catch (error) {
        console.error('화자 추가 실패:', error);
        await Notify.alert('화자 추가에 실패했습니다');
        addSpeakerBtn.disabled = false;
        addSpeakerBtn.textContent = '추가';
    }
}

async function saveChatRoom() {
    try {
        let changedRoomData;
        saveRoomBtn.disabled = true;
        saveRoomBtn.textContent = '저장 중...';

        await window.chatFb.updateRoom(currentRoom.id, changedRoomData = {
            title: editRoomTitle.value,
            description: editRoomDescription.value,
            profileImage: editRoomProfileImageInput.value,
            backgroundImage: editRoomBackgroundImageInput.value,
            backgroundPattern: editRoomBackgroundPatternInput.value
        });


        roomTitle.textContent = currentRoom.title;
        toAllNarrators(conn => rtcFn.send.infoOne(conn, { type: 'roomUpdate', roomId: currentRoom.id, data: changedRoomData }), currentRoom);
        refreshRoom(currentRoom.id, changedRoomData);
        closeManageRoomModal();

        saveRoomBtn.disabled = false;
        saveRoomBtn.textContent = '저장';

        await Notify.alert('채팅방이 수정되었습니다');
    } catch (error) {
        console.error('채팅방 수정 실패:', error);
        await Notify.alert('채팅방 수정에 실패했습니다');
        saveRoomBtn.disabled = false;
        saveRoomBtn.textContent = '저장';
    }
}

async function refreshRoom(roomId, changedRoomData) {
    const room = chatRooms.find(r => r.id === roomId);
    if (!room) return;
    room.title = changedRoomData.title;
    room.description = changedRoomData.description;
    room.profileImage = changedRoomData.profileImage;
    room.backgroundImage = changedRoomData.backgroundImage;
    room.backgroundPattern = changedRoomData.backgroundPattern;

    if (currentRoom && currentRoom.id === room.id) {
        applyRoomBackground();
    }
    createChatItem(room);
}

async function deleteChatRoom() {
    if (!isCreator()) {
        await Notify.alert('채팅방 생성자만 삭제할 수 있습니다');
        return;
    }
    if (!(await Notify.confirm('정말 채팅방을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'))) return;
    try {
        deleteRoomBtn.disabled = true;

        await window.chatFb.deleteRoom(currentRoom.id);

        toAllNarrators(conn => rtcFn.send.delete_roomOne(conn, currentRoom.id), currentRoom);

        rtcFn.receive.delete_room(null, currentRoom.id);

        closeManageRoomModal();
        goBack();

        await Notify.alert('채팅방이 삭제되었습니다');
    } catch (error) {
        console.error('채팅방 삭제 실패:', error);
        await Notify.alert('채팅방 삭제에 실패했습니다');
        deleteRoomBtn.disabled = false;
    }
}

async function leaveChatRoom() {
    if (!currentRoom) return;

    try {
        await window.chatFb.updateRoom(currentRoom.id, {
            narrators: firebase.arrayRemove(currentUser.email)
        });
        rtcFn.receive.delete_room(null, currentRoom.id);
        await Notify.alert('채팅방에서 나왔습니다');
    } catch (error) {
        console.error('채팅방 나가기 실패:', error);
        await Notify.alert('채팅방 나가기에 실패했습니다');
    }
}

function showMessageContextMenu(message, event, isRight, isCreator, isOwn, messageDiv) {
    event.stopPropagation();
    const existingMenu = document.querySelector('.message-context-menu');
    const editable = message.type === 'command' || ((message.speaker.indexOf('@') > -1 || message.isUserMessage) ? isOwn : true);
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu message-context-menu';

    const rect = event.target.getBoundingClientRect();
    menu.style.left = isRight ? rect.left - 126 + 'px' : rect.right + 8 + 'px';
    menu.style.top = Math.max(rect.top, 80) + 'px';

    menu.innerHTML = `
        <button class="menu-item" data-action="copy">
            <span class="material-icons">content_copy</span>
            <span>복사</span>
        </button>
    ` + (editable ? `
        <button class="menu-item" data-action="edit">
            <span class="material-icons">edit</span>
            <span>수정</span>
        </button>
    ` : '') + (isCreator || editable ? `
        <button class="menu-item" data-action="delete">
            <span class="material-icons">delete</span>
            <span>삭제</span>
        </button>
    ` : '');

    document.body.appendChild(menu);

    menu.querySelector('[data-action="copy"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(message.text);
        menu.remove();
    });

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

async function editMessage(message) {
    const newText = await Notify.prompt('메시지를 수정하세요:', message.text);
    if (newText === null || newText.trim() === '') return;
    if (newText === message.text) return;

    // 권한 확인: 작성자(creator) 또는 서술자만 Firestore 메시지 수정 가능
    if (!(isCreator() || isNarrator())) {
        await Notify.alert('메시지 수정을 할 권한이 없습니다');
        return;
    }

    updateMessageInFirestore(message.id, newText);
}

async function updateMessageInFirestore(messageId, newText) {
    try {
        if (!(isCreator() || isNarrator())) {
            await Notify.alert('메시지를 수정할 권한이 없습니다');
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
            toAllNarrators(conn => rtcFn.send.messageUpdateOne(conn, messages[messageIndex], currentRoom.id), currentRoom);
            rtcFn.receive.edit_message(null, { roomId: currentRoom.id, message: messages[messageIndex] });
            await Notify.alert('메시지가 수정되었습니다');
        }
    } catch (error) {
        console.error('메시지 수정 실패:', error);
        await Notify.alert('메시지 수정에 실패했습니다');
    }
}

async function deleteMessage(message, messageDiv) {
    if (!(await Notify.confirm('정말 메시지를 삭제하시겠습니까?'))) return;

    if (message.type !== 'text') {
        commandHistory = commandHistory.filter(cmd => cmd.timestamp !== message.timestamp);
        localStorage.setItem(`commands_${currentRoom.id}`, JSON.stringify(commandHistory));
        messageDiv.remove();
    } else {
        // Only creator or narrators can delete Firestore messages
        if (!(isCreator() || isNarrator())) {
            await Notify.alert('메시지를 삭제할 권한이 없습니다');
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
        toAllNarrators(conn => rtcFn.send.messageDeleteOne(conn, messageId, currentRoom.id), currentRoom);
        rtcFn.receive.delete_message(null, { roomId: currentRoom.id, messageId: messageId });
        await Notify.alert('메시지가 삭제되었습니다');
    } catch (error) {
        console.error('메시지 삭제 실패:', error);
        await Notify.alert('메시지 삭제에 실패했습니다');
    }
}

async function shareRoomLink() {
    if (!currentRoom) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${currentRoom.id}`;
    try {
        await navigator.clipboard.writeText(shareUrl);
        await Notify.alert('채팅방 링크가 복사되었습니다!\n\n' + shareUrl);
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        await Notify.alert('링크: ' + shareUrl + '\n\n수동으로 복사해주세요');
    }
}
function applyRoomBackground() {
    if (!currentRoom) return;
    messages.style.backgroundImage = '';
    messages.style.backgroundColor = '';
    messages.classList.remove('pattern-dots', 'pattern-lines', 'pattern-grid', 'pattern-diagonal', 'pattern-waves');
    if (currentRoom.backgroundImage) {
        messages.style.backgroundImage = `url('${currentRoom.backgroundImage}')`;
        messages.style.backgroundSize = 'cover';
        messages.style.backgroundPosition = 'center';
    }
    if (currentRoom.backgroundPattern) {
        messages.classList.add(`pattern-${currentRoom.backgroundPattern}`);
    }
}

function focusRandomRecievedMessage(force = false) {
    if (!currentRoom) return;
    const lastFocusKey = `lastMessageFocus_${currentRoom.id}`;
    const lastFocusDate = localStorage.getItem(lastFocusKey);
    const today = new Date().toDateString();
    if (!force && lastFocusDate === today) return;
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
    if (!force) localStorage.setItem(lastFocusKey, today);
}

function isCreator(uid = currentUser?.uid, room = currentRoom) {
    return room && room?.createdBy === uid;
}

function isNarrator(email = currentUser?.email, room = currentRoom) {
    return room && (room.narrators || []).includes(email);
}

function isMe(namespace, room = currentRoom) {
    return namespace === uuid || namespace === currentUser?.email;
}

function isRight(namespace, room = currentRoom) {
    return namespace === uuid || namespace === room?.mainSpeaker || namespace === currentUser?.email;
}

function toAllNarrators(fn, room = currentRoom) {
    currentRoom.narrators.forEach(email => {
        if (email === currentUser.email) return;
        (async () => {
            const targetPeerId = await generatePeerId(null, email);
            const targetConn = RTC.connections.find(c => c.peer === targetPeerId);
            if (targetConn) fn(targetConn, email);
        })();
    });
}

function sendTypingStatus(isTyping) {
    if (currentRoom && isNarrator()) toAllNarrators(conn => rtcFn.send.typing_status(conn, { isTyping: isTyping, roomId: currentRoom.id }), currentRoom);
}

function showTypingIndicator(speaker) {
    if (!currentRoom) return;
    let indicator = document.querySelector(`.typing-user-item[data-speaker="${speaker}"]`);
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = `typing-user-item`;
        indicator.innerHTML = `${speaker}이 타이핑 중...`;
        indicator.dataset.speaker = speaker;
        const scrollBottom = (messages.scrollHeight - messages.offsetHeight) - messages.scrollTop;
        typingIndicatorContainer.appendChild(indicator);
        typingIndicatorContainer.style.height = `${typingIndicatorContainer.scrollHeight}px`;
        messages.scrollTop = messages.scrollHeight - messages.offsetHeight - scrollBottom;
    }
}

function hideTypingIndicator(speaker) {
    const indicator = document.querySelector(`.typing-user-item[data-speaker="${speaker}"]`);
    if (indicator) {
        const scrollBottom = (messages.scrollHeight - messages.offsetHeight) - messages.scrollTop;
        indicator.remove();
        typingIndicatorContainer.style.height = `fit-content`;
        messages.scrollTop = messages.scrollHeight - messages.offsetHeight - scrollBottom;
    }
}