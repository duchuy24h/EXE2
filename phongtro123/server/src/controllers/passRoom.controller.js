const modelPassRoom = require('../models/passRoom.model');
const modelUser = require('../models/users.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

/**
 * Validate a single image URL:
 * must be an absolute HTTP/HTTPS URL.
 */
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;

    const trimmed = url.trim();
    if (!trimmed) return false;

    try {
        const parsed = new URL(trimmed);

        return (
            parsed.protocol === 'http:' ||
            parsed.protocol === 'https:'
        );
    } catch {
        return false;
    }
}

/**
 * Normalize and validate images array from request body.
 */
function normalizeAndValidateImages(images) {
    if (images === undefined || images === null) {
        return [];
    }

    if (!Array.isArray(images)) {
        throw new BadRequestError('images phải là mảng URL');
    }

    if (images.length > 20) {
        throw new BadRequestError('Tối đa 20 URL ảnh');
    }

    const cleaned = [];

    for (let i = 0; i < images.length; i++) {
        const item = images[i];

        if (typeof item !== 'string') {
            throw new BadRequestError(
                `images[${i}] phải là chuỗi URL`
            );
        }

        const trimmed = item.trim();

        // Bỏ qua phần tử rỗng
        if (!trimmed) continue;

        if (!isValidImageUrl(trimmed)) {
            throw new BadRequestError(
                `URL ảnh không hợp lệ: ${trimmed}. Chỉ chấp nhận http:// hoặc https://`
            );
        }

        cleaned.push(trimmed);
    }

    return cleaned;
}

/**
 * Parse optional number query parameter.
 *
 * Empty / undefined => null
 * Invalid number => BadRequestError
 */
function parseOptionalNumber(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        throw new BadRequestError(
            `${fieldName} phải là số hợp lệ`
        );
    }

    return number;
}

/**
 * Build MongoDB filter for PassRoom.
 */
function buildPassRoomFilter(query) {
    const {
        kind,
        category,
        decorStyle,
        location,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
    } = query;

    const filter = {};

    // Exact match
    if (kind !== undefined && kind !== '') {
        filter.kind = kind;
    }

    if (category !== undefined && category !== '') {
        filter.category = category;
    }

    if (decorStyle !== undefined && decorStyle !== '') {
        filter.decorStyle = decorStyle;
    }

    // Location: partial match, case-insensitive
    if (location !== undefined && location !== '') {
        filter.location = {
            $regex: location,
            $options: 'i',
        };
    }

    // Number filters
    const parsedMinPrice = parseOptionalNumber(
        minPrice,
        'minPrice'
    );

    const parsedMaxPrice = parseOptionalNumber(
        maxPrice,
        'maxPrice'
    );

    const parsedMinArea = parseOptionalNumber(
        minArea,
        'minArea'
    );

    const parsedMaxArea = parseOptionalNumber(
        maxArea,
        'maxArea'
    );

    // Validate range
    if (
        parsedMinPrice !== null &&
        parsedMaxPrice !== null &&
        parsedMinPrice > parsedMaxPrice
    ) {
        throw new BadRequestError(
            'minPrice không được lớn hơn maxPrice'
        );
    }

    if (
        parsedMinArea !== null &&
        parsedMaxArea !== null &&
        parsedMinArea > parsedMaxArea
    ) {
        throw new BadRequestError(
            'minArea không được lớn hơn maxArea'
        );
    }

    // Price filter
    if (
        parsedMinPrice !== null ||
        parsedMaxPrice !== null
    ) {
        filter.price = {};

        if (parsedMinPrice !== null) {
            filter.price.$gte = parsedMinPrice;
        }

        if (parsedMaxPrice !== null) {
            filter.price.$lte = parsedMaxPrice;
        }
    }

    // Area filter
    if (
        parsedMinArea !== null ||
        parsedMaxArea !== null
    ) {
        filter.area = {};

        if (parsedMinArea !== null) {
            filter.area.$gte = parsedMinArea;
        }

        if (parsedMaxArea !== null) {
            filter.area.$lte = parsedMaxArea;
        }
    }

    return filter;
}

