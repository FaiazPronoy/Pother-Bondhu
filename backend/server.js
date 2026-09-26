import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

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
import { publicStats } from "./controllers/statsController.js";

const app = express();
const port = process.env.PORT || 4000;

// ✅ Database connect
connectDB();

// the site the API accepts cookies from; a comma separated list in production
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5175").split(",").map((s) => s.trim());

// ✅ Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));


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
app.get("/api/stats", publicStats);

// ✅ Start server
app.listen(port, () => console.log(`🚀 Server started on PORT: ${port}`));
