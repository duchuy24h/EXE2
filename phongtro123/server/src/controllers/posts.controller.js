const modelPost = require('../models/post.model');
const modelUser = require('../models/users.model');
const modelFavourite = require('../models/favourite.model');
const mongoose = require('mongoose');

const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const SendMailApprove = require('../utils/SendMail/SendMailApprove');
const SendMailReject = require('../utils/SendMail/SendMailReject');

const pricePostVip = [
    { date: 3, price: 50 },
    { date: 7, price: 315 },
    { date: 30, price: 1200 },
];

const pricePostNormal = [
    { date: 3, price: 10 },
    { date: 7, price: 60 },
    { date: 30, price: 100 },
];

const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];

const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

const isSafeHttpUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    const lower = trimmed.toLowerCase();
    for (const scheme of DANGEROUS_SCHEMES) {
        if (lower.startsWith(scheme)) return false;
    }

    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        if (!parsed.hostname || parsed.hostname.length < 1) return false;
        return true;
    } catch {
        return false;
    }
};

const normalizeAffiliateProduct = (item) => {
    if (!item || typeof item !== 'object') {
        throw new BadRequestError('Dữ liệu sản phẩm AFF không hợp lệ');
    }

    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const link = typeof item.link === 'string' ? item.link.trim() : '';
    const image = typeof item.image === 'string' ? item.image.trim() : '';
    const platform = typeof item.platform === 'string' ? item.platform.trim() : '';

    if (!name || name.length > 200) {
        throw new BadRequestError('Tên sản phẩm AFF là bắt buộc và tối đa 200 ký tự');
    }
    if (!link) {
        throw new BadRequestError('Link mua hàng AFF là bắt buộc');
    }
    if (!isSafeHttpUrl(link)) {
        throw new BadRequestError('Link mua hàng AFF phải là URL http/https hợp lệ và an toàn');
    }
    if (image && !isSafeHttpUrl(image)) {
        throw new BadRequestError('URL ảnh sản phẩm AFF phải là http/https hợp lệ');
    }
    if (platform.length > 50) {
        throw new BadRequestError('Nền tảng tối đa 50 ký tự');
    }

    let price = null;
    if (item.price !== null && item.price !== undefined && item.price !== '') {
        const num = Number(item.price);
        if (Number.isNaN(num) || num < 0) {
            throw new BadRequestError('Giá sản phẩm AFF không hợp lệ');
        }
        price = num;
    }

    return {
        name,
        image: image || '',
        price,
        link,
        platform: platform || '',
    };
};

const normalizeAffiliateProducts = (items) => {
    if (items === undefined || items === null) return [];
    if (!Array.isArray(items)) {
        throw new BadRequestError('affiliateProducts phải là mảng');
    }
    if (items.length > 20) {
        throw new BadRequestError('Tối đa 20 sản phẩm AFF mỗi bài đăng');
    }
    return items.map((item) => normalizeAffiliateProduct(item));
};

const assertPostOwnerOrAdmin = async (post, userId) => {
    if (!post) {
        throw new BadRequestError('Post not found');
    }
    if (String(post.userId) === String(userId)) {
        return true;
    }
    const user = await modelUser.findById(userId);
    if (user && user.isAdmin === true) {
        return true;
    }
    throw new BadRequestError('Bạn không có quyền thao tác trên bài đăng này');
};

