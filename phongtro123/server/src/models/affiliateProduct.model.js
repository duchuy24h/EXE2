const mongoose = require('mongoose');

const affiliateProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        image: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            default: null,
            min: 0,
        },
        link: {
            type: String,
            required: true,
            trim: true,
        },
        platform: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        category: {
            type: String,
            enum: ['noi-that', 'dien-may', 'gia-dung', 'decor', 'khac'],
            default: 'khac',
        },
        description: {
            type: String,
            default: '',
            trim: true,
            maxlength: 500,
        },
        userId: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('affiliateProduct', affiliateProductSchema);
