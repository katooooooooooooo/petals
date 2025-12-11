import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyD_Vt5U_OKXP1LOepSdsjpPUzs1FlKh3tE",
  authDomain: "petalk-a70e1.firebaseapp.com",
  databaseURL: "https://petalk-a70e1-default-rtdb.firebaseio.com",
  projectId: "petalk-a70e1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let petInfoText = "（ペット情報がありません）";
let user = null;  // グローバルにユーザー保持
let petsSnapshot = null;  // ペット情報も保持

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (u) => {
    if (u) {
      user = u;
      console.log("ログイン中:", user.email);
      document.getElementById("status").textContent = `🐾 ようこそ ${user.email} さん`;

      // ペット情報取得
      const petsRef = ref(db, `users/${user.uid}/pets`);
      const snapshot = await get(petsRef);
      petsSnapshot = snapshot;

      const pets = snapshot.val();
Object.entries(pets).forEach(([key, p], i) => {
  console.log(`🐾 ペット${i + 1}（${key}）の全データ:`, p);
  console.log("→ favorite:", p.favorite);
  console.log("→ meal:", p.meal);
  console.log("→ walk:", p.walk);
});


      if (snapshot.exists()) {
        const pets = snapshot.val();
petInfoText = Object.values(pets)
  .map(p => {
    return JSON.stringify({
      name: p.name,
      species: p.species,
      birthday: p.birthday,
      gender: p.gender ?? "未登録",
      age: p.age ?? "未登録",
      favorite: p.favorite ?? "未登録",
      weight: p.weight ?? "未登録",
      walk: p.walk ?? "未登録",
      meal: p.meal ?? "未登録",
      personality: p.personality ?? "未登録",
      other: p.other ?? "未登録"
    }, null, 2);
  })
  .join("\n");
      } else {
        petInfoText = "登録されたペット情報はありません。";
      }
    } else {
      window.location.href = "auth.html";
    }
  });

  document.getElementById("send").addEventListener("click", async () => {
    const input = document.getElementById("message");
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addLog("🧍‍♂️", userMessage);
    input.value = "";

    const fullPrompt = `以下は登録されているペット情報です:\n${petInfoText}\n\nユーザーのメッセージ:\n${userMessage}\n\nこのメッセージに対する返答を返してください。\n形式:\n{\n  "reply": "人間向けの返答",\n  "update": { "weight": 14 } または null\n}`;

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullPrompt }),
      });

      const data = await res.json();
      addLog("🧠", data.reply);

      // 🔽 Firebaseデータ更新処理
      if (data.update && petsSnapshot && user) {
        const pets = petsSnapshot.val();
        const petId = Object.keys(pets)[0];  // とりあえず最初のペットに適用
        const petRef = ref(db, `users/${user.uid}/pets/${petId}`);

        await update(petRef, data.update);
        console.log("Firebase更新完了:", data.update);
      }
    } catch (err) {
      console.error("エラー:", err);
      addLog("⚠️", "サーバーエラーが発生しました");
    }
  });
});

// チャットログ追加関数
function addLog(who, text) {
  const log = document.getElementById("chat-log");
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<span>${who}：</span>${text}`;
  log.appendChild(div);
}
