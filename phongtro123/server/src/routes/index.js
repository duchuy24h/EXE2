const userRoutes = require('./users.routes');
const postRoutes = require('./posts.routes');
const paymentsRoutes = require('./payments.routes');
const messengerRoutes = require('./messenger.routes');
const favouriteRoutes = require('./favourite.routes');
const passRoomRoutes = require('./passRoom.routes');
const roommateController = require('../controllers/roommate.controller');
const { authUser } = require('../auth/checkAuth');

const multer = require('multer');
const path = require('path');

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/images');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép ảnh JPG, PNG hoặc WEBP'));
    }
};

var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 6,
    },
});

const getPublicBaseUrl = (req) => {
    const fromEnv = (process.env.PUBLIC_BASE_URL || process.env.SERVER_PUBLIC_URL || '')
        .trim()
        .replace(/\/$/, '');
    if (fromEnv) {
        return fromEnv;
    }
    const protocol = req.protocol || 'http';
    const host = req.get('host');
    if (host) {
        return `${protocol}://${host}`;
    }
    return 'http://localhost:3000';
};

const buildUploadUrl = (req, filename) => {
    return `${getPublicBaseUrl(req)}/uploads/images/${filename}`;
};

function routes(app) {
    app.post('/api/register', userRoutes);
    app.post('/api/login', userRoutes);
    app.post('/api/login-google', userRoutes);
    app.get('/api/auth', userRoutes);
    app.get('/api/logout', userRoutes);
    app.get('/api/refresh-token', userRoutes);
    app.get('/api/recharge-user', userRoutes);
    app.post('/api/update-user', userRoutes);
    app.post('/api/change-password', userRoutes);
    app.post('/api/roommate/profile', userRoutes);
    app.post('/api/roommate/send-otp', userRoutes);
    app.post('/api/roommate/verify-otp', userRoutes);
    app.get('/api/roommate/suggestions', authUser, (req, res) => roommateController.getSuggestions(req, res));
    app.post('/api/roommate/swipe', authUser, (req, res) => roommateController.swipe(req, res));
    app.get('/api/roommate/liked-you', authUser, (req, res) => roommateController.getLikedYou(req, res));
    app.get('/api/roommate/matches', authUser, (req, res) => roommateController.getMatches(req, res));

    app.get('/api/get-users', userRoutes);
    app.get('/api/get-admin-stats', userRoutes);
    app.get('/api/get-recharge-stats', userRoutes);

    app.get('/api/get-hot-search', userRoutes);
    app.get('/api/search', userRoutes);

    app.post('/api/add-search-keyword', userRoutes);
    app.get('/api/get-search-keyword', userRoutes);

    app.post('/api/forgot-password', userRoutes);
    app.post('/api/reset-password', userRoutes);

    /// posts
    app.post('/api/create-post', postRoutes);
    app.get('/api/get-posts', postRoutes);
    app.get('/api/get-post-by-id', postRoutes);
    app.get('/api/get-post-by-user-id', postRoutes);
    app.get('/api/get-new-post', postRoutes);
    app.get('/api/get-post-vip', postRoutes);
    app.post('/api/delete-post', postRoutes);

    app.post('/api/create-pass-room', passRoomRoutes);
    app.get('/api/get-pass-rooms', passRoomRoutes);
    app.get('/api/get-pass-room-by-id', passRoomRoutes);
    app.post('/api/purchase-pass-room', passRoomRoutes);

    //// admin post
    app.get('/api/get-all-posts', postRoutes);
    app.post('/api/approve-post', postRoutes);
    app.post('/api/reject-post', postRoutes);

    /// payments
    app.post('/api/payments', paymentsRoutes);
    app.post('/api/payments/qr', paymentsRoutes);
    app.post('/api/webhooks/sepay', paymentsRoutes);
    app.get('/api/check-payment-vnpay', paymentsRoutes);
    app.get('/api/check-payment-momo', paymentsRoutes);

    /// post suggest
    app.get('/api/post-suggest', postRoutes);

    /// messenger
    app.post('/api/create-message', messengerRoutes);
    app.get('/api/get-messages', messengerRoutes);
    app.get('/api/get-messages-by-user-id', messengerRoutes);
    app.post('/api/mark-message-read', messengerRoutes);
    app.post('/api/mark-all-messages-read', messengerRoutes);

    //// favourite
    app.post('/api/create-favourite', favouriteRoutes);
    app.post('/api/delete-favourite', favouriteRoutes);
    app.get('/api/get-favourite', favouriteRoutes);

    ///// uploads — URL theo PUBLIC_BASE_URL / request host; validate MIME + size
    app.post('/api/upload-images', (req, res, next) => {
        upload.array('images')(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Upload ảnh thất bại',
                });
            }
            next();
        });
    }, (req, res) => {
        const files = req.files || [];
        if (!files.length) {
            return res.status(400).json({
                success: false,
                message: 'Không có file ảnh',
            });
        }
        return res.status(200).json({
            message: 'Images uploaded successfully',
            images: files.map((file) => buildUploadUrl(req, file.filename)),
        });
    });

    app.post('/api/upload-image', (req, res, next) => {
        upload.single('avatar')(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Upload ảnh thất bại',
                });
            }
            next();
        });
    }, (req, res) => {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file ảnh',
            });
        }
        return res.status(200).json({
            message: 'Image uploaded successfully',
            image: buildUploadUrl(req, file.filename),
        });
    });

    app.get('/api/get-affiliate-products', postRoutes);
    app.post('/api/add-affiliate-product', postRoutes);
    app.post('/api/update-affiliate-product', postRoutes);
    app.post('/api/delete-affiliate-product', postRoutes);

    app.get('/admin', userRoutes);
}

module.exports = routes;