import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { firebaseConfig } from "./firebase.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ログイン処理
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "pets.html";
  } catch (err) {
    alert("ログインに失敗しました: " + err.message);
  }
});

// 新規登録処理
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "pets.html";
  } catch (err) {
    alert("新規登録に失敗しました: " + err.message);
  }
});