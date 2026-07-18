import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi1bYtNOP3y2kOse252_bh2NgiVNZuaas",
  authDomain: "browser-88d26.firebaseapp.com",
  projectId: "browser-88d26",
  storageBucket: "browser-88d26.firebasestorage.app",
  messagingSenderId: "370721273975",
  appId: "1:370721273975:web:584877942c928f41676e72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "septt");

async function seed() {
  const devices = [
    { id: 'DEV-1092', activationCode: 'A9B2K8', isActive: false, assignedServerUrl: '' },
    { id: 'DEV-8831', activationCode: 'X7N4P2', isActive: false, assignedServerUrl: '' },
    { id: 'DEV-4450', activationCode: 'M3V9C1', isActive: false, assignedServerUrl: '' },
  ];

  for (const device of devices) {
    await setDoc(doc(db, 'devices', device.id), {
      deviceId: device.id,
      activationCode: device.activationCode,
      isActive: device.isActive,
      assignedServerUrl: device.assignedServerUrl,
      createdAt: serverTimestamp(),
      activatedAt: null
    });
    console.log(`Seeded ${device.id}`);
  }
}
seed().then(() => process.exit(0)).catch(console.error);
