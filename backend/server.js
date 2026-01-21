import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
dotenv.config({ path: path.resolve(__dirname, "./.env") });

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import concertRoutes from "./routes/concertRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import blockRoutes from "./routes/blockRoutes.js";
import cookieParser from "cookie-parser";
import { checkJwt } from "./middleware/auth.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;
const nodeEnv = process.env.NODE_ENV;

// Define allowed origins - only include localhost in development
const productionOrigins = [
  "https://set-trackr.onrender.com",
  "https://set-trackr.netlify.app",
  "https://settrackr.netlify.app",
  "https://main--settrackr.netlify.app",
];
const allowedOrigins =
  nodeEnv === "development"
    ? [...productionOrigins, "http://localhost:3000"]
    : productionOrigins;

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use("/api/concerts", concertRoutes);
app.use("/api/users", userRoutes);

// Protected chat routes (require authentication)
app.use("/api/conversations", checkJwt, conversationRoutes);
app.use("/api/messages", checkJwt, messageRoutes);
app.use("/api/blocks", checkJwt, blockRoutes);

// Add a simple test route for backend
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ==================== SOCKET.IO REAL-TIME MESSAGING ====================

// Store connected users: Map of userId to socketId
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  // User joins with their userId
  socket.on("user:join", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // Join a conversation room
  socket.on("conversation:join", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave a conversation room
  socket.on("conversation:leave", (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle new message (broadcast to conversation room)
  socket.on("message:send", (data) => {
    const { conversationId, message } = data;
    // Broadcast to all users in the conversation room except sender
    socket.to(conversationId).emit("message:new", message);
  });

  // Typing indicator
  socket.on("typing:start", (data) => {
    const { conversationId, userId, displayName } = data;
    socket.to(conversationId).emit("typing:update", {
      userId,
      displayName,
      isTyping: true,
    });
  });

  socket.on("typing:stop", (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit("typing:update", {
      userId,
      isTyping: false,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Make io and connectedUsers accessible to routes (for emitting events from REST endpoints)
app.set("io", io);
app.set("connectedUsers", connectedUsers);

//connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests (use httpServer instead of app to enable Socket.io)
    httpServer.listen(PORT, () => {
      console.log("listening on port", PORT);
      console.log("Socket.io enabled for real-time messaging");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
// trigger restart - updated

 
