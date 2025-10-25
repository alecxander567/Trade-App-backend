import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: "Notifications API is working" });
});

router.post('/', async (req, res) => {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(400).json({
            error: "Missing required fields: senderId, receiverId, and message are required"
        });
    }

    try {
        const notification = await Notification.create({
            sender: senderId,
            receiver: receiverId,
            message,
            isRead: false,
            createdAt: new Date()
        });

        res.status(201).json(notification);
    } catch (err) {
        console.error("Error creating notification:", err);
        res.status(500).json({ error: "Unable to create notification", details: err.message });
    }
});

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', 'username email')
            .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Unable to fetch notifications", details: err.message });
    }
});

router.put("/:id/read", async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Notification ID is required" });
    }

    try {
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification marked as read", notification });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ error: "Failed to mark as read", details: err.message });
    }
});

router.put("/:id/accept", async (req, res) => {
    const { id } = req.params;

    try {
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const sender = await User.findById(notification.sender);
        const receiver = await User.findById(notification.receiver);

        if (!sender) {
            return res.status(404).json({ error: "Sender not found" });
        }
        if (!receiver) {
            return res.status(404).json({ error: "Receiver not found" });
        }

        if (!sender.partners.includes(receiver._id.toString())) {
            sender.partners.push(receiver._id);
        }

        if (!receiver.partners.includes(sender._id.toString())) {
            receiver.partners.push(sender._id);
        }

        await sender.save();
        await receiver.save();

        await Notification.findByIdAndDelete(id);

        res.json({
            message: "Trader request accepted",
            partners: {
                sender: sender.username,
                receiver: receiver.username
            }
        });
    } catch (err) {
        console.error("Error accepting trader request:", err);
        res.status(500).json({ error: "Failed to accept trader request", details: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification deleted successfully" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).json({ error: "Failed to delete notification", details: err.message });
    }
});

export default router;