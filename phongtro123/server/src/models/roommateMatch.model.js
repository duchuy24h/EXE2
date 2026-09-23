const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roommateMatchSchema = new Schema(
    {
        userA: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        userB: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        status: { type: String, enum: ['matched'], default: 'matched' },
    },
    {
        timestamps: true,
    },
);

roommateMatchSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('roommateMatch', roommateMatchSchema);
