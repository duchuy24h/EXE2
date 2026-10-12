const mongoose = require('mongoose');
const modelAffiliateProduct = require('../models/affiliateProduct.model');
const modelUser = require('../models/users.model');
const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const isSafeHttpUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return false;

    try {
        const url = new URL(value.trim());
        return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
    } catch {
        return false;
    }
};

const validateProduct = (data) => {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const image = typeof data.image === 'string' ? data.image.trim() : '';
    const link = typeof data.link === 'string' ? data.link.trim() : '';
    const platform = typeof data.platform === 'string' ? data.platform.trim() : '';
    const categories = ['noi-that', 'dien-may', 'gia-dung', 'decor', 'khac'];
    const category = categories.includes(data.category) ? data.category : 'khac';
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    let price = null;

    if (!name || name.length > 200) {
        throw new BadRequestError('Tên sản phẩm là bắt buộc và tối đa 200 ký tự');
    }
    if (!isSafeHttpUrl(image)) {
        throw new BadRequestError('Ảnh sản phẩm phải là URL http/https hợp lệ');
    }
    if (!isSafeHttpUrl(link)) {
        throw new BadRequestError('Link mua hàng phải là URL http/https hợp lệ');
    }
    if (!platform || platform.length > 50) {
        throw new BadRequestError('Vui lòng chọn nền tảng bán sản phẩm');
    }
    if (description.length > 500) {
        throw new BadRequestError('Mô tả sản phẩm tối đa 500 ký tự');
    }
    if (data.price !== undefined && data.price !== null && data.price !== '') {
        price = Number(data.price);
        if (!Number.isFinite(price) || price < 0) {
            throw new BadRequestError('Giá sản phẩm không hợp lệ');
        }
    }

    return { name, image, link, platform, price, category, description };
};

class AffiliateProductsController {
    async getProducts(req, res) {
        const products = await modelAffiliateProduct.find().sort({ createdAt: -1 }).lean();
        const sellers = await modelUser
            .find({ _id: { $in: products.map((product) => product.userId) } })
            .select('fullName avatar')
            .lean();
        const sellersById = new Map(sellers.map((seller) => [String(seller._id), seller]));
        const productsWithSellers = products.map((product) => ({
            ...product,
            seller: sellersById.get(String(product.userId))
                ? {
                    fullName: sellersById.get(String(product.userId)).fullName,
                    avatar: sellersById.get(String(product.userId)).avatar,
                }
                : null,
        }));
        return new OK({
            message: 'Lấy danh sách sản phẩm affiliate thành công',
            metadata: productsWithSellers,
        }).send(res);
    }

    async getMyProducts(req, res) {
        const products = await modelAffiliateProduct.find({ userId: req.user.id }).sort({ createdAt: -1 });
        return new OK({
            message: 'Lấy sản phẩm affiliate của bạn thành công',
            metadata: products,
        }).send(res);
    }

    async createProduct(req, res) {
        const product = await modelAffiliateProduct.create({
            ...validateProduct(req.body),
            userId: req.user.id,
        });
        return new Created({
            message: 'Đăng sản phẩm affiliate thành công',
            metadata: product,
        }).send(res);
    }

    async updateProduct(req, res) {
        const { productId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Mã sản phẩm không hợp lệ');
        }

        const product = await modelAffiliateProduct.findOne({
            _id: productId,
            userId: req.user.id,
        });
        if (!product) {
            throw new BadRequestError('Không tìm thấy sản phẩm hoặc bạn không có quyền sửa');
        }

        Object.assign(product, validateProduct(req.body));
        await product.save();
        return new OK({
            message: 'Cập nhật sản phẩm affiliate thành công',
            metadata: product,
        }).send(res);
    }

    async deleteProduct(req, res) {
        const { productId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Mã sản phẩm không hợp lệ');
        }

        const product = await modelAffiliateProduct.findOneAndDelete({
            _id: productId,
            userId: req.user.id,
        });
        if (!product) {
            throw new BadRequestError('Không tìm thấy sản phẩm hoặc bạn không có quyền xóa');
        }

        return new OK({
            message: 'Xóa sản phẩm affiliate thành công',
            metadata: { productId },
        }).send(res);
    }
}

module.exports = new AffiliateProductsController();
