// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, Timestamp, query, orderBy, getCountFromServer, startAfter, limit, deleteDoc, updateDoc, where, or, and } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app, "gs://nemuwiki-f3a72.appspot.com");
const auth = getAuth();

window.addEventListener('load', async function () {
    //문서
    firebase.post = {
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
                return await addDoc(collection(db, "postList"), {
                    board_name: "",
                    category: "",
                    title: "",
                    contents: [],
                    hidden: false,
                    use: true,
                    timestamp: Timestamp.fromDate(new Date()),
                    ...data
                });
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        },
        deleteOne: async id => await deleteDoc(doc(db, "postList", id)),
        updateOne: async (id, data) => await updateDoc(doc(db, "postList", id), data),
        selectOne: async id => await getDoc(doc(db, "postList", id)),
        list: async (search = {}, hidden = false) => {
            let param_base = [
                collection(db, "postList"),
                where('hidden', '==', hidden)
            ], params;
            for (let field in search) {
                if (search[field] == '') continue;
                param_base.push(where(field, '>=', search[field]));
                param_base.push(where(field, '<=', search[field] + "\uf8ff"));

            }
            params = param_base.slice();
            params.push(limit(25));

            let query_result = query.apply(undefined, params);
            let documentSnapshots = await getDocs(query_result);

            return {
                docs: documentSnapshots.docs,
                getNext: async (docs = documentSnapshots.docs) => {
                    params = param_base.slice();
                    params.push(startAfter(docs[docs.length - 1]));
                    params.push(limit(25));
                    query_result = query.apply(undefined, params);
                    documentSnapshots = await getDocs(query_result);
                    return documentSnapshots.docs;
                }
            }
        }
    };

    //분류명
    firebase.board = {
        insertOne: async data => {
            try {
                return await addDoc(collection(db, "boardList"), {
                    hidden: false,
                    type: 0,
                    name: "",
                    depth: 1,
                    parent: "",
                    use: true,
                    ...data
                });
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        },
        deleteOne: async id => await deleteDoc(doc(db, "boardList", id)),
        updateOne: async (id, data) => await updateDoc(doc(db, "boardList", id), data),
        list: async () => await getDocs(collection(db, "boardList"))
    }

    //카테고리
    firebase.categories = {
        insertOne: async data => {
            try {
                return await addDoc(collection(db, "categories"), {
                    hidden: false,
                    name: "",
                    use: true,
                    ...data
                });
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        },
        deleteOne: async id => await deleteDoc(doc(db, "categories", id)),
        updateOne: async (id, data) => await updateDoc(doc(db, "categories", id), data),
        list: async () => await getDocs(collection(db, "categories"))
    }

    //저장소
    firebase.storage = {
        getUrl: async fileName => await getDownloadURL(ref(storage, fileName)),
        delete: async fileName => await deleteObject(ref(storage, fileName)),
        upload: async (fileName, file) => await uploadBytes(ref(storage, fileName), file),
        uploadResumable: (fileName, file) => uploadBytesResumable(ref(storage, fileName), file)
    };

    //인증
    firebase.auth = {
        login: async (email, password) => await signInWithEmailAndPassword(auth, email, password),
        logout: async () => await signOut(auth),
        check: async (signInCallback, signOutCallback) => onAuthStateChanged(auth, (user) => {
            if (user) signInCallback(user);
            else signOutCallback();
        }),
        checkAdmin: (callback) => onAuthStateChanged(auth, async (user) => {
            let doc;
            if (user == undefined) return callback(false);
            if ((doc = await getDoc(doc(db, "users", user.uid))) == undefined) return callback(false);
            if (doc.data().level !== 0) return callback(false);
            return callback(true);
        }),
        setAdmin: async data => {
        },
        signup: async (email, password) => await createUserWithEmailAndPassword(auth, email, password)
    }

    //초기화 callback
    if (typeof firebaseLoadCallback == 'function') {
        firebaseLoadCallback();
    }
});

