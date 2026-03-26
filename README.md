# 💊 PharmaGuard Backend - Team AltF4

Digital Twin Supply Chain Tracking System for DATATHON 2026.

## 🚀 Tech Stack
- **Node.js & Express** (Server Logic)
- **MongoDB Atlas** (Cloud Database)
- **Mongoose** (Data Modeling)

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/register` | Create a new Digital Twin for a drug batch. |
| **GET** | `/verify/:id` | Check drug authenticity and safety status. |
| **PUT** | `/recall/:id` | Mark a batch as UNSAFE (Kill Switch). |
| **POST** | `/transfer/:id`| Update ownership (Supply Chain tracking). |
| **GET** | `/inventory` | View all registered drug batches. |

## 🛠️ Setup
1. Run `npm install`
2. Create a `.env` file with `MONGO_URI`.
3. Start server with `nodemon server.js`.