class controllerPosts {
    async createPost(req, res) {
        const { id } = req.user;
        const {
            title,
            description,
            price,
            images,
            category,
            area,
            username,
            phone,
            options,
            location,
            endDate,
            typeNews,
            dateEnd,
            isPassRoom,
            isAffiliateDecor,
            affiliateProducts,
        } = req.body;
        if (
            !title ||
            !description ||
            !price ||
            !images ||
            !category ||
            !area ||
            !username ||
            !phone ||
            !options ||
            !location ||
            !endDate ||
            !typeNews ||
            !dateEnd
        ) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        const user = await modelUser.findById(id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        const pricePost =
            typeNews === 'vip'
                ? pricePostVip.find((item) => item.date === dateEnd)
                : pricePostNormal.find((item) => item.date === dateEnd);

        if (!pricePost) {
            throw new BadRequestError('Gói đăng tin không hợp lệ');
        }

        if (user.coin < pricePost.price) {
            throw new BadRequestError('Số Coin không đủ');
        }

        const normalizedAffiliateProducts = normalizeAffiliateProducts(affiliateProducts || []);

        const post = await modelPost.create({
            title,
            description,
            price,
            location,
            images,
            category,
            area,
            username,
            phone,
            options,
            status: 'inactive',
            userId: id,
            endDate: endDate ? endDate : null,
            typeNews,
            isPassRoom: Boolean(isPassRoom),
            isAffiliateDecor: Boolean(isAffiliateDecor) || normalizedAffiliateProducts.length > 0,
            affiliateProducts: normalizedAffiliateProducts,
        });
        await modelUser.findByIdAndUpdate(id, { $inc: { coin: -pricePost.price } });
        return new Created({
            message: 'Post created successfully',
            metadata: post,
        }).send(res);
    }

    async getPosts(req, res) {
        const { category, priceRange, areaRange, typeNews } = req.query;

        const filter = { status: 'active' };

        if (category) {
            filter.category = category;
        }

        if (typeNews) {
            filter.typeNews = typeNews;
        }

        if (priceRange) {
            const priceConditions = {
                'duoi-1-trieu': { $lt: 1000000 },
                'tu-1-2-trieu': { $gte: 1000000, $lt: 2000000 },
                'tu-2-3-trieu': { $gte: 2000000, $lt: 3000000 },
                'tu-3-5-trieu': { $gte: 3000000, $lt: 5000000 },
                'tu-5-7-trieu': { $gte: 5000000, $lt: 7000000 },
                'tu-7-10-trieu': { $gte: 7000000, $lt: 10000000 },
                'tu-10-15-trieu': { $gte: 10000000, $lt: 15000000 },
                'tren-15-trieu': { $gte: 15000000 },
            };
            if (priceConditions[priceRange]) {
                filter.price = priceConditions[priceRange];
            }
        }

        if (areaRange) {
            const areaConditions = {
                'duoi-20': { $lt: 20 },
                'tu-20-30': { $gte: 20, $lt: 30 },
                'tu-30-50': { $gte: 30, $lt: 50 },
                'tu-50-70': { $gte: 50, $lt: 70 },
                'tu-70-90': { $gte: 70, $lt: 90 },
                'tren-90': { $gte: 90 },
            };
            if (areaConditions[areaRange]) {
                filter.area = areaConditions[areaRange];
            }
        }

        const dataPost = await modelPost.find(filter).sort({ createdAt: -1 });

        const data = await Promise.all(
            dataPost.map(async (item) => {
                const user = await modelUser.findById(item.userId);
                return {
                    ...item._doc,
                    user: {
                        _id: user?._id,
                        fullName: item.username,
                        avatar: user?.avatar,
                    },
                };
            }),
        );

        return new OK({
            message: 'Posts fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getPostById(req, res) {
        const { id } = req.query;
        if (!id || !isValidObjectId(id)) {
            throw new BadRequestError('Post id không hợp lệ');
        }
        const data = await modelPost.findById(id);
        if (!data) {
            throw new BadRequestError('Post not found');
        }
        const findUser = await modelUser.findById(data.userId);
        const findFavourite = await modelFavourite.find({ postId: id });

        const userFavourite = findFavourite.map((item) => item.userId);

        const lengthPost = await modelPost.countDocuments({ userId: data.userId });
        let statusUser = '';
        const socket = global.usersMap?.get(findUser?._id?.toString());

        if (socket) {
            statusUser = 'Đang hoạt động';
        } else {
            statusUser = 'Đang offline';
        }
        const dataUser = {
            _id: findUser?._id,
            username: data.username,
            avatar: findUser?.avatar,
            createdAt: findUser?.createdAt,
            phone: data.phone,
            lengthPost,
            status: statusUser,
        };

        return new OK({
            message: 'Post fetched successfully',
            metadata: {
                data,
                dataUser,
                userFavourite,
            },
        }).send(res);
    }

    async getPostByUserId(req, res) {
        const { id } = req.user;
        const data = await modelPost.find({ userId: id });
        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getNewPost(req, res) {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 3);

        const data = await modelPost
            .find({
                createdAt: { $gte: fiveDaysAgo },
                status: 'active',
            })
            .sort({ createdAt: -1 })
            .limit(8);

        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getPostVip(req, res) {
        const data = await modelPost.find({ typeNews: 'vip' }).limit(5);
        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async deletePost(req, res) {
        const { id } = req.body;
        const { id: userId } = req.user;
        if (!id || !isValidObjectId(id)) {
            throw new BadRequestError('Post id không hợp lệ');
        }
        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }
        await assertPostOwnerOrAdmin(findPost, userId);
        await modelPost.findByIdAndDelete(id);
        await modelFavourite.deleteMany({ postId: id });
        await modelUser.findByIdAndUpdate(findPost.userId, { $inc: { balance: findPost.price } });
        return new OK({
            message: 'Xoá bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async getAllPosts(req, res) {
        const { status } = req.query;
        const filter = { status: status };
        const data = await modelPost.find(filter);
        return new OK({
            message: 'Posts fetched successfully',
            metadata: data,
        }).send(res);
    }

    async approvePost(req, res) {
        const { id } = req.body;
        if (!id || !isValidObjectId(id)) {
            throw new BadRequestError('Post id không hợp lệ');
        }
        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }
        const findUser = await modelUser.findById(findPost.userId);
        await modelPost.findByIdAndUpdate(id, { status: 'active' });
        if (findUser?.email) {
            await SendMailApprove(findUser.email, findPost);
        }
        return new OK({
            message: 'Duyệt bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async rejectPost(req, res) {
        const { id, reason } = req.body;
        if (!id || !isValidObjectId(id)) {
            throw new BadRequestError('Post id không hợp lệ');
        }
        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }
        const findUser = await modelUser.findById(findPost.userId);
        await modelPost.findByIdAndUpdate(id, { status: 'cancel' });
        if (findUser?.email) {
            await SendMailReject(findUser.email, findPost, reason);
        }
        return new OK({
            message: 'Từ chối bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async postSuggest(req, res) {
        const { id } = req.user;
        const findUser = await modelUser.findById(id);
        const address = findUser?.address;

        if (address) {
            const addressParts = address.split(',');
            const districtCity = addressParts.slice(-2).join(',').trim();

            const data = await modelPost.find({
                location: { $regex: new RegExp(districtCity, 'i') },
                status: 'active',
            });

            return new OK({
                message: 'Post fetched successfully',
                metadata: data.length ? data : await modelPost.find({ status: 'active' }),
            }).send(res);
        } else {
            const data = await modelPost.find({ status: 'active' });
            return new OK({
                message: 'Post fetched successfully',
                metadata: data,
            }).send(res);
        }
    }

    async getAffiliateProducts(req, res) {
        const { postId } = req.query;
        if (!postId || !isValidObjectId(postId)) {
            throw new BadRequestError('postId không hợp lệ');
        }
        const post = await modelPost.findById(postId).select('affiliateProducts title userId');
        if (!post) {
            throw new BadRequestError('Post not found');
        }
        return new OK({
            message: 'Lấy danh sách AFF thành công',
            metadata: {
                postId: post._id,
                title: post.title,
                affiliateProducts: Array.isArray(post.affiliateProducts) ? post.affiliateProducts : [],
            },
        }).send(res);
    }

    async addAffiliateProduct(req, res) {
        const { id: userId } = req.user;
        const { postId, name, image, price, link, platform } = req.body;

        if (!postId || !isValidObjectId(postId)) {
            throw new BadRequestError('postId không hợp lệ');
        }

        const post = await modelPost.findById(postId);
        await assertPostOwnerOrAdmin(post, userId);

        if ((post.affiliateProducts || []).length >= 20) {
            throw new BadRequestError('Tối đa 20 sản phẩm AFF mỗi bài đăng');
        }

        const normalized = normalizeAffiliateProduct({ name, image, price, link, platform });

        post.affiliateProducts.push(normalized);
        await post.save();

        return new Created({
            message: 'Thêm sản phẩm AFF thành công',
            metadata: {
                postId: post._id,
                affiliateProduct: post.affiliateProducts[post.affiliateProducts.length - 1],
                affiliateProducts: post.affiliateProducts,
            },
        }).send(res);
    }

    async updateAffiliateProduct(req, res) {
        const { id: userId } = req.user;
        const { postId, productId, name, image, price, link, platform } = req.body;

        if (!postId || !isValidObjectId(postId)) {
            throw new BadRequestError('postId không hợp lệ');
        }
        if (!productId || !isValidObjectId(productId)) {
            throw new BadRequestError('productId không hợp lệ');
        }

        const post = await modelPost.findById(postId);
        await assertPostOwnerOrAdmin(post, userId);

        const product = post.affiliateProducts.id(productId);
        if (!product) {
            throw new BadRequestError('Sản phẩm AFF không tồn tại');
        }

        if (name !== undefined) {
            const trimmedName = typeof name === 'string' ? name.trim() : '';
            if (!trimmedName || trimmedName.length > 200) {
                throw new BadRequestError('Tên sản phẩm AFF là bắt buộc và tối đa 200 ký tự');
            }
            product.name = trimmedName;
        }
        if (image !== undefined) {
            const trimmedImage = typeof image === 'string' ? image.trim() : '';
            if (trimmedImage && !isSafeHttpUrl(trimmedImage)) {
                throw new BadRequestError('URL ảnh sản phẩm AFF phải là http/https hợp lệ');
            }
            product.image = trimmedImage;
        }
        if (price !== undefined) {
            if (price === null || price === '') {
                product.price = null;
            } else {
                const num = Number(price);
                if (Number.isNaN(num) || num < 0) {
                    throw new BadRequestError('Giá sản phẩm AFF không hợp lệ');
                }
                product.price = num;
            }
        }
        if (link !== undefined) {
            const trimmedLink = typeof link === 'string' ? link.trim() : '';
            if (!trimmedLink) {
                throw new BadRequestError('Link mua hàng AFF là bắt buộc');
            }
            if (!isSafeHttpUrl(trimmedLink)) {
                throw new BadRequestError('Link mua hàng AFF phải là URL http/https hợp lệ và an toàn');
            }
            product.link = trimmedLink;
        }
        if (platform !== undefined) {
            const trimmedPlatform = typeof platform === 'string' ? platform.trim() : '';
            if (trimmedPlatform.length > 50) {
                throw new BadRequestError('Nền tảng tối đa 50 ký tự');
            }
            product.platform = trimmedPlatform;
        }

        await post.save();

        return new OK({
            message: 'Cập nhật sản phẩm AFF thành công',
            metadata: {
                postId: post._id,
                affiliateProduct: product,
                affiliateProducts: post.affiliateProducts,
            },
        }).send(res);
    }

    async deleteAffiliateProduct(req, res) {
        const { id: userId } = req.user;
        const { postId, productId } = req.body;

        if (!postId || !isValidObjectId(postId)) {
            throw new BadRequestError('postId không hợp lệ');
        }
        if (!productId || !isValidObjectId(productId)) {
            throw new BadRequestError('productId không hợp lệ');
        }

        const post = await modelPost.findById(postId);
        await assertPostOwnerOrAdmin(post, userId);

        const product = post.affiliateProducts.id(productId);
        if (!product) {
            throw new BadRequestError('Sản phẩm AFF không tồn tại');
        }

        product.deleteOne();
        await post.save();

        return new OK({
            message: 'Xoá sản phẩm AFF thành công',
            metadata: {
                postId: post._id,
                deletedProductId: productId,
                affiliateProducts: post.affiliateProducts,
            },
        }).send(res);
    }
}

module.exports = new controllerPosts();