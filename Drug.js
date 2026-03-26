const mongoose = require('mongoose');

const DrugSchema = new mongoose.Schema({
    batchID: { 
        type: String, 
        required: true, 
        unique: true 
    },
    drugName: { 
        type: String, 
        required: true 
    },
    manufacturer: { 
        type: String, 
        required: true 
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    isSafe: { 
        type: Boolean, 
        default: true 
    },
    owner: { 
        type: String, 
        default: "Manufacturer" 
    },
    // 🛤️ FEATURE 1: Ownership History (The Audit Trail)
    ownershipHistory: [{
        from: String,
        to: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Drug', DrugSchema);