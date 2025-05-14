// auth.js – final flow: one-click signup → dashboard → modal once

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

/* ───── Firebase init ───── */
const firebaseConfig = {
  apiKey:            "AIzaSyBa6rufBv_LnOuPwWrDdDpwMua2n49Hczo",
  authDomain:        "bettingwebsite-6b685.firebaseapp.com",
  projectId:         "bettingwebsite-6b685",
  storageBucket:     "bettingwebsite-6b685.appspot.com",
  messagingSenderId: "44929634591",
  appId:             "1:44929634591:web:99d7604a031b4a4f99a02a",
  measurementId:     "G-3PLM5LFY6X"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

/* ───── Page router ───── */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === '1xcopy-beautified.html') {
    // logged-out main
    onAuthStateChanged(auth, user => {
      if (user) {
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        hookMainRegister();
      }
    });

  } else if (page === 'reg-beautified.html') {
    // one-click signup page
    onAuthStateChanged(auth, user => {
      if (user) {
        // if somehow already signed in
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        hookDirectRegister();
      }
    });

  } else if (page === 'logged-1xcopy-beautified.html' ||
             page === 'logged-menu.html') {
    // dashboard pages
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initDashboard();
      }
    });
  }
});

/* ───── 1) Logged-out main → go to reg page ───── */
function hookMainRegister() {
  const btn = document.querySelector(
    'button.ui-button--theme-accent.ui-button--block.ui-button--uppercase'
  );
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = 'reg-beautified.html';
  });
}

/* ───── 2) One-click registration ───── */
function hookDirectRegister() {
  const btn = document.querySelector(
    'button.ui-button--theme-accent.ui-button--block.ui-button--uppercase'
  );
  if (!btn) return;
  btn.addEventListener('click', async e => {
    e.preventDefault();
    await registerUser();
  });
}

async function registerUser() {
  // 1) Grab selected country & currency
  const captions = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());
  const country  = captions[0] || 'Unknown';
  const currency = captions[1] || 'Unknown';
  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }

  // 2) Generate credentials
  const uidPart  = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email    = `${username}@autogen.local`;

  try {
    // 3) Create Firebase Auth user
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // 4) Save profile in Firestore
    await setDoc(doc(db, 'users', user.uid), { username, country, currency });

    // 5) Stash for modal
    localStorage.setItem('newUserUsername', username);
    localStorage.setItem('newUserPassword', password);

    // 6) Go to dashboard
    window.location.replace('logged-1xcopy-beautified.html');
  } catch (err) {
    console.error('Registration failed:', err);
    alert('Registration error: ' + err.message);
  }
}

/* ───── 3) Dashboard init ───── */
function initDashboard() {
  // A) Show modal once if creds exist
  const u = localStorage.getItem('newUserUsername');
  const p = localStorage.getItem('newUserPassword');
  if (u && p) {
    showCredsModal(u, p);
    localStorage.removeItem('newUserUsername');
    localStorage.removeItem('newUserPassword');
  }

  // B) Hook up logout
  document.querySelectorAll(
    '.navigation-menu-section-item-button.navigation-menu-section-item__link'
  ).forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('log out')) {
      btn.addEventListener('click', () => auth.signOut());
    }
  });
}

/* ───── Modal for credentials ───── */
function showCredsModal(username, password) {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7); display:flex;
      align-items:center; justify-content:center;
      z-index:9999; font-family:Arial,sans-serif;
    ">
      <div style="
        background:#fff; padding:2rem; border-radius:8px;
        max-width:360px; width:90%; box-shadow:0 4px 12px rgba(0,0,0,0.3);
        text-align:center;
      ">
        <h2 style="margin:0 0 1rem; font-size:1.5rem; color:#333;">
          Your New Account
        </h2>
        <p style="margin:0.5rem 0; color:#555;">
          <strong>Username:</strong><br>
          <code style="
            display:inline-block; padding:0.2rem 0.4rem;
            background:#f4f4f4; border-radius:4px;
          ">${username}</code>
        </p>
        <p style="margin:0.5rem 0 1.5rem; color:#555;">
          <strong>Password:</strong><br>
          <code style="
            display:inline-block; padding:0.2rem 0.4rem;
            background:#f4f4f4; border-radius:4px;
          ">${password}</code>
        </p>
        <div style="display:flex; gap:0.5rem; justify-content:center;">
          <button id="saveCredsBtn" style="
            flex:1; padding:0.6rem; background:#28a745; color:#fff;
            border:none; border-radius:4px; cursor:pointer;
          ">Save Details</button>
          <button id="closeCredModal" style="
            flex:1; padding:0.6rem; background:#fff; color:#333;
            border:1px solid #ccc; border-radius:4px; cursor:pointer;
          ">Go Back</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#saveCredsBtn').onclick = () => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`)
      .then(() => alert('Credentials copied to clipboard!'))
      .catch(() => alert('Copy failed—please copy manually.'));
  };
  modal.querySelector('#closeCredModal').onclick = () => {
    document.body.removeChild(modal);
  };
}
