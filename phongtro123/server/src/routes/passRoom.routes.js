const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');
const passRoomController = require('../controllers/passRoom.controller');

router.post('/api/create-pass-room', authUser, asyncHandler(passRoomController.createPassRoom));
router.get('/api/get-pass-rooms', asyncHandler(passRoomController.getPassRooms));
router.get('/api/get-pass-room-by-id', asyncHandler(passRoomController.getPassRoomById));
router.post('/api/purchase-pass-room', authUser, asyncHandler(passRoomController.purchasePassRoom));

module.exports = router;
