import express from "express";
import multer from "multer";
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
        console.log('Received body:', req.body);
        console.log('Received file:', req.file);

        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newItem = new Item({
            name,
            description,
            image: imagePath,
        });

        await newItem.save();
        res.status(201).json({ message: 'Item created', item: newItem });
    } catch (err) {
        console.error('Error saving item:', err);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.get('/', async (req, res) => {
    try {
        const items = await Item.find();
        res.json({ items });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

export default router;