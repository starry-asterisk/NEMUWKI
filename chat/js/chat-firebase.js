// Firebase Chat Module
// firebase.js가 로드된 후에 이 파일을 로드해야 합니다.

const chatFb = {};

// 채팅방 목록 조회
chatFb.getRooms = async (userId) => {
    try {
        const result = await firebase.listen(
            firebase.collection(firebase.db, "chat"),
            firebase.where('participants', 'array-contains', userId),
            firebase.orderBy('lastMessageTime', 'desc'),
            (snapshot) => {
                const rooms = [];
                snapshot.forEach(doc => {
                    rooms.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return rooms;
            }
        );
        return result;
    } catch (e) {
        console.error("Error getting rooms: ", e);
        return [];
    }
};

// 채팅방 생성
chatFb.createRoom = async (roomData) => {
    try {
        const timestamp = firebase.Timestamp.fromDate(new Date());
        const ref = await firebase.addDoc(firebase.collection(firebase.db, "chat"), {
            title: roomData.title || "",
            participants: roomData.participants || [],
            lastMessage: "",
            lastMessageTime: timestamp,
            lastMessageBy: "",
            createdAt: timestamp,
            createdBy: roomData.createdBy || "",
            ...roomData
        });
        return ref.id;
    } catch (e) {
        console.error("Error creating room: ", e);
        throw e;
    }
};

// 채팅방 조회
chatFb.getRoom = async (roomId) => {
    try {
        const docRef = firebase.doc(firebase.db, "chat", roomId);
        const docSnap = await firebase.getDoc(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        return null;
    } catch (e) {
        console.error("Error getting room: ", e);
        return null;
    }
};

// 메시지 전송
chatFb.sendMessage = async (roomId, messageData) => {
    try {
        const timestamp = firebase.Timestamp.fromDate(new Date());
        const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        // 메시지를 배열에 추가
        const newMessage = {
            id: messageId,
            text: messageData.text || "",
            senderId: messageData.senderId || "",
            senderName: messageData.senderName || "",
            timestamp: timestamp,
            read: false,
            type: messageData.type || "text",
            participant: messageData.participant || ""
        };

        // 채팅방 업데이트: 메시지 배열에 추가 + 마지막 메시지 정보 업데이트
        await firebase.updateDoc(firebase.doc(firebase.db, "chat", roomId), {
            messages: firebase.arrayUnion(newMessage),
            lastMessage: messageData.text || "",
            lastMessageTime: timestamp,
            lastMessageBy: messageData.senderName || ""
        });

        return messageId;
    } catch (e) {
        console.error("Error sending message: ", e);
        throw e;
    }
};

// 메시지 목록 조회 (초기 로드)
chatFb.getMessages = async (roomId, limitCount = 50) => {
    try {
        const docSnap = await firebase.getDoc(firebase.doc(firebase.db, "chat", roomId));
        if (docSnap.exists()) {
            const room = docSnap.data();
            const messages = room.messages || [];
            // 최신 메시지 limitCount개만 반환
            return messages.slice(Math.max(0, messages.length - limitCount));
        }
        return [];
    } catch (e) {
        console.error("Error getting messages: ", e);
        return [];
    }
};

// 메시지 실시간 구독
chatFb.subscribeToMessages = (roomId, callback) => {
    try {
        const unsubscribe = firebase.listen(
            firebase.doc(firebase.db, "chat", roomId),
            (docSnap) => {
                if (docSnap.exists()) {
                    const room = docSnap.data();
                    const messages = room.messages || [];
                    // 타임스탬프 기준으로 정렬
                    messages.sort((a, b) => {
                        const timeA = a.timestamp?.toDate?.() || a.timestamp || 0;
                        const timeB = b.timestamp?.toDate?.() || b.timestamp || 0;
                        return new Date(timeA) - new Date(timeB);
                    });
                    callback(messages);
                } else {
                    callback([]);
                }
            }
        );

        return unsubscribe;
    } catch (e) {
        console.error("Error subscribing to messages: ", e);
        return () => {};
    }
};

// 채팅방 업데이트
chatFb.updateRoom = async (roomId, data) => {
    try {
        await firebase.updateDoc(firebase.doc(firebase.db, "chat", roomId), data);
        return true;
    } catch (e) {
        console.error("Error updating room: ", e);
        throw e;
    }
};

// 채팅방 삭제
chatFb.deleteRoom = async (roomId) => {
    try {
        await firebase.deleteDoc(firebase.doc(firebase.db, "chat", roomId));
        return true;
    } catch (e) {
        console.error("Error deleting room: ", e);
        throw e;
    }
};

// 메시지 삭제
chatFb.deleteMessage = async (roomId, messageId) => {
    try {
        const roomDoc = await firebase.getDoc(firebase.doc(firebase.db, "chat", roomId));
        if (roomDoc.exists()) {
            const messages = roomDoc.data().messages || [];
            const messageToDelete = messages.find(msg => msg.id === messageId);
            
            if (messageToDelete) {
                await firebase.updateDoc(firebase.doc(firebase.db, "chat", roomId), {
                    messages: firebase.arrayRemove(messageToDelete)
                });
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Error deleting message: ", e);
        throw e;
    }
};

// 여러 채팅방 실시간 구독 (목록용)
chatFb.subscribeToRooms = (userId, callback) => {
    try {
        const q = firebase.query(
            firebase.collection(firebase.db, "chat"),
            firebase.where('participants', 'array-contains', userId),
            firebase.orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = firebase.listen(q, (snapshot) => {
            const rooms = [];
            snapshot.forEach(doc => {
                rooms.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(rooms);
        });

        return unsubscribe;
    } catch (e) {
        console.error("Error subscribing to rooms: ", e);
        return () => {};
    }
};

window.chatFb = chatFb;
