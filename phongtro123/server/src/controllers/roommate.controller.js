const modelUser = require('../models/users.model');
const modelSwipe = require('../models/roommateSwipe.model');
const modelMatch = require('../models/roommateMatch.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

const getBudgetQuery = (filterValue) => {
    if (!filterValue) {
        return null;
    }

    if (filterValue === 'Dưới 3 triệu') {
        return { $lt: 3 };
    }

    if (filterValue === '3-5 triệu') {
        return { $gte: 3, $lte: 5 };
    }

    if (filterValue === '5-7 triệu') {
        return { $gte: 5, $lte: 7 };
    }

    if (filterValue === '7 triệu+') {
        return { $gte: 7 };
    }

    return null;
};

const normalizeArray = (value) => {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};

const buildSuggestionQuery = (currentUserId, queryFilter = {}) => {
    const blockedIds = [];
    const likedIds = [];
    const excludedIds = [...blockedIds, ...likedIds, currentUserId];
    const filters = {
        _id: { $nin: excludedIds },
        emailVerified: true,
        roommateModeEnabled: true,
        isActive: { $ne: false },
        roommateProfile: {
            $exists: true,
            $ne: null,
        },
        'roommateProfile.isLookingForRoommate': true,
        'roommateProfile.location': { $exists: true, $ne: '' },
        'roommateProfile.gender': { $exists: true, $ne: null },
    };

    if (queryFilter.location) {
        const locationValue = queryFilter.location.trim();
        if (locationValue && locationValue !== 'Tất cả') {
            filters.$or = [
                { address: { $regex: locationValue, $options: 'i' } },
                { 'roommateProfile.location': { $regex: locationValue, $options: 'i' } },
            ];
        }
    }

    if (queryFilter.gender && queryFilter.gender !== 'Tất cả') {
        filters['roommateProfile.gender'] = queryFilter.gender;
    }

    if (queryFilter.budget) {
        const budgetQuery = getBudgetQuery(queryFilter.budget);
        if (budgetQuery) {
            filters['roommateProfile.budget'] = budgetQuery;
        }
    }

    const lifestyleValues = normalizeArray(queryFilter.lifestyle);
    if (lifestyleValues.length) {
        filters['roommateProfile.lifestyle'] = { $all: lifestyleValues };
    }

    const interestValues = normalizeArray(queryFilter.interests);
    if (interestValues.length) {
        filters['roommateProfile.interests'] = { $all: interestValues };
    }

    const preferenceValues = normalizeArray(queryFilter.preferences);
    if (preferenceValues.length) {
        filters['roommateProfile.preferences'] = { $all: preferenceValues };
    }

    if (queryFilter.distance) {
        const maxDistance = Number(String(queryFilter.distance).replace(/\D+/g, '')) || 20;
        filters['roommateProfile.distanceRadius'] = { $lte: maxDistance };
    }

    return filters;
};

class RoommateController {
    async getSuggestions(req, res) {
        const currentUserId = req.user.id;

        const currentUser = await modelUser.findById(currentUserId);
        if (!currentUser) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        const queryFilter = {
            location: req.query.location,
            budget: req.query.budget,
            gender: req.query.gender,
            lifestyle: req.query.lifestyle,
            interests: req.query.interests,
            preferences: req.query.preferences,
            distance: req.query.distance,
        };

        const users = await modelUser
            .find(buildSuggestionQuery(currentUserId, queryFilter))
            .limit(10)
            .lean();

        const payload = users.map((user) => {
            const profile = user.roommateProfile || {};
            const profileImages = Array.isArray(profile.images) && profile.images.length ? profile.images : [user.avatar].filter(Boolean);
            const budgetValue = Number(profile.budget || 0);
            const budgetText = budgetValue > 0 ? `${budgetValue.toLocaleString('vi-VN')} triệu` : '3-5 triệu';

            return {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                avatar: profileImages[0] || user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
                images: profileImages.length ? profileImages : [user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'],
                address: profile.location || user.address || 'Hà Nội',
                bio: profile.bio || 'Sống sạch sẽ, tìm bạn ở ghép phù hợp với phong cách yên tĩnh.',
                age: profile.age || 24,
                gender: profile.gender || 'Khác',
                studentStatus: profile.studentStatus || 'Sinh viên',
                interests: Array.isArray(profile.interests) && profile.interests.length ? profile.interests : ['Yoga', 'Travel', 'Reading'],
                lifestyle: Array.isArray(profile.lifestyle) && profile.lifestyle.length ? profile.lifestyle : ['Sạch sẽ', 'Làm việc từ xa'],
                budget: budgetText,
                distance: `${profile.distanceRadius || 20} km away`,
                preferredGender: profile.preferredGender || 'Tất cả',
                preferences: Array.isArray(profile.preferences) && profile.preferences.length ? profile.preferences : ['Không hút thuốc', 'Làm việc từ xa'],
            };
        });

        return new OK({
            message: 'Lấy danh sách gợi ý thành công',
            metadata: payload,
        }).send(res);
    }

    async swipe(req, res) {
        const { targetUserId, direction } = req.body;
        const currentUserId = req.user.id;

        if (!targetUserId || !['like', 'pass'].includes(direction)) {
            throw new BadRequestError('Thiếu dữ liệu hoặc hướng swipe không hợp lệ');
        }

        if (targetUserId.toString() === currentUserId.toString()) {
            throw new BadRequestError('Không thể swipe chính mình');
        }

        await modelSwipe.findOneAndUpdate(
            { fromUserId: currentUserId, toUserId: targetUserId },
            { fromUserId: currentUserId, toUserId: targetUserId, direction },
            { upsert: true, new: true },
        );

        if (direction === 'like') {
            const reverseSwipe = await modelSwipe.findOne({
                fromUserId: targetUserId,
                toUserId: currentUserId,
                direction: 'like',
            });

            if (reverseSwipe) {
                const matchPair = {
                    userA: currentUserId,
                    userB: targetUserId,
                };

                await modelMatch.findOneAndUpdate(
                    {
                        $or: [
                            { userA: matchPair.userA, userB: matchPair.userB },
                            { userA: matchPair.userB, userB: matchPair.userA },
                        ],
                    },
                    matchPair,
                    { upsert: true, new: true },
                );

                return new Created({
                    message: 'Có match mới',
                    metadata: { matched: true, withUserId: targetUserId },
                }).send(res);
            }
        }

        return new OK({
            message: 'Swipe thành công',
            metadata: { direction },
        }).send(res);
    }

    async getLikedYou(req, res) {
        const currentUserId = req.user.id;

        const likes = await modelSwipe
            .find({ toUserId: currentUserId, direction: 'like' })
            .populate('fromUserId', 'fullName avatar email address')
            .lean();

        const payload = likes.map((item) => ({
            _id: item.fromUserId._id,
            fullName: item.fromUserId.fullName,
            avatar: item.fromUserId.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
            email: item.fromUserId.email,
            address: item.fromUserId.address || 'Hà Nội',
        }));

        return new OK({
            message: 'Lấy danh sách liked you thành công',
            metadata: payload,
        }).send(res);
    }

    async getMatches(req, res) {
        const currentUserId = req.user.id;

        const matches = await modelMatch
            .find({
                $or: [{ userA: currentUserId }, { userB: currentUserId }],
            })
            .populate('userA', 'fullName avatar roommateProfile address')
            .populate('userB', 'fullName avatar roommateProfile address')
            .lean();

        const payload = matches.map((item) => {
            const otherUser = item.userA._id.toString() === currentUserId.toString() ? item.userB : item.userA;
            const profile = otherUser.roommateProfile || {};
            const images = Array.isArray(profile.images) && profile.images.length
                ? profile.images
                : [otherUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'];

            return {
                _id: otherUser._id,
                name: otherUser.fullName,
                avatar: images[0] || otherUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
                images,
                bio: profile.bio || 'Tôi đang tìm bạn ở ghép phù hợp với lối sống thoải mái.',
                age: profile.age || 24,
                location: profile.location || otherUser.address || 'Hà Nội',
                gender: profile.gender || 'Khác',
                interests: Array.isArray(profile.interests) ? profile.interests : [],
                lifestyle: Array.isArray(profile.lifestyle) ? profile.lifestyle : [],
            };
        });

        return new OK({
            message: 'Lấy danh sách match thành công',
            metadata: payload,
        }).send(res);
    }
}

module.exports = new RoommateController();
module.exports.buildSuggestionQuery = buildSuggestionQuery;
