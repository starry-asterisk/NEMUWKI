let RTC = {};
RTC.connections = [];
RTC.dictionary = {};
RTC.retryMap = new Map(); // 재시도 타이머 관리c
RTC.pendingMap = new Map(); // 현재 노크 중인 나레이터 관리


// 1. RTC 시작 (앱 로드 시 1회 실행)
RTC.start = async (cb) => {

    let new_peer_id;
    if (currentUser?.email) {
        new_peer_id = await generatePeerId(null, currentUser.email);
    } else {
        new_peer_id = uuid; // 비로그인 유저는 기존 uuid 사용
    }

    if (peer && peer.id !== new_peer_id) {
        peer.destroy();
        peer = null;
    }

    peer = new Peer(new_peer_id);

    peer.on('open', (id) => {
        my_peer = id;
        cb && cb(id);
    });

    peer.on('connection', handleConnection);
    peer.on('error', errorHandle);
    peer.on('disconnected', () => peer.reconnect());

}

// 2. 방 입장 및 나레이터 노크 로직
RTC.joinRoom = async (doc_id, isNarratorBool = isNarrator()) => {
    const room = chatRooms.find(r => r.id === doc_id);
    const narrators = room?.narrators || [];

    narrators.forEach(narratorEmail => {
        RTC.knock(narratorEmail, isNarratorBool);
    });
}

// 3. 방을 나갈 때 모든 재시도를 멈추는 함수 (추가 권장)
RTC.leaveRoom = () => {
    RTC.retryMap.forEach((value, key) => {
        clearTimeout(value);
    });
    RTC.retryMap.clear();
    console.log("모든 재시도 중단");
};

// 4. 점진적 노크 (핵심 로직)
RTC.knock = async (narratorEmail, isNarratorBool, sendInfo = false, roomId) => {
    const targetId = await generatePeerId(null, narratorEmail);
    if (!targetId || targetId === my_peer) return;
    let old_conn = RTC.connections.find(c => c.peer === targetId);

    // 이미 연결되어 있다면 재시도 중단
    if (old_conn && old_conn.open) {
        RTC.stopRetry(narratorEmail);
        if (sendInfo) rtcFn.send.infoOne(old_conn, { type: 'roomId', roomId: roomId });
        return;
    }

    if (RTC.pendingMap.get(narratorEmail)) return;
    RTC.pendingMap.set(narratorEmail, true);

    console.log(`${narratorEmail}에게 연결 시도...`);
    const conn = peer.connect(targetId, { reliable: true });

    // 연결 성공 시
    conn.on('open', () => {
        console.log("연결 성공:", narratorEmail);
        RTC.pendingMap.delete(narratorEmail);
        handleConnection(conn, narratorEmail);
        RTC.stopRetry(narratorEmail);
        if (sendInfo) rtcFn.send.infoOne(conn, { type: 'roomId', roomId: roomId });
    });

    // 연결 실패 시 (상대방 오프라인 포함)
    conn.on('error', (err) => {
        console.log(err);
        RTC.pendingMap.delete(narratorEmail);
        if (err.type === 'peer-unavailable') {
            RTC.scheduleRetry(narratorEmail, isNarratorBool);
        } else console.warn(`연결 오류 (${narratorEmail}):`, err.type, err.message);
    });
}

// 5. 스마트 재시도 스케줄러
RTC.scheduleRetry = (narratorEmail, isNarratorBool) => {
    if (isNarratorBool) return RTC.retryMap.delete(narratorEmail); // 나레이터는 재시도하지 않음
    if (RTC.retryMap.has(narratorEmail)) return;

    // 연결된 피어가 0개면 10초, 있으면 1분 주기
    const interval = RTC.connections.length === 0 ? 10000 : 60000;

    const timerId = setTimeout(() => {
        RTC.retryMap.delete(narratorEmail);
        RTC.knock(narratorEmail, false);
    }, interval);

    RTC.retryMap.set(narratorEmail, timerId);
}

RTC.stopRetry = (narratorEmail) => {
    if (RTC.retryMap.has(narratorEmail)) {
        clearTimeout(RTC.retryMap.get(narratorEmail));
        RTC.retryMap.delete(narratorEmail);
    }
}

// 6. 연결 관리 함수들
function handleConnection(conn, narratorEmail = null) {
    conn.on('data', function (result) {
        if (typeof rtcFn.receive[result?.type] == 'function') rtcFn.receive[result.type](conn, result.data);
    });

    if (conn.peerConnection) {
        conn.peerConnection.oniceconnectionstatechange = () => {
            const state = conn.peerConnection.iceConnectionState;
            if (state === 'disconnected' || state === 'failed') conn.close();
        };
    }

    conn.on('close', () => removeConnection(conn));

    function callback() {
        addConnection(conn);
        if (narratorEmail) {
            rtcFn.send.infoOne(conn, { type: 'email', email: currentUser.email });
            RTC.dictionary[conn.peer] = narratorEmail || 'unknown';
        }
    }

    // open 이벤트는 밖에서 중복 처리될 수 있으므로 addConnection 내에서 검증
    if (conn.open) callback();
    else conn.on('open', callback);
}

