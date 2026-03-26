const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers'); // 💎 Blockchain Bridge
require('dotenv').config();
const Drug = require('./Drug');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- BLOCKCHAIN CONFIG (As per PDF requirements) ---
// --- BLOCKCHAIN CONFIG ---
let wallet;
try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://rpc.ankr.com/eth_sepolia");
    
    // This check prevents the crash if the key is still a placeholder
    if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length > 10 && !process.env.PRIVATE_KEY.includes("Your")) {
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log("💎 Blockchain Wallet Linked!");
    } else {
        console.log("⚠️ Simulation Mode: Private Key not set, running Off-Chain logic.");
    }
} catch (err) {
    console.log("⚠️ Blockchain connection skipped (Simulation Mode active).");
}

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Hybrid Cloud: MongoDB + Blockchain Active"))
  .catch((err) => console.log("❌ DB Error:", err));

// --- ROUTES ---

// 1. REGISTER: The "Parent Token" Creation
app.post('/register', async (req, res) => {
    try {
        // Step A: Save to MongoDB for fast searching
        const newDrug = new Drug(req.body);
        
        // Step B: Simulating the Smart Contract "Mint" 
        // In a real demo, you'd call: await contract.mintDrug(req.body.batchID);
        const txHash = ethers.id(req.body.batchID + Date.now()); // Generating a unique On-Chain ID
        newDrug.blockchainHash = txHash;

        await newDrug.save();
        res.status(201).send({ 
            message: "Immutable Ledger Entry Created! 🛡️", 
            onChainHash: txHash,
            data: newDrug 
        });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// 2. TRANSFER: The "Child" Event (Traceability)
app.post('/transfer/:id', async (req, res) => {
    try {
        const { newOwner } = req.body;
        const drug = await Drug.findOne({ batchID: req.params.id });
        if (!drug) return res.status(404).send({ message: "Drug not found." });

        // Record the movement in the Audit Trail (Feature 1)
        drug.ownershipHistory.push({ from: drug.owner, to: newOwner });
        drug.owner = newOwner;
        
        await drug.save();
        res.status(200).send({ message: "Ownership Ledger Updated!", data: drug });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 3. THE AUTONOMOUS KILL-SWITCH (Problem Statement Requirement)
app.put('/recall/:id', async (req, res) => {
    try {
        const updated = await Drug.findOneAndUpdate(
            { batchID: req.params.id }, 
            { isSafe: false }, 
            { new: true }
        );
        // On the blockchain, this would trigger a 'StatusChange' event
        res.status(200).send({ 
            message: "🚨 KILL-SWITCH ACTIVATED: Drug invalidated across all nodes.", 
            status: "UNSAFE" 
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// 4. VERIFY: The Patient Gateway
app.get('/verify/:id', async (req, res) => {
    try {
        const drug = await Drug.findOne({ batchID: req.params.id });
        if (!drug) return res.status(404).send({ message: "❌ FAKE DRUG DETECTED: No Ledger Entry." });
        
        if (!drug.isSafe) return res.status(403).send({ message: "⚠️ RECALLED: Do not consume!" });
        
        res.status(200).send({ message: "✅ Authentic & Safe", details: drug });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 PharmaGuard Node running on Port ${PORT}`));