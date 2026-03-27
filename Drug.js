const mongoose = require('mongoose');

const DrugSchema = new mongoose.Schema({
    batchID: { type: String, required: true, unique: true },
    parentBatchID: { type: String, default: null }, // 📦 PDF Requirement: Parent-Child Linking
    drugName: { type: String, required: true },
    manufacturer: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    isSafe: { type: Boolean, default: true }, // 🛑 The Kill-Switch state
    owner: { type: String, default: "Manufacturer" },
    blockchainHash: { type: String }, // 🔗 Immutable Ledger Hash
    
    // 🛤️ PDF Requirement: Full Audit Trail
    ownershipHistory: [{
        from: String,
        to: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Drug', DrugSchema);