function addConnection(conn) {
    const old_conn = RTC.connections.find(c => c.peer === conn.peer);
    if (old_conn) {
        // 동일 피어의 구형 연결 정리
        RTC.connections = RTC.connections.filter(c => c !== old_conn);
        try { old_conn.close(); } catch (e) { }
    }
    RTC.connections.push(conn);
}

function removeConnection(conn) {
    RTC.connections = RTC.connections.filter(c => c.peer !== conn.peer);

    if (!isNarrator()) {
        console.log("나레이터와 연결이 끊겨 재접속 대기 모드로 전환합니다.");
        if (currentRoom) RTC.joinRoom(currentRoom.id, false); // 필요 시 호출
    }

    try { if (conn.open) conn.close(); } catch (e) { }
}

function errorHandle(err) {
    switch (err.type) {
        case 'browser-incompatible':
            console.warn('호환되지 않는 브라우저입니다');
            break;
        case 'disconnected':
            console.warn('연결 종료됨');
            break;
        case 'invalid-id':
            console.warn('유효하지 않은 연결');
            break;
        case 'invalid-key':
            console.warn('유효하지 않은 연결');
            break;
        case 'network':
            console.warn('네트워크 오류', 3600000);
            break;
        case 'peer-unavailable':
            return;
        case 'ssl-unavailable':
            console.warn('인증서 오류', 3600000);
            break;
        case 'server-error':
            console.warn('서버 오류', 3600000);
            break;
        case 'socket-error':
            console.warn('소켓서버 오류', 3600000);
            break;
        case 'socket-closed':
            console.warn('소켓서버 종료됨', 3600000);
            break;
        case 'unavailable-id':
            console.warn(err);
            if (err.message.indexOf('is taken') > -1) Notify.alert('이미 이 계정으로 접속 중입니다. 열려있는 채팅 페이지를 모두 종료하고 재시도 해주세요.').then(() => { location.href = '/'; });
            break;
        default:
            console.warn(err);
            break;
    }
}

