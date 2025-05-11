// auth.js – One-Click Registration with Firebase (Modular SDK v11.7.1)
// Stores user profiles in Cloud Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Your Firebase config (no databaseURL needed for Firestore)
const firebaseConfig = {
  apiKey:      "AIzaSyBa6rufBv_LnOuPwWrDdDpwMua2n49Hczo",
  authDomain:  "bettingwebsite-6b685.firebaseapp.com",
  projectId:   "bettingwebsite-6b685",
  storageBucket:"bettingwebsite-6b685.appspot.com",
  messagingSenderId:"44929634591",
  appId:       "1:44929634591:web:99d7604a031b4a4f99a02a",
  measurementId:"G-3PLM5LFY6X"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log("✅ auth.js loaded (Firestore)");

document.addEventListener('DOMContentLoaded', () => {
  const countrySpan  = document.querySelector('.ui-field-select-modal-trigger__caption');
  const currencySpan = document.querySelector('.registration-field-select-currency__name');
  const registerBtn  = document.querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase');
  if (!registerBtn) {
    console.error("❌ Register button selector not found.");
    return;
  }

  registerBtn.addEventListener('click', async () => {
    const country  = countrySpan?.textContent.trim()  || 'Unknown';
    const currency = currencySpan?.textContent.trim() || 'Unknown';
    const uidPart  = Math.random().toString(36).slice(2,8);
    const username = `user_${uidPart}`;
    const password = Math.random().toString(36).slice(-8);
    const email    = `${username}@autogen.local`;

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), { username, country, currency });
      window.location.href =
        `redirect.html?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    } catch (err) {
      console.error("Registration error:", err);
      alert("Registration failed: " + err.message);
    }
  });
});
