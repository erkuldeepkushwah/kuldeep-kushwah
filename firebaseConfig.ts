import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDdJTg0SF66ksdSaJnrWH8dd0ei15M6yoA",
  authDomain: "paypoint-e14c9.firebaseapp.com",
  databaseURL: "https://paypoint-e14c9-default-rtdb.firebaseio.com",
  projectId: "paypoint-e14c9",
  storageBucket: "paypoint-e14c9.firebasestorage.app",
  messagingSenderId: "970332210587",
  appId: "1:970332210587:web:10bedd6bf179372cc78d3e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);