const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roommateSwipeSchema = new Schema(
    {
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        direction: { type: String, enum: ['like', 'pass'], required: true },
    },
    {
        timestamps: true,
    },
);

roommateSwipeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

module.exports = mongoose.model('roommateSwipe', roommateSwipeSchema);
