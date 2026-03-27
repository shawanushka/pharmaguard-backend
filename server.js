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

// --- BLOCKCHAIN CONFIG (Your existing setup) ---
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

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ PharmaGuard Hybrid Cloud: Active"))
  .catch((err) => console.log("❌ DB Error:", err));

// --- ROUTES ---

// 1. REGISTER: Create Digital Twin (Includes Parent-Child Link)
app.post('/register', async (req, res) => {
    try {
        const newDrug = new Drug(req.body);
        
        // Generate Blockchain ID (Simulating On-Chain Minting)
        const txHash = ethers.id(req.body.batchID + Date.now()); 
        newDrug.blockchainHash = txHash;

        await newDrug.save();
        res.status(201).send({ 
            message: "Digital Twin & Parent-Child Link Created! 🛡️", 
            onChainHash: txHash,
            data: newDrug 
        });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// 2. TRANSFER: Update Journey (Audit Trail)
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

// 3. THE AUTONOMOUS KILL-SWITCH (Regulatory Recall)
app.put('/recall/:id', async (req, res) => {
    try {
        const updated = await Drug.findOneAndUpdate(
            { batchID: req.params.id }, 
            { isSafe: false }, 
            { new: true }
        );
        res.status(200).send({ 
            message: "🚨 KILL-SWITCH ACTIVATED: Batch invalidated globally.", 
            status: "UNSAFE" 
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 4. VERIFY: Patient Gateway (Includes Auto-Expiry Check)
app.get('/verify/:id', async (req, res) => {
    try {
        const drug = await Drug.findOne({ batchID: req.params.id });
        if (!drug) return res.status(404).send({ message: "❌ FAKE DRUG DETECTED: No Ledger Entry." });
        
        // Logic: Check if it's expired OR manually recalled
        const isExpired = new Date() > new Date(drug.expiryDate);

        if (!drug.isSafe || isExpired) {
            return res.status(403).send({ 
                message: isExpired ? "🚨 RECALL ALERT: Drug Expired!" : "⚠️ RECALLED: Do not consume!",
                details: drug 
            });
        }
        
        res.status(200).send({ message: "✅ Authentic & Safe", details: drug });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 PharmaGuard Node running on http://localhost:${PORT}`));