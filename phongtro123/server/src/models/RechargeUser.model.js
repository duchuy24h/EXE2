const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelRechargeUser = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        amountVND: { type: Number, required: true },
        coin: { type: Number, default: 0 },
        typePayment: { type: String, require: true },
        status: { type: String, require: true, enum: ['pending', 'success', 'failed'] },
        transferCode: { type: String, index: true },
        transactionId: { type: String, index: true },
        paidAt: { type: Date },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('rechargeuser', modelRechargeUser);
