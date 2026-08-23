import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import http from "http"; // ✅ socket.io এর জন্য দরকার
import { Server } from "socket.io";

import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import productRouter from "./routes/productRoutes.js";
import volunteerRouter from "./routes/volunteerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

import teamRouter from "./routes/teamRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

// ✅ Database connect
connectDB();

// ✅ Allowed origins
const allowedOrigins = ["http://localhost:5173"];

// ✅ Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ✅ Static file serve
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Endpoints
app.get("/", (req, res) => res.send("API Working"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/products", productRouter);
app.use("/api/volunteers", volunteerRouter);
app.use("/api/cart", cartRoutes);
app.use("/api/teams", teamRouter);
app.use("/api", inviteRoutes);
app.use("/api/orders", orderRoutes);

// ✅ Create HTTP server for socket.io
const server = http.createServer(app);

// ✅ Setup socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ socket.io connection
io.on("connection", (socket) => {
  console.log("⚡ A user connected");

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected");
  });
});

// ✅ Start server
server.listen(port, () => console.log(`🚀 Server started on PORT: ${port}`));
