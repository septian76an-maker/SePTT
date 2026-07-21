import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./src/firebase";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let adminApp: any = null;
function getFirebaseAdmin() {
  if (!adminApp) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        adminApp = initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT", e);
      }
    } else {
      try {
        adminApp = initializeApp();
      } catch (e) {
        console.error("Error initializing default Firebase Admin", e);
      }
    }
  }
  return adminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Route to register a new device from Android App
  app.post("/api/devices/register", async (req, res) => {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    try {
      const docRef = doc(db, "devices", deviceId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let token = undefined;
        let roomName = `room-${deviceId}`;
        let channelName = "Utama";

        if (data.groupId) {
          const groupRef = doc(db, "groups", data.groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            roomName = `group-${data.groupId}`;
            channelName = groupData.name || "Tanpa Nama";
          } else {
            roomName = `group-${data.groupId}`;
            channelName = "Grup Tidak Dikenal";
          }
        }

        if (data.isActive) {
          const apiKey = process.env.LIVEKIT_API_KEY || "dev-key";
          const apiSecret = process.env.LIVEKIT_API_SECRET || "dev-secret";
          const at = new AccessToken(apiKey, apiSecret, {
            identity: `device-${deviceId}`,
          });
          at.addGrant({ roomJoin: true, room: roomName });
          token = await at.toJwt();
        }

        return res.json({ 
          message: "Device already registered", 
          deviceId,
          activationCode: data.activationCode,
          isActive: data.isActive,
          assignedServerUrl: data.assignedServerUrl || "",
          groupId: data.groupId || "",
          name: data.name || "",
          groupName: channelName,
          channelName: channelName,
          roomName: roomName,
          ...(token && { token })
        });
      }

      // Generate random 6 character alphanumeric code
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const newDevice = {
        activationCode,
        isActive: false,
        assignedServerUrl: "",
        createdAt: serverTimestamp(),
      };

      await setDoc(docRef, newDevice);
      
      res.json({
        message: "Device registered successfully",
        deviceId,
        activationCode,
        isActive: false,
        assignedServerUrl: "",
        groupId: "",
        name: "",
        groupName: "Utama",
        channelName: "Utama",
        roomName: `room-${deviceId}`
      });
    } catch (error) {
      console.error("Error registering device:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  // API Route to check device status (polling from Android App)
  app.get("/api/devices/:deviceId/status", async (req, res) => {
    const { deviceId } = req.params;
    
    try {
      const docRef = doc(db, "devices", deviceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Device not found" });
      }

      // Update last seen status
      await updateDoc(docRef, { lastSeenAt: serverTimestamp() }).catch(e => {
        console.error("Failed to update lastSeenAt", e);
      });

      const data = docSnap.data();
      let token = undefined;
      let roomName = `room-${deviceId}`;
      let channelName = "Utama";

      if (data.groupId) {
        const groupRef = doc(db, "groups", data.groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          roomName = `group-${data.groupId}`;
          channelName = groupData.name || "Tanpa Nama";
        } else {
          roomName = `group-${data.groupId}`;
          channelName = "Grup Tidak Dikenal";
        }
      }

      if (data.isActive) {
        const apiKey = process.env.LIVEKIT_API_KEY || "dev-key";
        const apiSecret = process.env.LIVEKIT_API_SECRET || "dev-secret";
        const at = new AccessToken(apiKey, apiSecret, {
          identity: `device-${deviceId}`,
        });
        at.addGrant({ roomJoin: true, room: roomName });
        token = await at.toJwt();
      }

      res.json({
        deviceId,
        isActive: data.isActive,
        assignedServerUrl: data.assignedServerUrl || "",
        activationCode: data.activationCode,
        groupId: data.groupId || "",
        name: data.name || "",
        groupName: channelName,
        channelName: channelName,
        roomName: roomName,
        ...(token && { token })
      });
    } catch (error) {
      console.error("Error fetching device status:", error);
      res.status(500).json({ error: "Failed to fetch device status" });
    }
  });

  // API Route to generate LiveKit Token
  app.post("/api/livekit/token", async (req, res) => {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: "roomName and participantName are required" });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || "dev-key"; // fallback for testing if user hasn't set it yet
    const apiSecret = process.env.LIVEKIT_API_SECRET || "dev-secret";

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: "LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing" });
    }

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
      });
      
      at.addGrant({ roomJoin: true, room: roomName });
      
      const token = await at.toJwt();
      res.json({ token });
    } catch (error) {
      console.error("Error generating LiveKit token:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });

  // API Route to fetch LiveKit monitoring data
  app.get("/api/livekit/monitoring", async (req, res) => {
    const apiKey = process.env.LIVEKIT_API_KEY || "dev-key";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "dev-secret";
    const wsUrl = process.env.LIVEKIT_URL || "ws://localhost:7880";

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: "LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing" });
    }

    try {
      const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
      const rooms = await roomService.listRooms();
      
      const sessions = rooms.map(room => ({
        id: room.sid,
        name: room.name,
        participants: room.numParticipants,
        createdAt: new Date(Number(room.creationTime) * 1000).toISOString(),
      }));

      // In a real scenario, WebRTC minutes, upstream, and downstream would come from LiveKit analytics.
      // Since we don't have access to the analytics DB here, we will generate placeholder aggregated data based on rooms,
      // or just return mocked data for the cards as requested by the user, while the sessions table is real.
      res.json({ 
        sessions,
        stats: {
          participantMinutes: 12450, // Placeholder
          totalUpstream: "450.2 GB", // Placeholder
          totalDownstream: "1.2 TB" // Placeholder
        }
      });
    } catch (error) {
      console.error("Error fetching LiveKit monitoring data:", error);
      res.status(500).json({ error: "Failed to fetch monitoring data" });
    }
  });

  // API Route to send FCM notifications
  app.post("/api/fcm/notify", async (req, res) => {
    const { title, body, topic, data } = req.body;
    try {
      const adminInstance = getFirebaseAdmin();
      if (!adminInstance) {
        return res.status(500).json({ error: "Firebase Admin not configured" });
      }
      
      const message = {
        notification: { title, body },
        data: data || {},
        topic: topic || "global"
      };
      
      const response = await getMessaging(adminInstance).send(message as any);
      res.json({ success: true, messageId: response });
    } catch (error: any) {
      console.error("FCM Error:", error);
      res.status(500).json({ error: "Failed to send notification", details: error?.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
