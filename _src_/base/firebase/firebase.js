// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore, collection, setDoc, addDoc, getDocs, getDoc, doc, Timestamp, query, orderBy, getCountFromServer, startAfter, limit, deleteDoc, updateDoc, where, onSnapshot, deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBm2NkGGMEo_TN0u7VRgNhZmTvflJlfOzY",
    authDomain: "nemuwiki-f3a72.firebaseapp.com",
    projectId: "nemuwiki-f3a72",
    storageBucket: "nemuwiki-f3a72.appspot.com",
    messagingSenderId: "125964020971",
    appId: "1:125964020971:web:63803427ae9165e43e22ae",
    measurementId: "G-PCFNLEDQ00"
};

// Initialize Firebase
const fb_app = initializeApp(firebaseConfig);
const db = initializeFirestore(fb_app, { experimentalForceLongPolling: true });
const storage = getStorage(fb_app, "gs://nemuwiki-f3a72.appspot.com");
const auth = getAuth();
const fb = {}
let authListner;

fb.listen = onSnapshot;

fb.history = {
    insertOne: async ({ crud, target, text = '' }) => {
        try {
            return await addDoc(collection(db, "history"), {
                uid: auth.currentUser?.uid || '{Not-Authored}',
                timestamp: Timestamp.fromDate(new Date()),
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
            return await addDoc(collection(db, "history"), {
                uid: auth.currentUser?.uid || '{Not-Authored}',
                timestamp: Timestamp.fromDate(new Date()),
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
//문서
fb.post = {
    random: async () => {
        let count = Math.min((await getCountFromServer(collection(db, "postList"))).data().count, 100);
        let result = await getDocs(query(
            collection(db, "postList"),
            where('hidden', '==', false),
            orderBy('timestamp'),
            limit(count)
        ));
        return result.docs[Math.round(Math.random() * (result.docs.length - 1))].id;
    },
    insertOne: async data => {
        try {
            if (data && data.timestamp) data.timestamp = Timestamp.fromDate(data.timestamp);
            let ref = await addDoc(collection(db, "postList"), {
                board_name: "",
                category: "",
                title: "",
                contents: [],
                hidden: false,
                use: true,
                timestamp: Timestamp.fromDate(new Date()),
                ...data
            });
            fb.history.insertOne({ crud: 'INSERT', target: `postList-${ref.id}`, text: data.title || '' });
            return ref;
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
    deleteOne: async (id, title) => {
        fb.history.insertOne({ crud: 'DELETE', target: `postList-${id}`, text: title || `(삭제됨-${id})` });
        return await deleteDoc(doc(db, "postList", id));
    },
    deleteTemporary: async (id, title, isTemplate) => {
        fb.history.insertOne({ crud: 'TEMPDEL', target: `postList-${id}`, text: title || `(임시삭제됨-${id})` });
        let data = { deleted: true, deleted_timestamp: Timestamp.fromDate(new Date()) };
        if(isTemplate) data.board_name = 'deleted-template';
        return await updateDoc(doc(db, "postList", id), data);
    },
    recover: async (id, title, isTemplate) => {
        fb.history.insertOne({ crud: 'RECOVER', target: `postList-${id}`, text: title || `(복구됨-${id})` });
        let data = { deleted: deleteField(), deleted_timestamp: deleteField() };
        if(isTemplate) data.board_name = 'template';
        return await updateDoc(doc(db, "postList", id), data);
    },
    updateOne: async (id, data) => {
        if (data && data.timestamp) data.timestamp = Timestamp.fromDate(data.timestamp);
        if (data && data.updated_timestamp) data.updated_timestamp = Timestamp.fromDate(data.updated_timestamp);
        fb.history.insertOne({ crud: 'UPDATE', target: `postList-${id}`, text: data.title || '' });
        return await updateDoc(doc(db, "postList", id), data);
    },
    selectOne: async id => await getDoc(doc(db, "postList", id)),
    list: (search = {}, hidden = false, operator = 'contains') => {
        let param_base = [
            collection(db, "postList")
        ], params, documentSnapshots, isEnd = false;
        if(hidden !== null) param_base.push( where('hidden', '==', hidden));
        for (let field in search) {
            if (search[field] == '' || search[field] == undefined) continue;
            let method, keyword;
            if (['boolean', 'string'].indexOf(typeof search[field]) > -1) {
                method = operator;
                keyword = search[field];
            } else {
                method = search[field].op;
                keyword = search[field].key;
            }
            switch (method) {
                case 'contains':
                    param_base.push(where(field, '>=', keyword));
                    param_base.push(where(field, '<=', keyword + "\uf8ff"));
                    break;
                case 'equal':
                    param_base.push(where(field, '==', keyword));
                    break;
                default:
                    param_base.push(where(field, method, keyword));
                    break;
            }
        }

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                params = param_base.slice();
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(25));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < 25) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    }
};

//분류명
fb.board = {
    insertOne: async data => {
        try {
            let ref = await addDoc(collection(db, "boardList"), {
                hidden: false,
                type: 0,
                name: "",
                depth: 1,
                parent: "",
                use: true,
                ...data
            });
            fb.history.insertOne({ crud: 'INSERT', target: `boardList-${ref.id}` });
            return ref;
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
    deleteOne: async id => {
        fb.history.insertOne({ crud: 'DELETE', target: `boardList-${id}` });
        return await deleteDoc(doc(db, "boardList", id))
    },
    updateOne: async (id, data) => {
        fb.history.insertOne({ crud: 'UPDATE', target: `boardList-${id}` });
        return await updateDoc(doc(db, "boardList", id), data);
    },
    query: () => query(collection(db, "boardList")),
    list: async () => await getDocs(collection(db, "boardList")),
    list_paginator: (search = {}) => {
        let param_base = [
            collection(db, "boardList")
        ], params, documentSnapshots, isEnd = false;
        for (let field in search) {
            if (search[field] == '') continue;
            param_base.push(where(field, '>=', search[field]));
            param_base.push(where(field, '<=', search[field] + "\uf8ff"));

        }

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                params = param_base.slice();
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(25));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < 25) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    }
}

//공지사항
fb.notice = {
    insertOne: async data => {
        try {
            return await addDoc(collection(db, "notice"), {
                title: '',
                content: '',
                timestamp: Timestamp.fromDate(new Date()),
                use: true,
                ...data
            });
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
    updateOne: async (id, data) => await updateDoc(doc(db, "notice", id), data),
    deleteOne: async id => await deleteDoc(doc(db, "notice", id)),
    getNewest: async () => await getDocs(query(collection(db, "notice"), where('use', '==', true), orderBy('timestamp'), limit(1))),
    list: () => {
        let documentSnapshots, isEnd = false;

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                let params = [collection(db, "notice"), orderBy('timestamp')];
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(25));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < 25) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    }
}

//카테고리
fb.categories = {
    insertOne: async data => {
        try {
            let ref = await addDoc(collection(db, "categories"), {
                hidden: false,
                name: "",
                use: true,
                ...data
            });
            fb.history.insertOne({ crud: 'INSERT', target: `categories-${ref.id}` });
            return ref;
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
    deleteOne: async id => {
        fb.history.insertOne({ crud: 'DELETE', target: `categories-${ref.id}` });
        await deleteDoc(doc(db, "categories", id));
    },
    updateOne: async (id, data) => {
        fb.history.insertOne({ crud: 'UPDATE', target: `categories-${ref.id}` });
        await updateDoc(doc(db, "categories", id), data);
    },
    query: () => query(collection(db, "categories")),
    list: async () => await getDocs(collection(db, "categories")),
    list_paginator: (search = {}) => {
        let param_base = [
            collection(db, "categories")
        ], params, documentSnapshots, isEnd = false;
        for (let field in search) {
            if (search[field] == '') continue;
            param_base.push(where(field, '>=', search[field]));
            param_base.push(where(field, '<=', search[field] + "\uf8ff"));

        }

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                params = param_base.slice();
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(25));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < 25) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    }
}

//저장소
fb.storage = {
    getStaticUrl: fileName => `https://storage.googleapis.com/${firebaseConfig.projectId}.appspot.com/${fileName}`,
    getUrl: async fileName => await getDownloadURL(ref(storage, fileName)),
    delete: async fileName => await deleteObject(ref(storage, fileName)),
    upload: async (fileName, file) => await uploadBytes(ref(storage, fileName), file),
    uploadResumable: (fileName, file) => uploadBytesResumable(ref(storage, fileName), file)
};

fb.resources = {
    regist: async data => {
        if (!'link' in data || !'deletehash' in data) throw 'data incorrect, necessary field is not presented';
        if (!'id' in data) data.id = Math.floor(Math.random() * 100000000).toString(16);
        const formatted = {
            owner_id: auth.currentUser?.uid,
            uploaded_dt: data.datetime * 1000 || new Date().getTime(),
            deletehash: data.deletehash,
            link: data.link,
            size: data.size,
            mime: data.type,
            height: data.height,
            width: data.width
        }
        await setDoc(doc(db, "resources", data.id), formatted);
        fb.history.insertOne({ crud: 'INSERT', target: `resources-${data.id}` });
        return true;
    },
    delete: async (id, hash, url) => {
        fb.history.insertOne({ crud: 'DELETE', target: `resource-${id}`, hash, text: url || `(삭제됨-리소스{${id}})`});
        return await deleteDoc(doc(db, "resources", id))
    },
    all: async () => await getDocs(query(collection(db, "resources"), where('owner_id', '==', auth.currentUser?.uid))),
}

//인증
fb.auth = {
    login: async (email, password) => await signInWithEmailAndPassword(auth, email, password),
    logout: async () => await signOut(auth),
    check: (signInCallback, signOutCallback) => {
        if (typeof authListner == 'function') authListner();
        authListner = onAuthStateChanged(auth, (user) => {
            if (user) signInCallback(user);
            else signOutCallback();
        });
    },
    checkAdmin: (callback) => {
        if (typeof authListner == 'function') authListner();
        authListner = onAuthStateChanged(auth, async (user) => {
            try {
                let infos;
                if (user == undefined) return callback(false, user);
                if ((infos = await getDoc(doc(db, "users", user.uid))) == undefined) return callback(false, user);
                if (infos.data().level !== 0) return callback(false, user);
                return callback(true, user);
            } catch (e) {
                firebaseErrorHandler(e);
            }
        });
    },
    signup: async (email, password) => {
        let creditional = await createUserWithEmailAndPassword(auth, email, password);
        let user = creditional?.user;
        if (user == undefined) throw { code: 'signup failed...' };
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            level: 5
        });
        return user;
    },
    users: (search = {}) => {
        let param_base = [
            collection(db, "users")
        ], params, documentSnapshots, isEnd = false;
        for (let field in search) {
            if (search[field] == '') continue;
            param_base.push(where(field, '>=', search[field]));
            param_base.push(where(field, '<=', search[field] + "\uf8ff"));

        }

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                params = param_base.slice();
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(25));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < 25) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    },
    getUser: async (uid = auth.currentUser?.uid) => await getDoc(doc(db, "users", uid)),
    getAuth: () => auth.currentUser,
    updateUser: async (id, data) => await updateDoc(doc(db, "users", id), data),
    sendPasswordResetEmail: async email => await sendPasswordResetEmail(auth, email),
    sendEmailVerification: async () => await sendEmailVerification(auth.currentUser)
}

fb.search = {
    set: async (id, data) => {
        await setDoc(doc(db, "keyword", id), data);
    },
    unset: async (id) => {
        const docRef = doc(db, "keyword", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) await deleteDoc(doc(db, "keyword", id));
    },
    random: async () => {
        let count = Math.min((await getCountFromServer(collection(db, "keyword"))).data().count, 100);
        let result = await getDocs(query(
            collection(db, "keyword"),
            limit(count)
        ));
        return result.docs[Math.round(Math.random() * (result.docs.length - 1))].id;
    },
    list: (search = {}, operator = 'contains', page_offset = 25, order_by = 'timestamp', order_direction = 'desc') => {
        let param_base = [
            collection(db, "keyword"),
            orderBy(order_by, order_direction)
        ], params, documentSnapshots, isEnd = false, already_contains_used = false;
        for (let field in search) {
            if (search[field] === '' || search[field] == undefined) continue;
            let method, keyword;
            if (typeof search[field] == 'string' || typeof search[field] == 'boolean') {
                method = operator;
                keyword = search[field];
            } else {
                method = search[field].op;
                keyword = search[field].key;
            }
            switch (method) {
                case 'contains':
                    if (already_contains_used) break;
                    param_base.push(where(field, 'array-contains', keyword));
                    already_contains_used = true;
                    break;
                case 'equal':
                    param_base.push(where(field, '==', keyword));
                    break;
                default:
                    param_base.push(where(field, method, keyword));
                    break;
            }
        }

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                params = param_base.slice();
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(page_offset));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < page_offset) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    }
}


fb.dialog = {
    insertOne: async data => {
        try {
            if (data && data.timestamp) data.timestamp = Timestamp.fromDate(data.timestamp);
            let ref = await addDoc(collection(db, "dialog"), {
                title: "",
                contents: [],
                timestamp: Timestamp.fromDate(new Date()),
                ...data
            });
            fb.history.insertOne({ crud: 'INSERT', target: `dialog-${ref.id}`, text: data.title || '' });
            return ref;
        } catch (e) {
            dev.error("Error adding document: ", e);
        }
    },
    deleteOne: async (id, title) => {
        fb.history.insertOne({ crud: 'DELETE', target: `dialog-${id}`, text: title || `(삭제됨-${id})` });
        return await deleteDoc(doc(db, "dialog", id));
    },
    deleteTemporary: async (id, title, isTemplate) => {
        fb.history.insertOne({ crud: 'TEMPDEL', target: `dialog-${id}`, text: title || `(임시삭제됨-${id})` });
        let data = { deleted: true, deleted_timestamp: Timestamp.fromDate(new Date()) };
        if(isTemplate) data.board_name = 'deleted-template';
        return await updateDoc(doc(db, "dialog", id), data);
    },
    recover: async (id, title, isTemplate) => {
        fb.history.insertOne({ crud: 'RECOVER', target: `dialog-${id}`, text: title || `(복구됨-${id})` });
        let data = { deleted: deleteField(), deleted_timestamp: deleteField() };
        if(isTemplate) data.board_name = 'template';
        return await updateDoc(doc(db, "dialog", id), data);
    },
    updateOne: async (id, data) => {
        if (data && data.timestamp) data.timestamp = Timestamp.fromDate(data.timestamp);
        if (data && data.updated_timestamp) data.updated_timestamp = Timestamp.fromDate(data.updated_timestamp);
        fb.history.insertOne({ crud: 'UPDATE', target: `dialog-${id}`, text: data.title || '' });
        return await updateDoc(doc(db, "dialog", id), data);
    },
    selectOne: async id => await getDoc(doc(db, "dialog", id))
};

fb.dialogIndex = {
    set: async (id, data) => {
        await setDoc(doc(db, "dialog_index_chunks", id), data);
    },
    unset: async (id) => {
        const docRef = doc(db, "dialog_index_chunks", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) await deleteDoc(doc(db, "dialog_index_chunks", id));
    },
    list: () => {
        let page_offset = 1;
        let param_base = [
            collection(db, "dialog_index_chunks"),
            orderBy('timestamp', 'desc')
        ], params, documentSnapshots, isEnd = false;

        return {
            next: async (docs = documentSnapshots?.docs) => {
                if (isEnd) return [];
                params = param_base.slice();
                if (docs && docs?.length != 0) params.push(startAfter(docs[docs.length - 1]));
                params.push(limit(page_offset));
                documentSnapshots = await getDocs(query.apply(undefined, params));
                if (documentSnapshots.docs.length < page_offset) isEnd = true;
                return documentSnapshots.docs;
            }
        }
    }
}

window.firebase = fb;