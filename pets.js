import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ★あなたの設定に置き換え不要（既に正しい）
const firebaseConfig = {
  apiKey: "AIzaSyD_Vt5U_OKXP1LOepSdsjpPUzs1FlKh3tE",
  authDomain: "petalk-a70e1.firebaseapp.com",
  databaseURL: "https://petalk-a70e1-default-rtdb.firebaseio.com",
  projectId: "petalk-a70e1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// DOM
const $status  = document.getElementById("userStatus");
const $form    = document.getElementById("petForm");
const $list    = document.getElementById("petList");
const $saveBtn = document.getElementById("save");
const $saving  = document.getElementById("saving");

// 状態
let currentUser = null;
let editingKey = null; // 編集中のドキュメントID（nullなら新規）

const fmt = v => (v ?? "") + "";

// 一覧の描画
function renderList(snapshot) {
  $list.innerHTML = "";
  snapshot.forEach(child => {
    const key = child.key;
    const p = child.val();
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${fmt(p.name)}</strong>（${fmt(p.species)}）<br/>
      誕生日: ${fmt(p.birthday)} / 性別: ${fmt(p.gender)} / 年齢: ${fmt(p.age)} / 体重: ${fmt(p.weight)}kg<br/>
      好きなもの: ${fmt(p.favorite)}<br/>
      散歩頻度: ${fmt(p.walk)} / ご飯頻度: ${fmt(p.meal)}<br/>
      性格: ${fmt(p.personality)}<br/>
      その他: ${fmt(p.other)}<br/>
      <button data-edit="${key}">編集</button>
      <button data-del="${key}">削除</button>
    `;
    $list.appendChild(li);
  });
  // クリック委譲
  $list.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.onclick = () => startEdit(btn.dataset.edit);
  });
  $list.querySelectorAll("button[data-del]").forEach(btn => {
    btn.onclick = () => deletePet(btn.dataset.del);
  });
}

function setSaving(on) {
  $saveBtn.disabled = on;
  $saving.style.display = on ? "inline" : "none";
}

function formData() {
  const f = $form.elements;
  return {
    name:        f["name"].value.trim(),
    species:     f["species"].value.trim(),
    birthday:    f["birthday"].value.trim(),
    gender:      f["gender"].value.trim(),
    age:         f["age"].value.trim(),
    favorite:    f["favorite"].value.trim(),
    weight:      f["weight"].value.trim(),
    walk:        f["walk"].value.trim(),
    meal:        f["meal"].value.trim(),
    personality: f["personality"].value.trim(),
    other:       f["other"].value.trim()
  };
}

function fillForm(p) {
  const f = $form.elements;
  f["name"].value        = p.name ?? "";
  f["species"].value     = p.species ?? "";
  f["birthday"].value    = p.birthday ?? "";
  f["gender"].value      = p.gender ?? "";
  f["age"].value         = p.age ?? "";
  f["favorite"].value    = p.favorite ?? "";
  f["weight"].value      = p.weight ?? "";
  f["walk"].value        = p.walk ?? "";
  f["meal"].value        = p.meal ?? "";
  f["personality"].value = p.personality ?? "";
  f["other"].value       = p.other ?? "";
}

function resetForm() {
  $form.reset();
  editingKey = null;
  $saveBtn.textContent = "登録";
}

// 編集開始
async function startEdit(key) {
  if (!currentUser) return;
  const snap = await get(ref(db, `users/${currentUser.uid}/pets/${key}`));
  if (!snap.exists()) return;
  fillForm(snap.val());
  editingKey = key;
  $saveBtn.textContent = "更新";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 削除
async function deletePet(key) {
  if (!currentUser) return;
  if (!confirm("このペット情報を削除しますか？")) return;
  await remove(ref(db, `users/${currentUser.uid}/pets/${key}`));
}

// 保存（新規 or 更新）
$form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("ログインしてください");
    return;
  }
  const data = formData();
  if (!data.name || !data.species) {
    alert("名前と種類は必須です。");
    return;
  }

  try {
    setSaving(true);
    const base = `users/${currentUser.uid}/pets`;
    if (editingKey) {
      await set(ref(db, `${base}/${editingKey}`), data);
      alert("更新しました！");
    } else {
      const newRef = push(ref(db, base));
      await set(newRef, data);
      alert("ペット情報を登録しました！");
    }
    resetForm();
  } catch (err) {
    console.error("保存エラー:", err);
    alert("保存に失敗しました: " + (err?.message || err));
  } finally {
    setSaving(false);
  }
});

// 認証＆購読開始
onAuthStateChanged(auth, (u) => {
  if (!u) {
    $status.textContent = "未ログイン。ログインしてください。";
    // 必要ならログインページへ
    // location.href = "auth.html";
    return;
  }
  currentUser = u;
  $status.textContent = `${u.email} としてログイン中`;

  const petsRef = ref(db, `users/${u.uid}/pets`);
  onValue(
    petsRef,
    (snap) => renderList(snap),
    (err)  => { console.error("onValue error:", err); }
  );
});