let rtcFn = {
    receive: {
        typing_status: (conn, data) => {
            if (currentRoom && currentRoom.id === data.roomId) {
                const speakerName = RTC.dictionary[conn.peer] || '알 수 없는 사용자';
                if (data.isTyping) {
                    showTypingIndicator(speakerName);
                } else {
                    hideTypingIndicator(speakerName);
                }
            }
        },
        send_message: (conn, data) => {
            const room = chatRooms.find(r => r.id === data.roomId);
            if (room) {
                room.messages = room.messages || [];
                room.messages.push(data.message);
                if (currentRoom && currentRoom.id === room.id) {
                    renderSingleMessage(data.message);
                    messages.scrollTop = messages.scrollHeight;
                }
            }
        },
        edit_message: (conn, data) => {
            const room = chatRooms.find(r => r.id === data.roomId);
            if (room) {
                room.messages = (room.messages || []).map(msg => msg.id === data.message.id ? data.message : msg);
                if (currentRoom && currentRoom.id === room.id) renderSingleMessage(data.message);
            }
        },
        delete_message: (conn, data) => {
            const room = chatRooms.find(r => r.id === data.roomId);
            if (room) {
                room.messages = (room.messages || []).filter(msg => msg.id !== data.messageId);
                if (currentRoom && currentRoom.id === room.id) {
                    const oldMessage = messages.querySelector(`.message[data-id="${data.messageId}"]`);
                    if (oldMessage) oldMessage.remove();
                }
            }
        },
        file: (conn, data) => {

        },
        info: async (conn, data) => {
            switch (data?.type) {
                case 'roomId':
                    let oldData = chatRooms.find(r => r.id === data.roomId);
                    if (oldData) oldData.narrators.push(currentUser?.email || 'unknown');
                    else {
                        chatRooms.unshift(await window.chatFb.getRoom(data.roomId));
                        renderChatList();
                    }
                    RTC.joinRoom(data.roomId, true);
                    if (currentRoom && currentRoom.id === data.roomId) {
                        renderSpeakerSelector();
                        renderShareNarratorList();
                        renderNarratorAndSpeakerList();
                    }
                    break;
                case 'email':
                    RTC.dictionary[conn.peer] = data.email;
                    break;
                case 'avatar':
                    const room = chatRooms.find(r => r.id === data.roomId);
                    if (room) {
                        room.speakerAvatars = room.speakerAvatars || {};
                        room.speakerAvatars[data.speaker] = data.avatar;
                        if (currentRoom && currentRoom.id === room.id) renderMessages(room.messages);
                    }
                    break;
                case 'mainSpeaker':
                    const roomForSpeaker = chatRooms.find(r => r.id === data.roomId);
                    if (roomForSpeaker) {
                        roomForSpeaker.mainSpeaker = data.speaker;
                        if (currentRoom && currentRoom.id === roomForSpeaker.id) renderMessages(roomForSpeaker.messages);
                    }
                    break;
                case 'deleteSpeaker':
                    const roomForDeleteSpeaker = chatRooms.find(r => r.id === data.roomId);
                    if (roomForDeleteSpeaker) {
                        roomForDeleteSpeaker.speakers = (roomForDeleteSpeaker.speakers || []).filter(x => x !== data.speaker);
                        if (currentRoom && currentRoom.id === roomForDeleteSpeaker.id) renderSpeakerSelector();
                    }
                    break;
                case 'addSpeaker':
                    const roomForAddSpeaker = chatRooms.find(r => r.id === data.roomId);
                    if (roomForAddSpeaker) {
                        roomForAddSpeaker.speakers = [...(roomForAddSpeaker.speakers || []), data.speaker];
                        if (currentRoom && currentRoom.id === roomForAddSpeaker.id) renderSpeakerSelector();
                    }
                    break;
                case 'roomUpdate':
                    const roomForUpdate = chatRooms.find(r => r.id === data.roomId);
                    if (roomForUpdate) refreshRoom(roomForUpdate.id, data.data);
                    break;
                default:
                    break;
            }
        },
        quit_room: (conn, data) => {
            const room = chatRooms.find(r => r.id === data.roomId);
            if (room) deleteNarrator(data.email, room);
        },
        delete_room: (conn, roomId) => {
            let targetNarrators = [];
            chatRooms = chatRooms.filter(r => {
                if (r.id === roomId) {
                    if (currentRoom && currentRoom.id === roomId) {
                        goBack(false);
                    }
                    targetNarrators = r.narrators || [];
                    return false;
                } else return true;
            });
            targetNarrators.forEach(narratorEmail => {
                for (let room of chatRooms) if (room.narrators && room.narrators.includes(narratorEmail)) return;
                generatePeerId(null, narratorEmail).then(
                    peerId => {
                        const conn = RTC.connections.find(c => c.peer === peerId);
                        if (conn) removeConnection(conn);
                    }
                );
            });
            renderChatList();
        }
    },
    send: {
        message: (data) => {
            if (!isNarrator()) return;
            RTC.connections.forEach(conn => {
                if (conn.open) conn.send({ type: 'send_message', data: data });
            });
        },
        messageOne: (conn, message, roomId) => {
            if (!isNarrator()) return;
            if (conn.open) conn.send({ type: 'send_message', data: { message, roomId } });
        },
        messageUpdateOne: (conn, message, roomId) => {
            if (!isNarrator()) return;
            if (conn.open) conn.send({ type: 'edit_message', data: { message, roomId } });
        },
        messageDeleteOne: (conn, messageId) => {
            if (!isNarrator()) return;
            if (conn.open) conn.send({ type: 'delete_message', data: { messageId, roomId } });
        },
        file: (fileData) => {
            if (!isNarrator()) return;
            RTC.connections.forEach(conn => {
                if (conn.open) conn.send({ type: 'file', data: fileData });
            });
        },
        info: (infoData) => {
            if (!isNarrator()) return;
            RTC.connections.forEach(conn => {
                if (conn.open) conn.send({ type: 'info', data: infoData });
            });
        },
        infoOne: (conn, infoData) => {
            if (!isNarrator()) return;
            if (conn.open) conn.send({ type: 'info', data: infoData });
        },
        typing_status: (conn, infoData) => {
            if (!isNarrator()) return;
            if (conn.open) conn.send({ type: 'typing_status', data: infoData });
        },
        invite_room: (newNarratorEmail, roomId) => {
            if (!isNarrator()) return;
            RTC.knock(newNarratorEmail, true, true, roomId);
        },
        quit_roomOne: (conn, NarratorEmail, roomId) => {
            if (!isNarrator()) return;
            if (conn.open) conn.send({ type: 'quit_room', data: { email: NarratorEmail, roomId } });
        },
        delete_roomOne: (conn, roomId) => {
            if (!isCreator()) return;
            if (conn.open) conn.send({ type: 'delete_room', data: roomId });
        }
    }
};