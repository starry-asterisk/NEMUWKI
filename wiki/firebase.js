// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

window.addEventListener('load', async function () {

    let querySnapshot = await getDocs(collection(db, "boardList"));
    querySnapshot.forEach((doc) => addSuggest(doc.data(), input_menu));

    querySnapshot = await getDocs(collection(db, "categories"));
    querySnapshot.forEach((doc) => addSuggest(doc.data(), input_categories));

    firebase.post = {
        insertOne: async data => {
            try {
                const docRef = await addDoc(collection(db, "postList"), {
                    board_name: "",
                    category: "",
                    title: "",
                    contents: [],
                    hidden: false,
                    use: true,
                    timestamp: {
                        nanoseconds:770000000,
                        seconds:1708533677
                    },
                    ...data
                });
                console.log("Document written with ID: ", docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }
    }

});

