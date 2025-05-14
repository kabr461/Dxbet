// auth.js – Debug build with preventDefault and detailed logs

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

/* ─── Module Load ─── */
console.log("✅ auth.js loaded on", window.location.pathname);

/* ─── Firebase Init ─── */
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
setPersistence(auth, browserLocalPersistence)
  .catch(err => console.error("❌ setPersistence:", err));

/* ─── Router ─── */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  console.log("📄 DOMContentLoaded, page:", page);

  if (page === '1xcopy-beautified.html') {
    onAuthStateChanged(auth, user => {
      console.log("👤 Main onAuthStateChanged:", user);
      user
        ? window.location.replace('logged-1xcopy-beautified.html')
        : hookRegisterButton();
    });

  } else if (page === 'reg-beautified.html') {
    onAuthStateChanged(auth, user => {
      console.log("👤 Reg page onAuthStateChanged:", user);
      user
        ? window.location.replace('logged-1xcopy-beautified.html')
        : hookOneClickRegister();
    });

  } else if (page === 'logged-1xcopy-beautified.html' ||
             page === 'logged-menu.html') {
    onAuthStateChanged(auth, user => {
      console.log("👤 Dashboard onAuthStateChanged:", user);
      user
        ? initLoggedInPage()
        : window.location.replace('1xcopy-beautified.html');
    });
  }
});

/* ─── 1) Main page “Register” hook ─── */
function hookRegisterButton() {
  console.log("🔎 hookRegisterButton()");
  const btn = document.querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase');
  console.log("   found Main Register btn:", btn);
  if (!btn) return console.error("❌ Main Register button not found!");
  btn.addEventListener('click', e => {
    e.preventDefault();
    console.log("➡️ go to reg-beautified.html");
    window.location.href = 'reg-beautified.html';
  });
}

/* ─── 2) One-click registration hook ─── */
function hookOneClickRegister() {
  console.log("🔎 hookOneClickRegister()");
  let btn = document.querySelector('button.ui-button--theme-accent.ui-button--block.ui-button--uppercase');
  if (!btn) {
    btn = Array.from(document.querySelectorAll('button'))
               .find(b => b.textContent.trim().toLowerCase() === 'register');
  }
  console.log("   found Reg-page button:", btn);
  if (!btn) return console.error("❌ Reg-page button not found!");
  btn.addEventListener('click', registerUser);
}

async function registerUser(e) {
  e.preventDefault();
  console.log("🔎 registerUser() called");

  const caps = Array.from(document.querySelectorAll('.ui-field-select-modal-trigger__caption'))
                    .map(el => el.textContent.trim());
  console.log("   captions:", caps);

  const country  = caps[0] || 'Unknown';
  const currency = caps[1] || 'Unknown';
  console.log(`   country=${country}, currency=${currency}`);

  if (!currency || currency === 'Select currency') {
    console.warn("⚠️ Currency not selected");
    return alert('Please choose a currency first.');
  }

  const uidPart  = Math.random().toString(36).slice(2, 8);
  const username = `user_${uidPart}`;
  const password = Math.random().toString(36).slice(-8);
  const email    = `${username}@autogen.local`;
  console.log(`   creds: ${username}/${password} → ${email}`);

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Auth user created uid=", user.uid);

    await setDoc(doc(db, 'users', user.uid), { username, country, currency });
    console.log("✅ Firestore saved profile");

    console.log("🔒 Storing creds to localStorage");
    localStorage.setItem('newUserUsername', username);
    localStorage.setItem('newUserPassword', password);

    console.log("➡️ Redirecting to dashboard");
    window.location.replace('logged-1xcopy-beautified.html');
  } catch (err) {
    console.error("❌ registerUser error:", err);
    alert('Registration failed: ' + err.message);
  }
}

/* ─── 3) Dashboard – show modal if creds are present ─── */
function initLoggedInPage() {
  console.log("⚙️ initLoggedInPage(); newUserUsername=", localStorage.getItem('newUserUsername'));
  const u = localStorage.getItem('newUserUsername');
  const p = localStorage.getItem('newUserPassword');
  if (u) {
    showCredsModal(u, p);
    localStorage.removeItem('newUserUsername');
    localStorage.removeItem('newUserPassword');
  }

  document.querySelectorAll('.navigation-menu-section-item-button.navigation-menu-section-item__link')
    .forEach(btn => {
      if (btn.textContent.trim().toLowerCase().includes('log out')) {
        btn.addEventListener('click', () => {
          console.log("🔒 Logging out");
          auth.signOut();
        });
      }
    });
}

/* ─── Modal overlay ─── */
function showCredsModal(username, password) {
  console.log("🔔 showCredsModal()", username, password);
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
        <h2 style="margin-top:0; font-size:1.5rem; color:#333;">Your New Account</h2>
        <p style="margin:0.5rem 0; color:#555;"><strong>Username:</strong><br>
          <code style="
            display:inline-block; padding:0.2rem 0.4rem;
            background:#f4f4f4; border-radius:4px;
          ">${username}</code>
        </p>
        <p style="margin:0.5rem 0 1.5rem; color:#555;"><strong>Password:</strong><br>
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
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Copy failed.'));
  };
  modal.querySelector('#closeCredModal').onclick = () => {
    document.body.removeChild(modal);
  };
}
