import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore, collection, setDoc, addDoc, getDocs, getDoc, doc, Timestamp, query, orderBy, getCountFromServer, startAfter, limit, deleteDoc, updateDoc, where, onSnapshot, deleteField, arrayRemove, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBm2NkGGMEo_TN0u7VRgNhZmTvflJlfOzY",
    authDomain: "nemuwiki-f3a72.firebaseapp.com",
    projectId: "nemuwiki-f3a72",
    storageBucket: "nemuwiki-f3a72.appspot.com",
    messagingSenderId: "125964020971",
    appId: "1:125964020971:web:63803427ae9165e43e22ae",
    measurementId: "G-PCFNLEDQ00"
};

const fb_app = initializeApp(firebaseConfig);
const db = initializeFirestore(fb_app, { experimentalForceLongPolling: true });
const auth = getAuth();

window.firebase = {
    db,
    auth,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    Timestamp,
    query,
    orderBy,
    limit,
    where,
    deleteDoc,
    updateDoc,
    arrayRemove,
    arrayUnion,
    listen: onSnapshot,
    deleteField,
    startAfter,
    getCountFromServer,
    setDoc,
    onAuthStateChanged
};

onAuthStateChanged(auth, (user) => {
    window.currentUser = user;
    if (user) {
        console.log("사용자 로그인됨:", user.email);
        window.dispatchEvent(new Event('userLoggedIn'));
    } else {
        console.log("사용자 로그아웃됨");
        window.dispatchEvent(new Event('userLoggedOut'));
    }
});