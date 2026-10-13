
// DuckieTalkPro 1.2 - Llamada Nativa Real con WebRTC 📞🔥
// Copia a C:\DuckieTalkPro\www\js\duckieCall.js

import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
let localStream, pc;

export async function startNativeCall(callerId, receiverId, callerName) {
  const callRef = doc(collection(db, "calls"));
  await setDoc(callRef, {
    callerId, receiverId, callerName,
    status: "ringing",
    createdAt: serverTimestamp()
  });

  // Iniciar WebRTC
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  document.getElementById('localVideo').srcObject = localStream;
  return callRef.id;
}

export function listenCall(callId, onRinging) {
  return onSnapshot(doc(db, "calls", callId), (snap) => {
    if (!snap.exists()) return;
    onRinging(snap.data());
  });
}

export async function endCall(callId) {
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  if (pc) pc.close();
  await updateDoc(doc(db, "calls", callId), { status: "ended" });
  document.getElementById('call-screen')?.remove();
}

// UI de llamada
export function showCallScreen(callId, isCaller = true) {
  let screen = document.getElementById('call-screen');
  if (screen) screen.remove();
  screen = document.createElement('div');
  screen.id = 'call-screen';
  screen.style.cssText = 'position:fixed;inset:0;background:#111;z-index:10001;display:flex;flex-direction:column;';
  screen.innerHTML = `
    <video id="remoteVideo" autoplay playsinline style="flex:1;background:#000;"></video>
    <video id="localVideo" autoplay muted playsinline style="position:absolute;top:20px;right:20px;width:120px;height:180px;border-radius:12px;border:2px solid #FFC107;"></video>
    <div style="padding:20px;display:flex;justify-content:space-evenly;background:#222;">
      <button id="micBtn" style="width:60px;height:60px;border-radius:50%;background:#333;color:#fff;border:none;">🎤</button>
      <button onclick="window.endDuckieCall('${callId}')" style="width:70px;height:70px;border-radius:50%;background:red;color:#fff;border:none;font-size:30px;">📞</button>
      <button id="camBtn" style="width:60px;height:60px;border-radius:50%;background:#333;color:#fff;border:none;">📹</button>
    </div>
  `;
  document.body.appendChild(screen);
  window.endDuckieCall = endCall;
}
