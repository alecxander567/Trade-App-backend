import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import User from '../models/User.js';
import Item from "../models/Item.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, description, owner } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        if (!owner) {
            return res.status(400).json({ error: 'Owner is required' });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const ownerObjectId = new mongoose.Types.ObjectId(owner);

        const newItem = new Item({
            name,
            description,
            image: imagePath,
            owner: ownerObjectId,
        });

        await newItem.save();

        const savedItem = await Item.findById(newItem._id);

        res.status(201).json({ message: 'Item created', item: newItem });
    } catch (err) {
        console.error('Error saving item:', err);
        res.status(500).json({ error: 'Failed to create item', details: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const currentUser = await User.findById(userId).select('partners');
        console.log('Current user:', currentUser);

        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        const allowedOwners = [
            currentUser._id,
            ...currentUser.partners.map(id => new mongoose.Types.ObjectId(id))
        ];

        const allItems = await Item.find({});
        allItems.forEach(item => {
            console.log('  - Item:', item.name, 'Owner:', item.owner, 'Owner type:', typeof item.owner);
        });

        const items = await Item.find({ owner: { $in: allowedOwners } }).sort({ createdAt: -1 });

        res.json({ items });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items', details: err.message });
    }
});

router.post('/:id/star', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid item ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const objectUserId = new mongoose.Types.ObjectId(userId); // FIXED
        const item = await Item.findById(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (!item.starredBy) item.starredBy = [];

        const alreadyStarred = item.starredBy.some(objId => objId.equals(objectUserId));

        if (alreadyStarred) {
            item.starredBy = item.starredBy.filter(objId => !objId.equals(objectUserId));
            item.stars = Math.max(0, item.stars - 1);
            await item.save();
            return res.json({ message: 'Star removed', stars: item.stars, starred: false });
        } else {
            item.starredBy.push(objectUserId);
            item.stars = (item.stars || 0) + 1;
            await item.save();
            return res.json({ message: 'Star added', stars: item.stars, starred: true });
        }
    } catch (err) {
        console.error('Error updating stars:', err);
        res.status(500).json({ error: 'Failed to update stars', details: err.message });
    }
});

export default router;