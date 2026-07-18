import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AccessToken } from "livekit-server-sdk";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./src/firebase";

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
        return res.json({ 
          message: "Device already registered", 
          deviceId,
          activationCode: data.activationCode,
          isActive: data.isActive,
          assignedServerUrl: data.assignedServerUrl
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
        isActive: false
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
      
      const data = docSnap.data();
      res.json({
        deviceId,
        isActive: data.isActive,
        assignedServerUrl: data.assignedServerUrl || "",
        activationCode: data.activationCode
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
