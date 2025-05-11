// auth.js – Phone Registration with Firebase & Auto-Generated Credentials
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// ─── Your Firebase config ─────────────────────────────────────────────────
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

console.log("✅ auth.js loaded (Phone flow)");

// ─── Helper: Create user via email/pass + save profile ─────────────────────
async function registerEmailUser(email, password, profile) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', user.uid), profile);
  return user;
}

// ─── Timer Utility ─────────────────────────────────────────────────────────
function formatTimer(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2,'0');
  const s = String(sec % 60).padStart(2,'0');
  return `${m}:${s}`;
}

// ─── Main Logic ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const countryCodeSelect = document.getElementById('countryCodeSelect');
  const phoneInput        = document.getElementById('phoneNumberInput');
  const sendOtpBtn        = document.getElementById('sendOtpBtn');

  const otpContainer      = document.getElementById('otpContainer');
  const resendOtpBtn      = document.getElementById('resendOtpBtn');
  const otpTimerSpan      = document.getElementById('otpTimer');
  const otpBoxes          = [
    document.getElementById('otp1'),
    document.getElementById('otp2'),
    document.getElementById('otp3'),
    document.getElementById('otp4'),
    document.getElementById('otp5')
  ];
  const currencySelect    = document.getElementById('currencySelect');
  const phoneRegisterBtn  = document.getElementById('phoneRegisterBtn');

  // Invisible reCAPTCHA
  const recaptcha = new RecaptchaVerifier('recaptcha-container',{size:'invisible'},auth);

  let confirmationResult = null;
  let countdownInterval = null;

  function startCountdown(seconds) {
    let remaining = seconds;
    resendOtpBtn.disabled = true;
    otpTimerSpan.textContent = formatTimer(remaining);
    countdownInterval = setInterval(() => {
      remaining--;
      otpTimerSpan.textContent = formatTimer(remaining);
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        resendOtpBtn.disabled = false;
        otpTimerSpan.textContent = '';
      }
    }, 1000);
  }

  // 1) Send OTP
  sendOtpBtn.addEventListener('click', () => {
    const raw = phoneInput.value.replace(/\D/g,'');
    if (!/^\d{10,15}$/.test(raw)) {
      return alert("Enter a valid phone number (10–15 digits).");
    }
    const fullPhone = countryCodeSelect.value + raw;
    signInWithPhoneNumber(auth, fullPhone, recaptcha)
      .then(res => {
        confirmationResult = res;
        otpContainer.style.display = 'block';
        phoneInput.disabled = sendOtpBtn.disabled = true;
        startCountdown(180);  // 3 minutes
        otpBoxes[0].focus();
        alert("OTP sent to " + fullPhone);
      })
      .catch(err => {
        console.error("OTP send failed:", err);
        alert("Failed to send OTP: " + err.message);
      });
  });

  // 2) Resend OTP
  resendOtpBtn.addEventListener('click', () => {
    const raw = phoneInput.value.replace(/\D/g,'');
    const fullPhone = countryCodeSelect.value + raw;
    signInWithPhoneNumber(auth, fullPhone, recaptcha)
      .then(res => {
        confirmationResult = res;
        otpBoxes.forEach(box => box.value = '');
        otpBoxes[0].focus();
        startCountdown(180);
        phoneRegisterBtn.disabled = true;
        alert("OTP resent to " + fullPhone);
      })
      .catch(err => {
        console.error("OTP resend failed:", err);
        alert("Failed to resend OTP: " + err.message);
      });
  });

  // 3) OTP Input Handling & Auto-verify
  otpBoxes.forEach((box, idx) => {
    box.addEventListener('input', () => {
      if (/^\d$/.test(box.value) && idx < otpBoxes.length-1) {
        otpBoxes[idx+1].focus();
      }
      if (otpBoxes.every(b => b.value)) {
        const code = otpBoxes.map(b => b.value).join('');
        confirmationResult.confirm(code)
          .then(() => {
            alert("OTP verified! Now select currency and click Register.");
            phoneRegisterBtn.disabled = false;
          })
          .catch(err => {
            console.error("OTP verify failed:", err);
            alert("Invalid OTP, please try again.");
            otpBoxes.forEach(b => b.value = '');
            otpBoxes[0].focus();
          });
      }
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && idx>0) {
        otpBoxes[idx-1].focus();
      }
    });
  });

  // 4) Register with Auto-Generated Credentials
  phoneRegisterBtn.addEventListener('click', async () => {
    const raw = phoneInput.value.replace(/\D/g,'');
    const fullPhone = countryCodeSelect.value + raw;

    // Generate creds
    const uidPart  = Math.random().toString(36).slice(2,8);
    const username = `user_${uidPart}`;
    const password = Math.random().toString(36).slice(-8);
    const email    = `${username}@autogen.local`;

    const profile = {
      username,
      phone:    fullPhone,
      country:  countryCodeSelect.value,
      currency: currencySelect.value
    };

    try {
      await registerEmailUser(email, password, profile);
      // Redirect to credentials page
      window.location.href =
        `redirect.html?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Registration failed: " + err.message);
    }
  });
});
