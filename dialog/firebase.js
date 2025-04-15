import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase configuration (API key is preserved)
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
const auth = getAuth();

// Reference to the "dialog" collection
const dialogCollection = collection(db, "dialog");

// Fetch dialogs from the "dialog" collection
export const fetchDialogs = async () => {
    try {
        const querySnapshot = await getDocs(dialogCollection);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching dialogs:", error);
        throw error;
    }
};

// Add a new dialog to the "dialog" collection
export const addDialog = async (dialogData) => {
    try {
        const docRef = await addDoc(dialogCollection, dialogData);
        return { id: docRef.id, ...dialogData };
    } catch (error) {
        console.error("Error adding dialog:", error);
        throw error;
    }
};

// Update an existing dialog in the "dialog" collection
export const updateDialog = async (id, dialogData) => {
    try {
        const dialogRef = doc(db, "dialog", id);
        await updateDoc(dialogRef, dialogData);
        return { id, ...dialogData };
    } catch (error) {
        console.error("Error updating dialog:", error);
        throw error;
    }
};

// Delete a dialog from the "dialog" collection
export const deleteDialog = async (id) => {
    try {
        const dialogRef = doc(db, "dialog", id);
        await deleteDoc(dialogRef);
        return id;
    } catch (error) {
        console.error("Error deleting dialog:", error);
        throw error;
    }
};