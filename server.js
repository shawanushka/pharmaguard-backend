const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();
const Drug = require('./Drug');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- 💎 BLOCKCHAIN CONFIG ---
let wallet;
try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://rpc.ankr.com/eth_sepolia");
    if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length > 10 && !process.env.PRIVATE_KEY.includes("Your")) {
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log("💎 Blockchain Wallet Linked!");
    } else {
        console.log("⚠️ Simulation Mode: Running Off-Chain logic.");
    }
} catch (err) {
    console.log("⚠️ Blockchain connection skipped.");
}

// --- 🔌 DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ PharmaGuard Hybrid Cloud: Active"))
  .catch((err) => console.log("❌ DB Error:", err));

// --- 🚀 ROUTES ---

// 1. REGISTER: Create Digital Twin
app.post('/register', async (req, res) => {
    try {
        const newDrug = new Drug(req.body);
        const txHash = ethers.id(req.body.batchID + Date.now()); 
        newDrug.blockchainHash = txHash;
        await newDrug.save();
        res.status(201).send({ message: "Digital Twin Signed! 🛡️", onChainHash: txHash, data: newDrug });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// 2. TRANSFER: Update Journey (Traceability)
app.post('/transfer/:id', async (req, res) => {
    try {
        const { newOwner } = req.body;
        const drug = await Drug.findOne({ batchID: req.params.id });
        if (!drug) return res.status(404).send({ message: "Drug not found." });

        drug.ownershipHistory.push({ from: drug.owner, to: newOwner });
        drug.owner = newOwner;
        await drug.save();
        res.status(200).send({ message: "Ownership Ledger Updated!", data: drug });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 3. RECALL: Autonomous Kill-Switch
app.put('/recall/:id', async (req, res) => {
    try {
        const updated = await Drug.findOneAndUpdate({ batchID: req.params.id }, { isSafe: false }, { new: true });
        res.status(200).send({ message: "🚨 KILL-SWITCH ACTIVATED: Batch invalidated.", status: "UNSAFE" });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 4. VERIFY: Patient Gateway (Includes Auto-Expiry & Digital Proof)
app.get('/verify/:id', async (req, res) => {
    try {
        const drug = await Drug.findOne({ batchID: req.params.id });
        if (!drug) return res.status(404).send({ message: "❌ FAKE: No record found." });

        const isExpired = new Date() > new Date(drug.expiryDate);
        if (!drug.isSafe || isExpired) {
            return res.status(403).send({ 
                message: isExpired ? "🚨 Kill-Switch: EXPIRED" : "⚠️ Kill-Switch: RECALLED",
                proof: drug.blockchainHash,
                details: drug 
            });
        }
        res.status(200).send({ message: "✅ Authentic & Safe", digitalBirthCertificate: drug.blockchainHash, details: drug });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 5. SPLIT: Parent-Child Tokenization
app.post('/split-batch/:id', async (req, res) => {
    try {
        const parentDrug = await Drug.findOne({ batchID: req.params.id });
        if (!parentDrug) return res.status(404).send({ message: "Parent batch not found." });

        const { childID, newOwner } = req.body;
        const childDrug = new Drug({
            batchID: childID,
            parentBatchID: parentDrug.batchID,
            drugName: parentDrug.drugName,
            manufacturer: parentDrug.manufacturer,
            expiryDate: parentDrug.expiryDate,
            owner: newOwner,
            blockchainHash: ethers.id(childID + Date.now())
        });

        await childDrug.save();
        res.status(201).send({ message: "Child unit split from Parent! 🧩", data: childDrug });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 6. STATS: Real-time Visibility Dashboard
app.get('/stats', async (req, res) => {
    try {
        const total = await Drug.countDocuments();
        const recalled = await Drug.countDocuments({ isSafe: false });
        const manufacturers = await Drug.distinct('manufacturer');
        res.status(200).send({ totalBatches: total, flaggedUnsafe: recalled, activeManufacturers: manufacturers.length });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 PharmaGuard Node at http://localhost:${PORT}`));