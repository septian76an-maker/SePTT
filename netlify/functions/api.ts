import express, { Router } from "express";
import serverless from "serverless-http";
import { AccessToken } from "livekit-server-sdk";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../src/firebase";

const api = express();
const router = Router();

api.use(express.json());

// Request logger middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root route for debugging
router.get("/", (req, res) => {
  res.json({ message: "API is running!", path: req.path, url: req.url });
});

// API Route to register a new device from Android App
router.post("/devices/register", async (req, res) => {
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
router.get("/devices/:deviceId/status", async (req, res) => {
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
router.post("/livekit/token", async (req, res) => {
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

// Catch-all route to debug path mismatch
router.all("*", (req, res) => {
  res.status(404).json({ error: "Route not found in API router", originalUrl: req.originalUrl, path: req.path, url: req.url });
});

// Add explicit route for Netlify
api.use("/.netlify/functions/api", router);
api.use("/api/", router);
// And also at root just in case the rewrite passes the full path or strips it.
api.use("/", router);

export const handler = serverless(api);
