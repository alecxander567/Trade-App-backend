import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['friend_request', 'trade_offer', 'trade_accepted', 'trade_rejected'],
        required: true
    },
    message: { type: String, required: true },
    tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);