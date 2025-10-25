import express from 'express';
import Trade from '../models/Trade.js';
import Notification from '../models/Notification.js';
import Item from '../models/Item.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { offeredItemId, targetItemId, userId } = req.body;

        if (!offeredItemId || !targetItemId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const offeredItem = await Item.findById(offeredItemId).populate('owner', 'username');
        const targetItem = await Item.findById(targetItemId).populate('owner', 'username');

        if (!offeredItem || !targetItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const newTrade = new Trade({
            offeredItem: offeredItemId,
            targetItem: targetItemId,
            offeredBy: userId,
            targetOwner: targetItem.owner._id,
            status: 'pending'
        });

        await newTrade.save();

        const notification = new Notification({
            recipient: targetItem.owner._id,
            sender: userId,
            type: 'trade_offer',
            message: `${offeredItem.owner.username} wants to trade their "${offeredItem.name}" for your "${targetItem.name}"`,
            tradeId: newTrade._id,
            isRead: false
        });

        await notification.save();

        res.status(201).json({
            message: 'Trade offer sent successfully',
            trade: newTrade
        });

    } catch (err) {
        console.error('Error creating trade:', err);
        res.status(500).json({ error: 'Failed to create trade offer', details: err.message });
    }
});

router.get('/trades/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const notifications = await Notification.find({
            recipient: userId,
            type: { $in: ['trade_offer', 'trade_accepted', 'trade_rejected'] }
        })
            .populate('sender', 'username')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching trade notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.put('/:tradeId/accept', async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.tradeId);
        if (!trade) return res.status(404).json({ error: 'Trade not found' });

        trade.status = 'accepted';
        await trade.save();

        await Notification.updateOne({ tradeId: trade._id }, { type: 'trade_accepted', isRead: false });

        res.json({ message: 'Trade accepted', trade });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to accept trade' });
    }
});

router.put('/:tradeId/reject', async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.tradeId);
        if (!trade) return res.status(404).json({ error: 'Trade not found' });

        trade.status = 'rejected';
        await trade.save();

        await Notification.updateOne({ tradeId: trade._id }, { type: 'trade_rejected', isRead: false });

        res.json({ message: 'Trade rejected', trade });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reject trade' });
    }
});

export default router;