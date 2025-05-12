// auth.js  — full file with final selectors
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

setPersistence(auth, browserLocalPersistence).catch(console.error);

/* ───── File‑name router ───── */
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
        window.location.replace('logged-1xcopy-beautified.html');
      } else {
        initRegistration();
      }
    });

  } else if (page === 'redirect.html') {                            // creds page
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

/* ───── 1) logged‑out main – Register button just navigates ───── */
function initDashboardReg() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', () => {
      window.location.href = 'reg-beautified.html';
    });
}

/* ───── 2) reg‑beautified.html – one‑click registration ───── */
function initRegistration() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', handleRegister);
}

async function handleRegister() {
  /* Grab country & currency (both use same class) */
  const captions = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());

  const country  = captions[0] || 'Unknown';
  const currency = captions[1] || 'Unknown';

  // Optional: force a currency choice
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

    await setDoc(doc(db, 'users', user.uid), {
      username,
      country,
      currency
    });

    sessionStorage.setItem('genUsername', username);
    sessionStorage.setItem('genPassword', password);
    window.location.replace('redirect.html');
  } catch (err) {
    console.error('Registration error:', err);
    alert('Registration failed: ' + err.message);
  }
}

/* ───── 3) redirect.html – show creds + buttons ───── */
function initRedirect() {
  const username = sessionStorage.getItem('genUsername');
  const password = sessionStorage.getItem('genPassword');

  if (!username || !password)
    return window.location.replace('1xcopy-beautified.html');

  document.querySelector('.show-username').textContent = username;
  document.querySelector('.show-password').textContent = password;

  document.querySelector('.show-save-btn')
    ?.addEventListener('click', () => {
      navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
      alert('Credentials copied to clipboard!');
    });

  /* Go‑Back button – id="b" or class="back" */
  const backBtn = document.getElementById('b') || document.querySelector('.back');
  backBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('genUsername');
    sessionStorage.removeItem('genPassword');
    window.location.replace('logged-1xcopy-beautified.html');
  });
}

/* ───── 4) logged‑in pages – Log‑out hook ───── */
function initDashboardLog() {
  /* match any nav button whose visible text includes “log out” */
  document.querySelectorAll(
    '.navigation-menu-section-item-button.navigation-menu-section-item__link'
  ).forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('log out')) {
      btn.addEventListener('click', () => auth.signOut());
    }
  });
}
