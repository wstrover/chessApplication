// firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

/*
const firebaseConfig = {
    apiKey: "AIzaSyDWiLq2L1uOsQBXETELr_WxWgbLy7IVoSI",
    authDomain: "diss-proper.firebaseapp.com",
    projectId: "diss-proper",
    storageBucket: "diss-proper.appspot.com",
    messagingSenderId: "990620663210",
    appId: "1:990620663210:web:fac1db8c001d4f53f63fd3",
    measurementId: "G-Y38VGYRTCL"
};
*/
/*
const firebaseConfig = {
    apiKey: "AIzaSyDcSRq_3VI-YAjRNJzeU4_QWsLPmiX-cWg",
    authDomain: "diss-firebase-2.firebaseapp.com",
    projectId: "diss-firebase-2",
    storageBucket: "diss-firebase-2.appspot.com",
    messagingSenderId: "44967268206",
    appId: "1:44967268206:web:2d228743eaed15c333bb7f",
    measurementId: "G-72KZHGLKPV"
};
*/

const firebaseConfig = {
    apiKey: "AIzaSyBN26B5g3spMe3svD89Ket_uL7s5DTTiT8",
    authDomain: "diss-3.firebaseapp.com",
    projectId: "diss-3",
    storageBucket: "diss-3.appspot.com",
    messagingSenderId: "602021646645",
    appId: "1:602021646645:web:a7fa2658f9d45577647c7c",
    measurementId: "G-XX0ZPYYWEZ",
    databaseURL: 'https://diss-3-default-rtdb.europe-west1.firebasedatabase.app'
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
//export const auth = getAuth(app);
//const analytics = getAnalytics(app);
const db = getFirestore(app);
const realtimeDB = getDatabase(app);

export { realtimeDB }
export { db };

