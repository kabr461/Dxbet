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
  apiKey: "AIzaSyBa6rufBv_LnOuPwWrDdDpwMua2n49Hczo",
  authDomain: "bettingwebsite-6b685.firebaseapp.com",
  projectId: "bettingwebsite-6b685",
  storageBucket: "bettingwebsite-6b685.appspot.com",
  messagingSenderId: "44929634591",
  appId: "1:44929634591:web:99d7604a031b4a4f99a02a",
  measurementId: "G-3PLM5LFY6X"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
// expose for console debugging:
window.__AUTH__ = auth;
window.__DB__ = db;

/* ───── Debounce utility ───── */
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

/* ───── Page router ───── */
document.addEventListener('DOMContentLoaded', () => {
  // slight delay to ensure all Firebase modules are up
  setTimeout(() => {
    const page = window.location.pathname.split('/').pop();

    if (page === '1xcopy-beautified.html') {
      onAuthStateChanged(auth, user => {
        if (user) window.location.replace('logged-1xcopy-beautified.html');
        else hookMainRegister();
      });
    } else if (page === 'reg-beautified.html') {
      // ✂️ remove auto-redirect here so registerUser can finish
      hookDirectRegister();
    } else if (page === 'logged-1xcopy-beautified.html' || page === 'logged-menu.html') {
      onAuthStateChanged(auth, user => {
        if (!user) window.location.replace('1xcopy-beautified.html');
        else initDashboard();
      });
    }
  }, 300);
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
  btn.addEventListener('click', debounce(async e => {
    e.preventDefault();
    await registerUser();
  }, 1000));
}

async function registerUser() {
  console.log('▶ registerUser started');
  // small pause to avoid firing too early
  await new Promise(res => setTimeout(res, 500));

  const captions = Array.from(
    document.querySelectorAll('.ui-field-select-modal-trigger__caption')
  ).map(el => el.textContent.trim());
  const country = captions[0] || 'Unknown';
  const currency = captions[1] || 'Unknown';
  if (!currency || currency === 'Select currency') {
    return alert('Please choose a currency first.');
  }

  const uidPart = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
 const email = `user_${uidPart}@autogen.local`;


  let user;
  // retry up to 3 times on network errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Attempt ${attempt}: creating user…`);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      user = result.user;
      console.log('✅ User created with UID:', user.uid);
      break;
    } catch (err) {
      console.warn(`⚠️ createUser failed (attempt ${attempt}):`, err.code, err.message);
      if (err.code === 'auth/network-request-failed' && attempt < 3) {
        await new Promise(res => setTimeout(res, 1000));
      } else {
        return alert('Registration error: ' + err.message);
      }
    }
  }

  // store creds locally for modal
  localStorage.setItem('newUserUsername', username);
  localStorage.setItem('newUserPassword', password);

  // ensure token is fully synced on Firebase servers
  try {
    await auth.currentUser.getIdToken(true);
  } catch (_) {
    // ignore token-refresh failures
  }

  // write profile
  try {
    await setDoc(doc(db, 'users', user.uid), { username, country, currency }, { merge: true });
    console.log('✅ Profile saved to Firestore');
  } catch (firestoreErr) {
    console.error('❌ Firestore write failed:', firestoreErr.code, firestoreErr.message);
    return alert('Failed to save profile: ' + firestoreErr.message);
  }

  // redirect
  window.location.replace('logged-1xcopy-beautified.html');
}

/* ───── 3) Dashboard init ───── */
function initDashboard() {
  const u = localStorage.getItem('newUserUsername');
  const p = localStorage.getItem('newUserPassword');
  console.log('Dashboard init — creds in localStorage:', u, p);

  if (u && p) {
    showCredsModal(u, p);
    localStorage.removeItem('newUserUsername');
    localStorage.removeItem('newUserPassword');
  }

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
      z-index:9999; font-family:Arial,sans-serif;">
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

  modal.querySelector('#saveCredsBtn').onclick = () =>
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`)
      .then(() => alert('Credentials copied to clipboard!'))
      .catch(() => alert('Copy failed—please copy manually.'));

  modal.querySelector('#closeCredModal').onclick = () =>
    document.body.removeChild(modal);
}
