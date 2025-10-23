import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, get, push, remove, update, onValue } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyCzU_SSM-O0ty-qfngk3qknSBDVM21_SFo",
  authDomain: "imh-signal.firebaseapp.com",
  databaseURL: "https://imh-signal-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "imh-signal",
  storageBucket: "imh-signal.firebasestorage.app",
  messagingSenderId: "847623708937",
  appId: "1:847623708937:web:945cccb0d3a660c48b73d8"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

export { database, ref, set, get, push, remove, update, onValue }
