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

/* ───── Firebase config ───── */
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

// keep the session across reloads and restarts
setPersistence(auth, browserLocalPersistence).catch(console.error);

/* ───── Router ───── */
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

  } else if (page === 'logged-1xcopy-beautified.html' ||
             page === 'logged-menu.html') {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initLoggedInPage();
      }
    });
  }
});

/* ───── 1) Logged-out main – “Register” button ───── */
function hookRegisterButton() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', () => {
      window.location.href = 'reg-beautified.html';
    });
}

/* ───── 2) One-click registration page ───── */
function hookOneClickRegister() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', registerUser);
}

async function registerUser() {
  // grab country & currency (two spans share the same class)
  const caps = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());

  const country  = caps[0] || 'Unknown';
  const currency = caps[1] || 'Unknown';

  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }

  // generate credentials
  const uidPart  = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email    = `${username}@autogen.local`;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // save user profile
    await setDoc(doc(db, 'users', user.uid), { username, country, currency });

    // store for modal
    localStorage.setItem('newUserUsername', username);
    localStorage.setItem('newUserPassword', password);

    window.location.replace('logged-1xcopy-beautified.html');
  } catch (err) {
    console.error('Registration error:', err);
    alert('Registration failed: ' + err.message);
  }
}

/* ───── 3) Logged-in dashboard ───── */
function initLoggedInPage() {
  console.log("⚙️ initLoggedInPage() running; newUserUsername=", localStorage.getItem('newUserUsername'));
  // show credential modal once
  const u = localStorage.getItem('newUserUsername');
  const p = localStorage.getItem('newUserPassword');
  if (u) {
    showCredsModal(u, p);
    localStorage.removeItem('newUserUsername');
    localStorage.removeItem('newUserPassword');
  }

  // hook logout buttons
  document.querySelectorAll(
    '.navigation-menu-section-item-button.navigation-menu-section-item__link'
  ).forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('log out')) {
      btn.addEventListener('click', () => auth.signOut());
    }
  });
}

/* ───── modal to display new credentials ───── */
function showCredsModal(username, password) {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7); display:flex;
      align-items:center; justify-content:center;
      z-index:10000; font-family:Arial, sans-serif;
    ">
      <div style="
        background:#fff; padding:2rem; border-radius:8px;
        max-width:360px; width:90%; box-shadow:0 4px 12px rgba(0,0,0,0.3);
        text-align:center;
      ">
        <h2 style="margin-top:0; font-size:1.5rem; color:#333;">
          Your New Account
        </h2>
        <p style="margin:0.5rem 0; font-size:1rem; color:#555;">
          <strong>Username:</strong><br>
          <code style="
            display:inline-block; margin-top:0.25rem; padding:0.2rem 0.4rem;
            background:#f4f4f4; border-radius:4px; font-size:0.95rem;
          ">${username}</code>
        </p>
        <p style="margin:0.5rem 0 1.5rem; font-size:1rem; color:#555;">
          <strong>Password:</strong><br>
          <code style="
            display:inline-block; margin-top:0.25rem; padding:0.2rem 0.4rem;
            background:#f4f4f4; border-radius:4px; font-size:0.95rem;
          ">${password}</code>
        </p>
        <div style="display:flex; gap:0.5rem; justify-content:center;">
          <button id="saveCredsBtn" style="
            flex:1; padding:0.6rem 0; border:none; border-radius:4px;
            background:#28a745; color:#fff; font-size:1rem; cursor:pointer;
          ">
            Save Details
          </button>
          <button id="closeCredModal" style="
            flex:1; padding:0.6rem 0; border:1px solid #ccc; border-radius:4px;
            background:#fff; color:#333; font-size:1rem; cursor:pointer;
          ">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // copy credentials
  modal.querySelector('#saveCredsBtn').onclick = () => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`)
      .then(() => alert('Credentials copied to clipboard!'))
      .catch(() => alert('Copy failed—please copy manually.'));
  };

  // close the modal
  modal.querySelector('#closeCredModal').onclick = () => {
    document.body.removeChild(modal);
  };
}
