const chatFb = {};

chatFb.createRoom = async (roomData) => {
    try {
        const timestamp = firebase.Timestamp.fromDate(new Date());
        const data = {
            title: roomData.title || "",
            narrators: roomData.narrators || [],
            speakers: roomData.speakers || [],
            lastMessage: "",
            lastMessageTime: timestamp,
            lastMessageBy: "",
            createdAt: timestamp,
            createdBy: roomData.createdBy || "",
            ...roomData
        };
        const ref = await firebase.addDoc(firebase.collection(firebase.db, "chat"), data);
        return { id: ref.id, ...datas };
    } catch (e) {
        console.error("Error creating room: ", e);
        throw e;
    }
};

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

chatFb.sendMessage = async (roomId, messageData) => {
    try {
        const timestamp = firebase.Timestamp.fromDate(new Date());
        const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        const newMessage = {
            id: messageId,
            text: messageData.text || "",
            senderId: messageData.senderId || "",
            senderName: messageData.senderName || "",
            timestamp: timestamp,
            read: false,
            type: messageData.type || "text",
            speaker: messageData.speaker || ""
        };

        await firebase.updateDoc(firebase.doc(firebase.db, "chat", roomId), {
            messages: firebase.arrayUnion(newMessage),
            lastMessage: messageData.text || "",
            lastMessageTime: timestamp,
            lastMessageBy: messageData.senderName || ""
        });

        return newMessage;
    } catch (e) {
        console.error("Error sending message: ", e);
        throw e;
    }
};

chatFb.getMessagesPaging = async (roomId, limitCount = 50) => {
    try {
        const docSnap = await firebase.getDoc(firebase.doc(firebase.db, "chat", roomId));
        if (docSnap.exists()) {
            const room = docSnap.data();
            const messages = room.messages || [];
            return messages.slice(Math.max(0, messages.length - limitCount));
        }
        return [];
    } catch (e) {
        console.error("Error getting messages: ", e);
        return [];
    }
};

chatFb.getMessages = (roomId, callback) => {
    try {

        firebase.getDoc(firebase.doc(firebase.db, "chat", roomId)).then((docSnap) => {
            if (docSnap.exists()) {
                const room = docSnap.data();
                const messages = room.messages || [];
                messages.sort((a, b) => {
                    const timeA = a.timestamp?.toDate?.() || a.timestamp || 0;
                    const timeB = b.timestamp?.toDate?.() || b.timestamp || 0;
                    return new Date(timeA) - new Date(timeB);
                });
                callback(messages);
            } else {
                callback([]);
            }
        }).catch(e => {
            console.error("Error fetching messages: ", e);
        });

    } catch (e) {
        console.error("Error fetching messages: ", e);
        return () => { };
    }
};

chatFb.updateRoom = async (roomId, data) => {
    try {
        await firebase.updateDoc(firebase.doc(firebase.db, "chat", roomId), data);
        return true;
    } catch (e) {
        console.error("Error updating room: ", e);
        throw e;
    }
};

chatFb.deleteRoom = async (roomId) => {
    try {
        await firebase.deleteDoc(firebase.doc(firebase.db, "chat", roomId));
        return true;
    } catch (e) {
        console.error("Error deleting room: ", e);
        throw e;
    }
};

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

chatFb.getRooms = (userId, callback) => {
    try {
        const q = firebase.query(
            firebase.collection(firebase.db, "chat"),
            firebase.where('narrators', 'array-contains', userId),
            firebase.orderBy('lastMessageTime', 'desc')
        );

        firebase.getDocs(q).then((snapshot) => {
            const rooms = [];
            snapshot.forEach(doc => {
                rooms.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(rooms);
        }).catch(e => {
            console.error("Error fetching rooms: ", e);
        });
    } catch (e) {
        console.error("Error fetching rooms: ", e);
        return () => { };
    }
};

chatFb.history = {
    insertOne: async ({ crud, target, text = '' }) => {
        try {
            return await firebase.addDoc(firebase.collection(firebase.db, "history"), {
                uid: currentUser?.uid || '{Not-Authored}',
                timestamp: firebase.Timestamp.fromDate(new Date()),
                crud: crud || 'INSERT',
                target: target || '${document}-${sample_document_uid}',
                text,
                agent: navigator.userAgent
            });
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
    insertError: async ({ type, message, stack }) => {
        try {
            return await firebase.addDoc(firebase.collection(firebase.db, "history"), {
                uid: currentUser?.uid || '{Not-Authored}',
                timestamp: firebase.Timestamp.fromDate(new Date()),
                crud: 'ERROR',
                target: type,
                text: stack || message,
                agent: navigator.userAgent
            });
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
}

chatFb.resources = {
    regist: async data => {
        if (!'link' in data || !'deletehash' in data) throw 'data incorrect, necessary field is not presented';
        if (!'id' in data) data.id = Math.floor(Math.random() * 100000000).toString(16);
        const formatted = {
            owner_id: currentUser?.uid,
            uploaded_dt: data.datetime * 1000 || new Date().getTime(),
            deletehash: data.deletehash,
            link: data.link,
            size: data.size,
            mime: data.type,
            height: data.height,
            width: data.width
        }
        await firebase.setDoc(firebase.doc(firebase.db, "resources", data.id), formatted);
        chatFb.history.insertOne({ crud: 'INSERT', target: `resources-${data.id}` });
        return true;
    },
    delete: async (id, hash, url) => {
        chatFb.history.insertOne({ crud: 'DELETE', target: `resource-${id}`, hash, text: url || `(삭제됨-리소스{${id}})` });
        return await firebase.deleteDoc(firebase.doc(firebase.db, "resources", id))
    },
    all: async () => await firebase.getDocs(firebase.query(firebase.collection(firebase.db, "resources"), firebase.where('owner_id', '==', currentUser?.uid))),
}

window.chatFb = chatFb;
