async function initializePublicChats() {
    if (!window.chatFb || !window.firebase) return;

    try {
        createRoomBtn.disabled = !window.currentUser;
        chatRooms = [];
        if (!currentRoom && paramRoomId) {
            const room = await window.chatFb.getRoom(paramRoomId);
            selectRoom(room);
        }
        if (currentRoom && chatRooms.find(r => r.id === currentRoom.id) === undefined) {
            chatRooms.push(currentRoom);
        }
        renderChatList();
    } catch (error) {
        console.log("공개 채팅방 로드 실패:", error);
    }
}

async function initializeChatApp() {
    if (!window.chatFb) {
        console.error("chatFb 모듈이 로드되지 않았습니다");
        return;
    }

    try {
        createRoomBtn.disabled = !window.currentUser;
        roomsUnsubscribe = window.chatFb.subscribeToRooms(
            window.currentUser.email,
            async (rooms) => {
                chatRooms = rooms;

                if (!currentRoom && paramRoomId) {
                    let room = rooms.find(r => r.id === paramRoomId);
                    if (!room) room = await window.chatFb.getRoom(paramRoomId);
                    selectRoom(room);
                }
                if (currentRoom && chatRooms.find(r => r.id === currentRoom.id) === undefined) {
                    chatRooms.push(currentRoom);
                }
                renderChatList();
            }
        );
    } catch (error) {
        console.error("채팅 초기화 실패:", error);
    }
}

function cleanupSubscriptions() {
    if (messagesUnsubscribe) messagesUnsubscribe();
    if (roomsUnsubscribe) roomsUnsubscribe();
    messagesUnsubscribe = roomsUnsubscribe = null;
}

window.addEventListener('DOMContentLoaded', () => {
    // 공개 채팅방 로드 (비로그인 상태)
    initializePublicChats();
});

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
    renderChatList();

    initializePublicChats();
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', refreshTextareaHeight);

function refreshTextareaHeight() {
    messageInput.style.height = '';
    messageInput.style.height = (messageInput.scrollHeight + 2) + 'px';
}
backBtn.addEventListener('click', goBack);

searchInput.addEventListener('input', (e) => {
    if (e.target.value.trim() === '') {
        renderChatList();
    } else {
        searchRooms(e.target.value);
    }
});

createRoomBtn.addEventListener('click', openCreateRoomModal);
closeModalBtn.addEventListener('click', closeCreateRoomModal);
cancelBtn.addEventListener('click', closeCreateRoomModal);
confirmCreateBtn.addEventListener('click', createChatRoom);

createRoomModal.addEventListener('click', (e) => {
    if (e.target === createRoomModal) {
        closeCreateRoomModal();
    }
});

roomTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createChatRoom();
    }
});

narratorEmailsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        createChatRoom();
    }
});

closeManageModalBtn.addEventListener('click', closeManageRoomModal);
cancelManageBtn.addEventListener('click', closeManageRoomModal);
saveRoomBtn.addEventListener('click', saveChatRoom);
deleteRoomBtn.addEventListener('click', deleteChatRoom);

manageRoomModal.addEventListener('click', (e) => {
    if (e.target === manageRoomModal) {
        closeManageRoomModal();
    }
});

closeInfoModalBtn.addEventListener('click', closeRoomInfoModal);
closeInfoBtn.addEventListener('click', closeRoomInfoModal);

roomInfoModal.addEventListener('click', (e) => {
    if (e.target === roomInfoModal) closeRoomInfoModal();
});

closeShareModalBtn.addEventListener('click', closeShareRoomModal);
closeShareBtn.addEventListener('click', closeShareRoomModal);
addNarratorBtn.addEventListener('click', addNarrator);
addSpeakerBtn.addEventListener('click', addSpeaker);

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
        addNarrator();
    }
});

shareRoomModal.addEventListener('click', (e) => {
    if (e.target === shareRoomModal) {
        closeShareRoomModal();
    }
});

settingsBtn.addEventListener('click', openManageRoomModal);
shareBtn.addEventListener('click', openShareRoomModal);
infoBtn.addEventListener('click', openRoomInfoModal);

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

document.addEventListener('click', hideRoomContextMenu);

selectSpeakerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    speakerSelector.style.display = speakerSelector.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', (e) => {
    if (e.target !== selectSpeakerBtn && !speakerSelector.contains(e.target)) {
        speakerSelector.style.display = 'none';
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 480) chatSidebar.classList.remove('hidden');
});

messageInput.addEventListener('input', () => {
    sendBtn.style.opacity = messageInput.value.trim() ? '1' : '0.5';
});

document.addEventListener('DOMContentLoaded', () => {
    // 입력 필드 초기 상태
    messageInput.disabled = true;
    sendBtn.disabled = true;
    messageInput.placeholder = '채팅방을 선택하세요';
});

// Image selector event listeners
closeImageSelectorBtn.addEventListener('click', closeImageSelector);
cancelImageSelectorBtn.addEventListener('click', closeImageSelector);
confirmImageSelectorBtn.addEventListener('click', confirmImageSelection);
imageLinkBtn.addEventListener('click', promptImageLink);

imageFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = await uploadByImgur(file);
        if (url) {
            selectImage(url);
        }
    }
    e.target.value = '';
});

imageSelectorModal.addEventListener('click', (e) => {
    if (e.target === imageSelectorModal) {
        closeImageSelector();
    }
});

// Image selector button handlers for room creation/management
selectRoomProfileImageBtn.addEventListener('click', () => {
    openImageSelector((url) => {
        roomProfileImageInput.value = url;
    });
});

selectRoomBackgroundImageBtn.addEventListener('click', () => {
    openImageSelector((url) => {
        roomBackgroundImageInput.value = url;
    });
});

selectEditRoomProfileImageBtn.addEventListener('click', () => {
    openImageSelector((url) => {
        editRoomProfileImageInput.value = url;
    });
});

selectEditRoomBackgroundImageBtn.addEventListener('click', () => {
    openImageSelector((url) => {
        editRoomBackgroundImageInput.value = url;
    });
});

