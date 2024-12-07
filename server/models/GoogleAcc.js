const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GoogleAccSchema = new Schema({
    id: {
        type: String
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    password: {
        type: String
    }
});

const AccountGoogle = mongoose.model('Account', GoogleAccSchema);

module.exports = AccountGoogle;