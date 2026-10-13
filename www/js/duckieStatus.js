
// DuckieTalkPro 1.2 - DuckieStatus TIEMPO REAL AL INSTANTE 🦆🔥
// Copia este archivo a C:\DuckieTalkPro\www\js\duckieStatus.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// TU CONFIG - ya la tienes en tu proyecto, usa la misma
const firebaseConfig = window.firebaseConfig; // asegúrate que esté definida en index.html
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// 🔥 STREAM TIEMPO REAL - AVISA EN <1 SEGUNDO
export function listenDuckieStatuses(callback) {
  const q = query(
    collection(db, "duckieStatuses"),
    where("expiresAt", ">", Timestamp.now()),
    orderBy("expiresAt", "asc"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const statuses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Agrupar por userId
    const grouped = {};
    statuses.forEach(s => {
      if (!grouped[s.userId]) grouped[s.userId] = [];
      grouped[s.userId].push(s);
    });
    callback(grouped);
    // Notificación instantánea visual
    if (statuses.length > 0) {
      const last = statuses[0];
      if (last.userId !== auth.currentUser?.uid) {
        showDuckieToast(`🦆 ${last.userName} subió nuevo DuckieStatus!`);
      }
    }
  });
}

function showDuckieToast(msg) {
  let toast = document.getElementById('duckie-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'duckie-toast';
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#FFC107;color:#000;padding:12px 20px;border-radius:25px;z-index:9999;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(()=> toast.style.display='none', 4000);
}

// Subir foto/video de Status
export async function uploadDuckieStatus(file, userName, avatarUrl) {
  const user = auth.currentUser;
  if (!user) throw new Error("No auth");
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `duckieStatus/${user.uid}/${Date.now()}.${ext}`);
  await uploadBytes(storageRef, file);
  const mediaUrl = await getDownloadURL(storageRef);
  const mediaType = file.type.startsWith('video') ? 'video' : 'image';

  await addDoc(collection(db, "duckieStatuses"), {
    userId: user.uid,
    userName: userName,
    avatarUrl: avatarUrl,
    mediaUrl: mediaUrl,
    mediaType: mediaType,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 24*60*60*1000)), // 24h
    viewers: []
  });
}

// Marcar como visto
export async function markViewed(statusId) {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, "duckieStatuses", statusId), {
    viewers: arrayUnion(user.uid)
  });
}

// Render barra superior tipo Instagram
export function renderStatusBar(grouped, containerId = 'duckie-status-bar') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.style.cssText = 'display:flex;overflow-x:auto;gap:12px;padding:10px;background:#fff;border-bottom:1px solid #eee;';

  // Botón para subir tu Status
  const addBtn = document.createElement('div');
  addBtn.innerHTML = `<div style="width:60px;height:60px;border-radius:50%;background:#FFC107;display:flex;align-items:center;justify-content:center;font-size:30px;cursor:pointer;">+</div><div style="font-size:11px;text-align:center;margin-top:4px;">Tu Duckie</div>`;
  addBtn.onclick = () => document.getElementById('duckie-status-input')?.click();
  container.appendChild(addBtn);

  Object.entries(grouped).forEach(([userId, statuses]) => {
    const first = statuses[0];
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;cursor:pointer;min-width:70px;';
    div.innerHTML = `
      <div style="width:60px;height:60px;border-radius:50%;border:3px solid #FFC107;padding:2px;">
        <img src="${first.avatarUrl || 'IMG_4685.png'}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
      </div>
      <div style="font-size:11px;margin-top:4px;width:60px;overflow:hidden;text-overflow:ellipsis;">${first.userName}</div>
    `;
    div.onclick = () => openStatusViewer(statuses);
    container.appendChild(div);
  });
}

function openStatusViewer(statuses) {
  // Viewer simple - puedes mejorarlo
  const viewer = document.createElement('div');
  viewer.style.cssText = 'position:fixed;inset:0;background:#000;z-index:10000;display:flex;flex-direction:column;';
  viewer.innerHTML = `
    <div style="height:4px;background:#333;"><div id="progress" style="height:100%;background:#FFC107;width:0%;transition:width 5s linear;"></div></div>
    <div style="padding:15px;color:#fff;display:flex;align-items:center;gap:10px;">
      <img src="${statuses[0].avatarUrl}" style="width:35px;height:35px;border-radius:50%;">
      <b>${statuses[0].userName}</b>
      <button onclick="this.parentElement.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#fff;font-size:20px;">✕</button>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;">
      ${statuses[0].mediaType === 'image' ? `<img src="${statuses[0].mediaUrl}" style="max-width:100%;max-height:80vh;">` : `<video src="${statuses[0].mediaUrl}" autoplay controls style="max-width:100%;"></video>`}
    </div>
  `;
  document.body.appendChild(viewer);
  setTimeout(()=> document.getElementById('progress').style.width='100%', 100);
  setTimeout(()=> viewer.remove(), 5000);
  markViewed(statuses[0].id);
}
