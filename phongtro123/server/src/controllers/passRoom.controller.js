const modelPassRoom = require('../models/passRoom.model');
const modelUser = require('../models/users.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class ControllerPassRoom {
    async createPassRoom(req, res) {
        const { id } = req.user;
        const { title, category, location, price, area, description, images, phone, kind, decorStyle, shopLink } = req.body;

        if (!title || !category || !location || !price || !area || !description || !phone || !kind) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin pass đồ / decor');
        }

        const normalizedShopLink = typeof shopLink === 'string' ? shopLink.trim() : '';

        const data = await modelPassRoom.create({
            title,
            category,
            location,
            price,
            area,
            description,
            images: images || [],
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

    async getPassRooms(req, res) {
        const { kind, category, decorStyle } = req.query;
        const filter = {};

        if (kind) filter.kind = kind;
        if (category) filter.category = category;
        if (decorStyle) filter.decorStyle = decorStyle;

        const data = await modelPassRoom.find(filter).sort({ createdAt: -1 });

        return new OK({
            message: 'Pass room list fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getPassRoomById(req, res) {
        const { id } = req.query;
        if (!id) {
            throw new BadRequestError('Thiếu id pass room');
        }

        const passRoom = await modelPassRoom.findById(id);
        if (!passRoom) {
            throw new BadRequestError('Không tìm thấy pass room / affiliate decor');
        }

        const seller = await modelUser.findById(passRoom.userId);

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

    async purchasePassRoom(req, res) {
        const { id } = req.user;
        const { passRoomId } = req.body;

        if (!passRoomId) {
            throw new BadRequestError('Thiếu mã gói cần mua');
        }

        const buyer = await modelUser.findById(id);
        const passRoom = await modelPassRoom.findById(passRoomId);

        if (!buyer) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        if (!passRoom) {
            throw new BadRequestError('Gói không tồn tại');
        }

        if (buyer.balance < passRoom.price) {
            throw new BadRequestError('Số dư không đủ để mua gói này');
        }

        buyer.balance -= passRoom.price;
        await buyer.save();

        if (passRoom.userId && passRoom.userId !== id) {
            const seller = await modelUser.findById(passRoom.userId);
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
            message: 'Mua gói thành công, số dư đã được trừ',
            metadata: {
                balance: buyer.balance,
                purchased: true,
            },
        }).send(res);
    }
}

module.exports = new ControllerPassRoom();
