const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const affiliateProductSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            default: '',
            trim: true,
        },
        price: {
            type: Number,
            default: null,
        },
        link: {
            type: String,
            required: true,
            trim: true,
        },
        platform: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        _id: true,
    },
);

const modelPost = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: Array,
            required: true,
        },
        userId: {
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
        phone: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        area: {
            type: Number,
            required: true,
        },
        options: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive'],
        },
        typeNews: {
            type: String,
            required: true,
            enum: ['vip', 'normal'],
        },
        isPassRoom: {
            type: Boolean,
            default: false,
        },
        isAffiliateDecor: {
            type: Boolean,
            default: false,
        },
        endDate: {
            type: Date,
            required: true,
        },
        affiliateProducts: {
            type: [affiliateProductSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('posts', modelPost);