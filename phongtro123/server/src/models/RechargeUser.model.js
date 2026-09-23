const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelRechargeUser = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        amountVND: { type: Number, required: true },
        coin: { type: Number, required: true },
        typePayment: { type: String, require: true },
        status: { type: String, require: true },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('rechargeuser', modelRechargeUser);
