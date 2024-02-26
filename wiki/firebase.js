// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, Timestamp, query, orderBy, getCountFromServer, startAfter, startAt, limit, deleteDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
    firebase.post = {
        random: async () => {
            let postRef = collection(db, "postList");
            let count = Math.min((await getCountFromServer(postRef)).data().count, 100);
            let random = Math.round(Math.random() * (count - 1));
            let result = await getDocs(query(
                collection(db, "postList"),
                orderBy('timestamp'),
                limit(count)
            ));
            return result.docs[random].id;
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
        list: async (keyword = '', field = 'title', hidden = false) => {
            let query_result = query(
                collection(db, "postList"),
                where('hidden', '==', hidden),
                where(field, '>=', keyword),
                where(field, '<=', keyword + "\uf8ff"),
                limit(25)
            );
            let documentSnapshots = await getDocs(query_result);

            return {
                docs: documentSnapshots.docs,
                getNext: async (docs = documentSnapshots.docs) => {
                    query_result = query(
                        collection(db, "postList"),
                        where('hidden', '==', hidden),
                        where(field, '>=', keyword),
                        where(field, '<=', keyword + "\uf8ff"),
                        startAfter(docs[docs.length - 1]),
                        limit(25));
                    documentSnapshots = await getDocs(query_result);
                    return documentSnapshots.docs;
                }
            }
        }
    };

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

    firebase.storage = {
        getUrl: async fileName => await getDownloadURL(ref(storage, fileName)),
        delete: async fileName => await deleteObject(ref(storage, fileName)),
        upload: async (fileName, file) => await uploadBytes(ref(storage, fileName), file),
        uploadResumable: (fileName, file) => uploadBytesResumable(ref(storage, fileName), file)
    };

    firebase.auth = {
        login: async (email, password) => await signInWithEmailAndPassword(auth, email, password),
        logout: async () => await signOut(auth),
        check: async (signInCallback, signOutCallback) => onAuthStateChanged(auth, (user) => {
            if (user) {
                signInCallback(user);
            } else {
                signOutCallback();
            }
        }),
        signup: async (email, password) => await createUserWithEmailAndPassword(auth, email, password)
    }

    let querySnapshot;

    if (typeof input_menu != 'undefined') {
        querySnapshot = await firebase.board.list();
        querySnapshot.forEach((doc) => addSuggest(doc.data(), input_menu));
    }

    if (typeof input_categories != 'undefined') {
        querySnapshot = await firebase.categories.list();
        querySnapshot.forEach((doc) => addSuggest(doc.data(), input_categories));
    }

    if (typeof firebaseLoadCallback == 'function') {
        firebaseLoadCallback();
    }
});

