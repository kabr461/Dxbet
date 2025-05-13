/* =========================================================================
   auth.js  –  May 2025 build  •  One‑click signup + persistent login flow
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

/* ------------- 1. Firebase config (must match your project) ------------- */
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

/* Keep the session across reloads / browser restarts */
setPersistence(auth, browserLocalPersistence).catch(console.error);

/* ------------- 2. Page‑level router ------------- */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === '1xcopy-beautified.html') {                          // logged‑out main
    onAuthStateChanged(auth, user => {
      if (user) {
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        initDashboardReg();
      }
    });

  } else if (page === 'reg-beautified.html') {                      // one‑click page
    onAuthStateChanged(auth, user => {
      if (user) {
        /* Already signed in (was just created) → open logged page */
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        initRegistration();
      }
    });

  } else if (page === 'redirect.html') {                            // creds overlay
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initRedirect();
      }
    });

  } else if (page === 'logged-1xcopy-beautified.html' ||
             page === 'logged-menu.html') {                         // logged‑in pages
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initDashboardLog();
      }
    });
  }
});

/* ------------- 3. 1xcopy‑beautified.html — “Register” button ------------- */
function initDashboardReg() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', () => {
      window.location.href = 'reg-beautified.html';
    });
}

/* ------------- 4. reg‑beautified.html — one‑click signup ------------- */
function initRegistration() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', handleRegister);
}

async function handleRegister() {
  /* Grab country + currency (same class, country appears first) */
  const captions = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());

  const country  = captions[0] || 'Unknown';
  const currency = captions[1] || 'Unknown';

  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }

  /* Auto‑generate credentials */
  const uidPart  = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email    = `${username}@autogen.local`;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', user.uid), { username, country, currency });

    /* Stash creds so the logged page knows to open redirect.html */
    sessionStorage.setItem('genUsername', username);
    sessionStorage.setItem('genPassword', password);

    /* Go directly to the logged‑in dashboard */
    window.location.replace('logged-1xcopy-beautified.html');
  } catch (err) {
    console.error('Registration error:', err);
    alert('Registration failed: ' + err.message);
  }
}

/* ------------- 5. redirect.html — creds overlay ------------- */
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

  /* Go‑Back button (id="b" or class="back") */
  const backBtn = document.getElementById('b') || document.querySelector('.back');
  backBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('genUsername');
    sessionStorage.removeItem('genPassword');
    window.location.replace('logged-1xcopy-beautified.html');
  });
}

/* ------------- 6. logged‑in pages — Log‑out + overlay trigger ------------- */
function initDashboardLog() {
  /* Show redirect.html overlay *once* if creds still in sessionStorage */
  if (sessionStorage.getItem('genUsername') && sessionStorage.getItem('genPassword')) {
    /* Let the page paint first, then swap */
    requestAnimationFrame(() => {
      window.location.href = 'redirect.html';
    });
  }

  /* Hook up all “Log out” buttons */
  document.querySelectorAll(
    '.navigation-menu-section-item-button.navigation-menu-section-item__link'
  ).forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('log out')) {
      btn.addEventListener('click', () => auth.signOut());
    }
  });
}
