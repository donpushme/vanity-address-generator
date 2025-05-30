import mongoose from "mongoose";

const tokenAddressSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true },
    key: { type: String, required: true, unique: true }
});

const TokenAddress = mongoose.model("TokenAddress", tokenAddressSchema);

export default TokenAddress;
