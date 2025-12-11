// Firebase SDKの初期化は別で済んでいる前提
import { getFirestore, collection, getDocs } from "firebase/firestore"; // CDN版なら script タグでOK

const db = getFirestore();

async function send() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");

  const userMessage = input.value;
  chat.innerHTML += `<div><strong>あなた:</strong> ${userMessage}</div>`;
  input.value = "";

  try {
    // Firestoreからpetsコレクションを取得
    const querySnapshot = await getDocs(collection(db, "pets"));

    if (querySnapshot.empty) {
      chat.innerHTML += `<div><strong>Petalk:</strong> 登録されたペットが見つかりません。</div>`;
      return;
    }

    // 1件目のペット情報（複数に対応するなら工夫が必要）
    const petData = querySnapshot.docs[0].data();

    // プロンプトを整形
    const prompt = `
登録されたペットの情報は以下の通りです。
- 名前: ${petData.name}
- 種類: ${petData.type}
- 年齢: ${petData.age}
- 好きな食べ物: ${petData.food}
- 備考: ${petData.notes}

このペットに関するユーザーからの質問です：
「${userMessage}」
`;

    // GPTへ送信
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    if (!res.ok) throw new Error("サーバーエラー");

    const data = await res.json();
    chat.innerHTML += `<div><strong>Petalk:</strong> ${data.reply}</div>`;
  } catch (err) {
    chat.innerHTML += `<div style="color:red;"><strong>エラー:</strong> 応答に失敗しました。</div>`;
    console.error(err);
  }
}
