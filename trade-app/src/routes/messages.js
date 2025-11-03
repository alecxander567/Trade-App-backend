import { Router } from "express";
import Message from "../models/Message.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newMessage = new Message({ sender, receiver, text });
    await newMessage.save();

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "username _id");

    const conversationMap = new Map();

    messages.forEach((msg) => {
      const otherUserId =
        msg.sender._id.toString() === userId
          ? msg.receiver._id.toString()
          : msg.sender._id.toString();

      if (!conversationMap.has(otherUserId)) {
        const otherUser =
          msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
        conversationMap.set(otherUserId, {
          otherUser: {
            _id: otherUser._id,
            username: otherUser.username,
          },
          lastMessage: {
            text: msg.text,
            sender: msg.sender._id.toString(),
            createdAt: msg.createdAt,
          },
          unreadCount: 0,
        });
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/:sender/:receiver", async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
