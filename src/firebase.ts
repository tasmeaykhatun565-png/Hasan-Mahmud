import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnuSxDQluYtsWTOLVz0T8IvvgqXrBBhMg",
  authDomain: "onyx-option.firebaseapp.com",
  projectId: "onyx-option",
  storageBucket: "onyx-option.firebasestorage.app",
  messagingSenderId: "205594793018",
  appId: "1:205594793018:web:030da02c40d911a419d103",
  measurementId: "G-PPMBYJHXLS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
