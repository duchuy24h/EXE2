const mongoose = require('mongoose');

const passRoomSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['phong-tro', 'nha-nguyen-can', 'can-ho-chung-cu', 'can-ho-mini'],
        },
        location: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        area: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            default: [],
        },
        phone: {
            type: String,
            required: true,
        },
        shopLink: {
            type: String,
            default: '',
        },
        userId: {
            type: String,
            required: true,
        },
        kind: {
            type: String,
            required: true,
            enum: ['pass-room', 'affiliate-decor'],
        },
        decorStyle: {
            type: String,
            default: 'modern',
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive'],
            default: 'inactive',
        },
        purchaseCount: {
            type: Number,
            default: 0,
        },
        purchasedBy: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'user',
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('passrooms', passRoomSchema);
