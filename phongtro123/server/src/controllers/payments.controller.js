const axios = require('axios');
const crypto = require('crypto');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');

const modelUser = require('../models/users.model');
const modelRechargeUser = require('../models/RechargeUser.model');

const { v4: uuidv4 } = require('uuid');

class PaymentsController {
    async createQrPayment(req, res) {
        const { id } = req.user;
        const amount = Number(req.body.amount);

        if (!Number.isInteger(amount) || amount < 10000) {
            throw new BadRequestError('Số tiền nạp tối thiểu là 10.000 VND');
        }

        const transferCode = `PHONGTRO${String(id).slice(-6).toUpperCase()}${Date.now().toString().slice(-6)}`;
        await modelRechargeUser.create({
            userId: id,
            amountVND: amount,
            coin: 0,
            typePayment: 'MB_QR',
            status: 'pending',
            transferCode,
        });

        const qrUrl = `https://img.vietqr.io/image/MB-200455556669-compact2.png?amount=${amount}&addInfo=${transferCode}&accountName=NGUYEN%20DUC%20HUY`;
        return new OK({
            message: 'Tạo mã QR nạp tiền thành công',
            metadata: { amount, transferCode, qrUrl },
        }).send(res);
    }

    async receiveSepayWebhook(req, res) {
        const configuredToken = process.env.SEPAY_WEBHOOK_TOKEN;
        const authorization = req.headers.authorization || '';
        const expectedAuthorization = [`Apikey ${configuredToken}`, `Bearer ${configuredToken}`];
        if (!configuredToken || !expectedAuthorization.includes(authorization)) {
            return res.status(401).json({ message: 'Webhook token không hợp lệ' });
        }

        const payload = req.body || {};
        const transferAmount = Number(payload.transferAmount ?? payload.amount ?? payload.transfer_amount ?? 0);
        const transferContent = String(payload.content || payload.description || payload.transferContent || payload.code || '');
        const transactionId = String(payload.id || payload.referenceCode || payload.transactionId || '');
        const transferCode = transferContent.match(/PHONGTRO[A-Z0-9]+/i)?.[0]?.toUpperCase();
        const transaction = await modelRechargeUser.findOne({
            transferCode,
            status: 'pending',
        });

        if (!transaction) {
            return res.status(200).json({ message: 'Giao dịch đã xử lý hoặc không khớp mã nạp' });
        }
        if (!Number.isFinite(transferAmount) || transferAmount < transaction.amountVND) {
            return res.status(400).json({ message: 'Số tiền chuyển khoản không đủ' });
        }

        const updated = await modelRechargeUser.findOneAndUpdate(
            { _id: transaction._id, status: 'pending' },
            { $set: { status: 'success', paidAt: new Date(), transactionId } },
            { new: true },
        );
        if (!updated) {
            return res.status(200).json({ message: 'Giao dịch đã xử lý' });
        }

        const user = await modelUser.findByIdAndUpdate(
            transaction.userId,
            { $inc: { coin: transaction.coin } },
            { new: true },
        );
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        const socket = global.usersMap?.get(String(user._id));
        if (socket) {
            socket.emit('new-payment', {
                userId: user._id,
                amount: transaction.amountVND,
                coin: transaction.coin,
                date: updated.paidAt,
                typePayment: 'MB_QR',
                transactionId: String(updated._id),
            });
        }
        return res.status(200).json({ message: 'Đã cộng tiền vào tài khoản' });
    }

    async payments(req, res) {
        const { id } = req.user;
        const { typePayment, amountUser } = req.body;

        if (!typePayment) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        if (typePayment === 'MOMO') {
            var partnerCode = 'MOMO';
            var accessKey = 'F8BBA842ECF85';
            var secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = `nap tien ${id}`; // nội dung giao dịch thanh toán
            var redirectUrl = 'http://localhost:3000/api/check-payment-momo'; // 8080
            var ipnUrl = 'http://localhost:3000/api/check-payment-momo';
            var amount = amountUser;
            var requestType = 'captureWallet';
            var extraData = ''; //pass empty value if your merchant does not have stores

            var rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;
            //puts raw signature

            //signature
            var signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'en',
            });

            const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            new OK({ message: 'Thanh toán thông báo', metadata: response.data }).send(res);
        }
        if (typePayment === 'VNPAY') {
            const vnpay = new VNPay({
                tmnCode: 'DH2F13SW',
                secureSecret: 'NXZM3DWFR0LC4R5VBK85OJZS1UE9KI6F',
                vnpayHost: 'https://sandbox.vnpayment.vn',
                testMode: true, // tùy chọn
                hashAlgorithm: 'SHA512', // tùy chọn
                loggerFn: ignoreLogger, // tùy chọn
            });
            const uuid = uuidv4();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const vnpayResponse = await vnpay.buildPaymentUrl({
                vnp_Amount: amountUser, //
                vnp_IpAddr: '127.0.0.1', //
                vnp_TxnRef: `${id}-${uuid}`,
                vnp_OrderInfo: `nap tien ${id}`,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: `http://localhost:3000/api/check-payment-vnpay`, //
                vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
                vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
                vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
            });
            new OK({ message: 'Thanh toán thông báo', metadata: vnpayResponse }).send(res);
        }
    }

    async checkPaymentMomo(req, res, next) {
        const { orderInfo, resultCode, amount } = req.query;

        if (resultCode === '0') {
            const result = orderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });

            if (findUser) {
                const coin = Number(amount) / 1000;

                findUser.coin += coin;
                await findUser.save();

                const newTransaction = await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: Number(amount),
                    typePayment: 'MOMO',
                    status: 'success',
                });

                const socket = global.usersMap.get(findUser._id.toString());

                if (socket) {
                    socket.emit('new-payment', {
                        userId: findUser._id,
                        amount: Number(amount),
                        coin: coin,
                        date: new Date(),
                        typePayment: 'MOMO',
                        transactionId: String(newTransaction._id),
                    });
                }

                return res.redirect(`http://localhost:5173/trang-ca-nhan`);
            }
        }
        return res.redirect(`http://localhost:5173/trang-ca-nhan`);
    }

    async checkPaymentVnpay(req, res) {
        const { vnp_ResponseCode, vnp_OrderInfo, vnp_Amount } = req.query;

        if (vnp_ResponseCode === '00') {
            const result = vnp_OrderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });

            if (findUser) {
                const amountVND = Number(vnp_Amount.slice(0, -2));
                const coin = amountVND / 1000;

                findUser.coin += coin;
                await findUser.save();

                const newTransaction = await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: amountVND,
                    typePayment: 'VNPAY',
                    status: 'success',
                });

                const socket = global.usersMap.get(findUser._id.toString());

                if (socket) {
                    socket.emit('new-payment', {
                        userId: findUser._id,
                        amount: amountVND,
                        coin: coin,
                        date: new Date(),
                        typePayment: 'VNPAY',
                        transactionId: String(newTransaction._id),
                    });
                }

                return res.redirect(`http://localhost:5173/trang-ca-nhan`);
            }
        }

        return res.redirect(`http://localhost:5173/trang-ca-nhan`);
    }
}
module.exports = new PaymentsController();