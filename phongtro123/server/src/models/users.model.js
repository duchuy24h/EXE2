const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelUser = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true },
        password: { type: String, require: true },
        address: { type: String, require: true },
        avatar: { type: String, require: true },
        phone: { type: String, require: true },
        isAdmin: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        emailVerified: { type: Boolean, default: false },
        roommateModeEnabled: { type: Boolean, default: false },
        balance: { type: Number, default: 0 },
        typeLogin: { type: String, enum: ['email', 'google'] },
        roommateProfile: {
            bio: { type: String, default: '' },
            location: { type: String, default: '' },
            age: { type: Number, default: 22 },
            gender: {
                type: String,
                enum: ['Nam', 'Nữ', 'Khác'],
                default: 'Khác',
            },
            studentStatus: {
                type: String,
                enum: ['Sinh viên', 'Đã tốt nghiệp', 'Đi làm', 'Khác'],
                default: 'Sinh viên',
            },
            budget: { type: Number, default: 0 },
            preferredGender: {
                type: String,
                enum: ['Tất cả', 'Nam', 'Nữ', 'Khác'],
                default: 'Tất cả',
            },
            lifestyle: [{ type: String }],
            interests: [{ type: String }],
            images: [{ type: String, default: [] }],
            distanceRadius: { type: Number, default: 20 },
            preferences: [{ type: String }],
            isLookingForRoommate: { type: Boolean, default: true },
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('user', modelUser);
