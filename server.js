import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./trade-app/src/routes/auth.js";
import itemsRoutes from "./trade-app/src/routes/items.js";
import notificationRoutes from "./trade-app/src/routes/notifications.js";
import tradeRoutes from './trade-app/src/routes/trades.js';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/users", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/trades', tradeRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
