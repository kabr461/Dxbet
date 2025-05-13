/* =========================================================================
   auth.js  –  One‑click signup → dashboard → credential sheet (once)
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

  } else if (page === 'redirect.html') {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.replace('1xcopy-beautified.html');
      } else {
        initRedirectPage();
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

/* ---- 1. Logged‑out main ---- */
function hookRegisterButton() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', () => {
      window.location.href = 'reg-beautified.html';
    });
}

/* ---- 2. One‑click registration page ---- */
function hookOneClickRegister() {
  document
    .querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase')
    ?.addEventListener('click', registerUser);
}

async function registerUser() {
  /* Get country & currency (same class) */
  const text = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());

  const country  = text[0] || 'Unknown';
  const currency = text[1] || 'Unknown';

  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }

  const uidPart  = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email    = `${username}@autogen.local`;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', user.uid), { username, country, currency });

    /* Store data for one‑time redirect sheet (localStorage = origin‑wide) */
    localStorage.setItem('newUserUsername', username);
    localStorage.setItem('newUserPassword', password);
    localStorage.setItem('showCredSheet', 'yes');

    window.location.replace('logged-1xcopy-beautified.html');
  } catch (err) {
    console.error('Registration error:', err);
    alert('Registration failed: ' + err.message);
  }
}

/* ---- 3. logged-1xcopy-beautified.html ---- */
function initLoggedInPage() {
  /* Only immediately after signup */
  if (localStorage.getItem('showCredSheet') === 'yes') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.location.href = 'redirect.html';
      }, 50);        // wait one paint so the dashboard flashes first
    });
  }

  /* Wire all Log‑out buttons and wipe flags */
  document.querySelectorAll(
    '.navigation-menu-section-item-button.navigation-menu-section-item__link'
  ).forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes('log out')) {
      btn.addEventListener('click', () => {
        ['newUserUsername', 'newUserPassword', 'showCredSheet']
          .forEach(key => localStorage.removeItem(key));
        auth.signOut();
      });
    }
  });
}

/* ---- 4. redirect.html (credential sheet) ---- */
function initRedirectPage() {
  const username = localStorage.getItem('newUserUsername') || '';
  const password = localStorage.getItem('newUserPassword') || '';

  /* Flag consumed so this page never auto‑opens again */
  localStorage.setItem('showCredSheet', 'no');

  document.querySelector('.show-username').textContent = username;
  document.querySelector('.show-password').textContent = password;

  document.querySelector('.show-save-btn')
    ?.addEventListener('click', () => {
      navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
      alert('Credentials copied to clipboard!');
    });

  const backBtn = document.getElementById('b') || document.querySelector('.back');
  backBtn?.addEventListener('click', () => {
    window.location.replace('logged-1xcopy-beautified.html');
  });
}
