// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";



// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyD_Vt5U_OKXP1LOepSdsjpPUzs1FlKh3tE",
  authDomain: "petalk-a70e1.firebaseapp.com",
  projectId: "petalk-a70e1",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const userStatus = document.getElementById("userStatus");
  if (user) {
    userStatus.textContent = `ログイン中：${user.email}`;
    showMyPets();
  } else {
    userStatus.textContent = "未ログイン";
  }
});

// 🔹 ログイン
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await signInWithEmailAndPassword(auth, form.email.value, form.password.value);
      form.reset();
    } catch (err) {
      alert("ログイン失敗：" + err.message);
    }
  });
}

// 🔹 新規登録
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await createUserWithEmailAndPassword(auth, form.email.value, form.password.value);
      alert("登録成功！そのままログインしました。");
      form.reset();
    } catch (err) {
      alert("登録失敗：" + err.message);
    }
  });
}

// 🔹 ペット登録
const petForm = document.getElementById("petForm");
if (petForm) {
  petForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("ログインが必要です。");
      return;
    }
    const form = e.target;
    const petData = {
      uid: currentUser.uid,
      name: form.name.value,
      type: form.type.value,
      age: form.age.value,
      food: form.food.value,
      notes: form.notes.value,
      createdAt: new Date()
    };
    try {
      await addDoc(collection(db, "pets"), petData);
      alert("登録完了！🎉");
      form.reset();
      showMyPets();
    } catch (err) {
      console.error("登録失敗:", err);
      alert("登録に失敗しました…");
    }
  });
}

// 🔹 ペット一覧表示
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // ← 追加

async function showMyPets() {
  if (!currentUser) return;
  const petList = document.getElementById("myPets");
  if (!petList) return;
  petList.innerHTML = "";

  const q = query(collection(db, "pets"), where("uid", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const pet = docSnap.data();
    const item = document.createElement("li");
    item.textContent = `🐾 ${pet.name} (${pet.type}, ${pet.age}) - ${pet.food} - ${pet.notes}`;

    // 🔸 削除ボタン
    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.style.marginLeft = "1em";
    delBtn.onclick = async () => {
      const ok = confirm(`「${pet.name}」を本当に削除しますか？`);
      if (ok) {
        await deleteDoc(doc(db, "pets", docSnap.id));
        showMyPets(); // 再読み込み
      }
    };

    item.appendChild(delBtn);
    petList.appendChild(item);
  });
}


// 🔹 チャット送信
window.send = async function send() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");
  const userMessage = input.value;

  chat.innerHTML += `<div><strong>あなた:</strong> ${userMessage}</div>`;
  input.value = "";

  let prompt = "";

  if (!currentUser) {
    prompt = `ユーザーがログインしていません。それでも以下の質問に答えてください：\n「${userMessage}」`;
  } else {
    const q = query(collection(db, "pets"), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      prompt = `あなたが登録したペットはまだいません。それでも以下の質問に答えてください：\n「${userMessage}」`;
    } else {
      let petInfo = "";
      snapshot.forEach(doc => {
        const pet = doc.data();
        petInfo += `- 名前: ${pet.name}, 種類: ${pet.type}, 年齢: ${pet.age}, 好きな食べ物: ${pet.food}, 備考: ${pet.notes}\n`;
      });

      prompt = `以下はユーザが登録したユーザのペットの情報です。ユーザはあなたがこの情報を知っている前提で質問をします：\n${petInfo}\nこの情報をもとに、ユーザからの質問に直接答えるような口調で答えてください。：\n「${userMessage}」`;
    }
  }

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt }),
  });

  const data = await res.json();
  chat.innerHTML += `<div><strong>Petalk:</strong> ${data.reply}</div>`;
}

// 新規登録（サインアップ）処理
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const password = form.password.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("アカウントを作成しました！ログインしてください。");
    form.reset();
  } catch (error) {
    console.error("登録エラー:", error.message);
    alert("登録失敗：" + error.message);
  }
});
