const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');
const controller = require('../controllers/affiliateProducts.controller');

router.get('/api/affiliate-products', asyncHandler(controller.getProducts));
router.get('/api/my-affiliate-products', authUser, asyncHandler(controller.getMyProducts));
router.post('/api/affiliate-products', authUser, asyncHandler(controller.createProduct));
router.put('/api/affiliate-products/:productId', authUser, asyncHandler(controller.updateProduct));
router.delete('/api/affiliate-products/:productId', authUser, asyncHandler(controller.deleteProduct));

module.exports = router;
