/* =========================================================================
   auth.js – stable “redirect page first” flow
   ========================================================================= */
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

/* ---- Firebase config ---- */
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

/* ---- Router ---- */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === '1xcopy-beautified.html') {
    onAuthStateChanged(auth, user => {
      if (user) {
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        initDashboardReg();
      }
    });

  } else if (page === 'reg-beautified.html') {
    onAuthStateChanged(auth, user => {
      if (user) {
        /* Account already exists (just created) → show creds page */
        window.location.replace('redirect.html');
      } else {
        initRegistration();
      }
    });

  } else if (page === 'redirect.html') {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initRedirect();
      }
    });

  } else if (page === 'logged-1xcopy-beautified.html' ||
             page === 'logged-menu.html') {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initDashboardLog();
      }
    });
  }
});

/* ---- 1) Main (logged‑out) ---- */
function initDashboardReg() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', () => {
      window.location.href = 'reg-beautified.html';
    });
}

/* ---- 2) One‑click registration page ---- */
function initRegistration() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', handleRegister);
}

async function handleRegister() {
  /* Country & currency (two spans with the same class) */
  const captions = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());

  const country  = captions[0] || 'Unknown';
  const currency = captions[1] || 'Unknown';

  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }

  /* Auto‑gen credentials */
  const uidPart  = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email    = `${username}@autogen.local`;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', user.uid), { username, country, currency });

    /* Stash creds so redirect.html can show them */
    sessionStorage.setItem('genUsername', username);
    sessionStorage.setItem('genPassword', password);

    window.location.replace('redirect.html');
  } catch (err) {
    console.error('Registration error:', err);
    alert('Registration failed: ' + err.message);
  }
}

/* ---- 3) Redirect (credentials) page ---- */
function initRedirect() {
  const username = sessionStorage.getItem('genUsername');
  const password = sessionStorage.getItem('genPassword');

  if (!username || !password)
    return window.location.replace('logged-1xcopy-beautified.html');

  document.querySelector('.show-username').textContent = username;
  document.querySelector('.show-password').textContent = password;

  document.querySelector('.show-save-btn')
    ?.addEventListener('click', () => {
      navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
      alert('Credentials copied to clipboard!');
    });

  const backBtn = document.getElementById('b') || document.querySelector('.back');
  backBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('genUsername');
    sessionStorage.removeItem('genPassword');
    window.location.replace('logged-1xcopy-beautified.html');
  });
}

/* ---- 4) Logged‑in pages ---- */
function initDashboardLog() {
  document.querySelectorAll(
    '.navigation-menu-section-item-button.navigation-menu-section-item__link'
  ).forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('log out')) {
      btn.addEventListener('click', () => auth.signOut());
    }
  });
}
