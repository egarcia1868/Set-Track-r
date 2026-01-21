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
import User from "./models/UserModel.js";
import Conversation from "./models/ConversationModel.js";
import { auth } from "express-oauth2-jwt-bearer";

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

// Store connected users: Map of odBUserId to socketId
const connectedUsers = new Map();

// Socket.io authentication middleware - verify token before allowing connection
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify token with Auth0 userinfo endpoint (same approach as REST API)
    const userinfoUrl = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
    const response = await fetch(userinfoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return next(new Error("Invalid authentication token"));
    }

    const userInfo = await response.json();
    const auth0Id = userInfo.sub;

    // Get the user's database ID
    const user = await User.findOne({ auth0Id });
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach authenticated user info to socket
    socket.auth0Id = auth0Id;
    socket.userId = user._id.toString();
    socket.user = user;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log(`Authenticated socket connection: ${socket.id} (user: ${socket.userId})`);

  // Auto-register user on connection (no need for user:join event)
  connectedUsers.set(socket.userId, socket.id);

  // Join a conversation room - verify membership first
  socket.on("conversation:join", async (conversationId) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      // Verify user is a participant
      if (!conversation.hasParticipant(socket.user._id)) {
        socket.emit("error", { message: "Not authorized to join this conversation" });
        return;
      }

      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    } catch (error) {
      console.error("Error joining conversation:", error);
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  // Leave a conversation room
  socket.on("conversation:leave", (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle new message (broadcast to conversation room)
  // Only broadcast if sender is in the room (already verified via conversation:join)
  socket.on("message:send", (data) => {
    const { conversationId, message } = data;
    // Verify socket is in the room before broadcasting
    if (socket.rooms.has(conversationId)) {
      socket.to(conversationId).emit("message:new", message);
    }
  });

  // Typing indicator - only emit if user is in the conversation
  socket.on("typing:start", (data) => {
    const { conversationId, displayName } = data;
    if (socket.rooms.has(conversationId)) {
      socket.to(conversationId).emit("typing:update", {
        userId: socket.userId,
        displayName,
        isTyping: true,
      });
    }
  });

  socket.on("typing:stop", (data) => {
    const { conversationId } = data;
    if (socket.rooms.has(conversationId)) {
      socket.to(conversationId).emit("typing:update", {
        userId: socket.userId,
        isTyping: false,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    connectedUsers.delete(socket.userId);
    console.log(`User ${socket.userId} disconnected`);
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

 