class ControllerPassRoom {

    /**
     * POST - Create PassRoom
     */
    async createPassRoom(req, res) {
        const { id } = req.user;

        const {
            title,
            category,
            location,
            price,
            area,
            description,
            images,
            phone,
            kind,
            decorStyle,
            shopLink,
        } = req.body;

        if (
            !title ||
            !category ||
            !location ||
            !price ||
            !area ||
            !description ||
            !phone ||
            !kind
        ) {
            throw new BadRequestError(
                'Vui lòng nhập đầy đủ thông tin pass đồ / decor'
            );
        }

        const normalizedShopLink =
            typeof shopLink === 'string'
                ? shopLink.trim()
                : '';

        const validatedImages =
            normalizeAndValidateImages(images);

        const data = await modelPassRoom.create({
            title,
            category,
            location,
            price,
            area,
            description,
            images: validatedImages,
            phone,
            shopLink: normalizedShopLink,
            userId: id,
            kind,
            decorStyle: decorStyle || 'modern',
            status: 'inactive',
        });

        return new Created({
            message: 'Tạo pass đồ / decor thành công',
            metadata: data,
        }).send(res);
    }

    /**
     * GET - Get PassRoom list with filters
     *
     * Supported:
     * ?kind=
     * ?category=
     * ?decorStyle=
     * ?location=
     * ?minPrice=
     * ?maxPrice=
     * ?minArea=
     * ?maxArea=
     */
    async getPassRooms(req, res) {
        const filter = buildPassRoomFilter(req.query);

        const data = await modelPassRoom
            .find(filter)
            .sort({ createdAt: -1 });

        return new OK({
            message: 'Pass room list fetched successfully',
            metadata: data,
        }).send(res);
    }

    /**
     * GET - Get PassRoom detail
     */
    async getPassRoomById(req, res) {
        const { id } = req.query;

        if (!id) {
            throw new BadRequestError(
                'Thiếu id pass room'
            );
        }

        const passRoom =
            await modelPassRoom.findById(id);

        if (!passRoom) {
            throw new BadRequestError(
                'Không tìm thấy pass room / affiliate decor'
            );
        }

        const seller =
            await modelUser.findById(passRoom.userId);

        return new OK({
            message: 'Pass room detail fetched successfully',
            metadata: {
                ...passRoom._doc,

                seller: seller
                    ? {
                        _id: seller._id,
                        fullName: seller.fullName,
                        avatar: seller.avatar,
                        phone: seller.phone,
                    }
                    : null,
            },
        }).send(res);
    }

    /**
     * POST - Purchase PassRoom
     */
    async purchasePassRoom(req, res) {
        const { id } = req.user;
        const { passRoomId } = req.body;

        if (!passRoomId) {
            throw new BadRequestError(
                'Thiếu mã gói cần mua'
            );
        }

        const buyer =
            await modelUser.findById(id);

        const passRoom =
            await modelPassRoom.findById(passRoomId);

        if (!buyer) {
            throw new BadRequestError(
                'Người dùng không tồn tại'
            );
        }

        if (!passRoom) {
            throw new BadRequestError(
                'Gói không tồn tại'
            );
        }

        if (buyer.balance < passRoom.price) {
            throw new BadRequestError(
                'Số dư không đủ để mua gói này'
            );
        }

        buyer.balance -= passRoom.price;
        await buyer.save();

        if (
            passRoom.userId &&
            passRoom.userId !== id
        ) {
            const seller =
                await modelUser.findById(
                    passRoom.userId
                );

            if (seller) {
                seller.balance += passRoom.price;
                await seller.save();
            }
        }

        passRoom.purchaseCount += 1;

        if (!passRoom.purchasedBy.includes(id)) {
            passRoom.purchasedBy.push(id);
        }

        await passRoom.save();

        return new OK({
            message:
                'Mua gói thành công, số dư đã được trừ',

            metadata: {
                balance: buyer.balance,
                purchased: true,
            },
        }).send(res);
    }
}

module.exports = new ControllerPassRoom();