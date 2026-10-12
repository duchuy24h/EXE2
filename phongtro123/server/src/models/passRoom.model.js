const mongoose = require('mongoose');

const passRoomSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: function () {
                return this.kind !== 'pass-item';
            },
            enum: ['phong-tro', 'nha-nguyen-can', 'can-ho-chung-cu', 'can-ho-mini'],
        },
        itemCategory: {
            type: String,
            enum: ['noi-that', 'dien-tu', 'do-gia-dung', 'do-trang-tri', 'khac'],
            required: function () {
                return this.kind === 'pass-item';
            },
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
            required: function () {
                return this.kind !== 'pass-item';
            },
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
            enum: ['pass-room', 'affiliate-decor', 'pass-item'],
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
