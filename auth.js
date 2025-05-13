// auth.js – consolidated one-click signup + modal credential overlay
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

/* Firebase config */
const firebaseConfig = {
  apiKey:            "AIzaSyBa6rufBv_LnOuPwWrDdDpwMua2n49Hczo",
  authDomain:        "bettingwebsite-6b685.firebaseapp.com",
  projectId:         "bettingwebsite-6b685",
  storageBucket:     "bettingwebsite-6b685.appspot.com",
  messagingSenderId: "44929634591",
  appId:             "1:44929634591:web:99d7604a031b4a4f99a02a",
  measurementId:     "G-3PLM5LFY6X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Persist session
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Router
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === '1xcopy-beautified.html') {
    onAuthStateChanged(auth, user => {
      if (user) {
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        hookRegisterButton();
      }
    });
  } else if (page === 'reg-beautified.html') {
    onAuthStateChanged(auth, user => {
      if (user) {
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        hookOneClickRegister();
      }
    });
  } else if (page === 'logged-1xcopy-beautified.html' || page === 'logged-menu.html') {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initLoggedInPage();
      }
    });
  }
});

// Main logged-out page
function hookRegisterButton() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', () => {
      window.location.href = 'reg-beautified.html';
    });
}

// One-click registration page
function hookOneClickRegister() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', registerUser);
}

async function registerUser() {
  // Grab country & currency
  const caps = Array.from(document.querySelectorAll('.ui-field-select-modal-trigger__caption'))
                 .map(el => el.textContent.trim());
  const country = caps[0] || 'Unknown';
  const currency = caps[1] || 'Unknown';
  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }
  // Generate creds
  const uidPart = Math.random().toString(36).slice(2,8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email = `${username}@autogen.local`;
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    // Save profile
    await setDoc(doc(db, 'users', user.uid), { username, country, currency });
    // Store for modal
    localStorage.setItem('newUserUsername', username);
    localStorage.setItem('newUserPassword', password);
    window.location.replace('logged-1xcopy-beautified.html');
  } catch(err) {
    console.error('Registration error:', err);
    alert('Registration failed: ' + err.message);
  }
}

// Dashboard logged-in page
function initLoggedInPage() {
  // Show creds modal once
  const u = localStorage.getItem('newUserUsername');
  const p = localStorage.getItem('newUserPassword');
  if (u) {
    showCredsModal(u, p);
    localStorage.removeItem('newUserUsername');
    localStorage.removeItem('newUserPassword');
  }
  // Logout hook
  document.querySelectorAll('.navigation-menu-section-item-button.navigation-menu-section-item__link')
    .forEach(btn => {
      if (btn.textContent.trim().toLowerCase().includes('log out')) {
        btn.addEventListener('click', () => auth.signOut());
      }
    });
}

// Show modal
function showCredsModal(username, password) {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.6);display:flex;
      align-items:center;justify-content:center;
      z-index:9999;
    ">
      <div style="
        background:#fff;padding:1.5rem;border-radius:8px;
        max-width:320px;text-align:center;font-family:sans-serif;
      ">
        <h2>Your new account</h2>
        <p><strong>Username:</strong> <code>${username}</code></p>
        <p><strong>Password:</strong> <code>${password}</code></p>
        <button id="closeCredModal" style="
          margin-top:1rem;padding:0.5rem 1rem;
          border:none;background:#007bff;color:#fff;
          border-radius:4px;cursor:pointer;
        ">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#closeCredModal').onclick = () => {
    document.body.removeChild(modal);
  };
}
