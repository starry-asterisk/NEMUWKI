// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, Timestamp, query, orderBy, startAfter, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

window.addEventListener('load', async function () {
    firebase.post = {
        insertOne: async data => {
            try {
                if (data && data.timestamp) data.timestamp = Timestamp.fromDate(data.timestamp);
                const docRef = await addDoc(collection(db, "postList"), {
                    board_name: "",
                    category: "",
                    title: "",
                    contents: [],
                    hidden: false,
                    use: true,
                    timestamp: Timestamp.fromDate(new Date()),
                    ...data
                });
                console.log("Document written with ID: ", docRef.id);
                return docRef;
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        },
        list: async () => {
            let query_result = query(collection(db, "postList"), orderBy("timestamp"), limit(25));
            let documentSnapshots = await getDocs(query_result);

            return {
                docs: documentSnapshots.docs,
                getNext: async () => {
                    query_result = query(collection(db, "postList"),
                        orderBy("timestamp"),
                        startAfter(documentSnapshots.docs[documentSnapshots.docs.length - 1]),
                        limit(25));
                    documentSnapshots = await getDocs(query_result);
                    return documentSnapshots.docs;
                }
            }
        }
    };

    firebase.storage = {
        getUrl: async fileName => await getDownloadURL(ref(storage, fileName)),
        delete: async fileName => await deleteObject(ref(storage, fileName)),
        upload: async (fileName, file) => await uploadBytes(ref(storage, fileName), file),
        uploadResumable: (fileName, file) => uploadBytesResumable(ref(storage, fileName), file)
    };

    let querySnapshot;

    if(typeof input_menu != 'undefined'){
        querySnapshot = await getDocs(collection(db, "boardList"));
        querySnapshot.forEach((doc) => addSuggest(doc.data(), input_menu));
    }

    if(typeof input_categories != 'undefined'){
        querySnapshot = await getDocs(collection(db, "categories"));
        querySnapshot.forEach((doc) => addSuggest(doc.data(), input_categories));
    }

    let {docs, getNext} = await firebase.post.list();
    for(let doc of docs) {
        let data = doc.data();
        console.log(data);
    }
});

