# ⚡ Spark – Real-Time Messenger Platform
Hey,
> A modern, blazing-fast real-time messaging platform built with MERN stack. Ignite connections with instant communication, crystal-clear quality, and seamless collaboration.
> It’s \*\*free for personal use\*\*.
> 👉 [Get a Commercial License + Full Code](https://techwithemma.gumroad.com/l/puvbkz)
> 👉 [Read License Terms](https://github.com/TechWithEmmaYT/MERN-RealTime-Messagers-Platform/blob/main/TECHWITHEMMA-LICENSE.md)

---
## 🤖 Get the Full Source code (Spark AI Code Included)

This GitHub code includes only the core real-time messenger platform.
To add **AI-powered conversations** (like Meta AI in Messenger), get the **Spark AI Source code**.

- 📡 Real-time streaming via WebSocket
- 🧠 Context-aware AI chat replies
- 🔌 Secure backend + frontend AI setup
- ⚙️ Ready local setup

👉 [Get the Full Code + Whop AI Integration](https://techwithemma.gumroad.com/l/btzdi)

---

## ❤️ Support TechWithEmma

If you love this project and want to support future ones:

- ☕ [Buy Me a Coffee](https://buymeacoffee.com/techwithemmaofficial)
- 🌟 Star this repo
- 🎥 [Subscribe on YouTube](https://tinyurl.com/subcribe-to-techwithEmma)

---

## 🗝️ Key Features

- ✅ Authentication with Secure Cookies
- 🔌 Real-Time Messaging via WebSocket (Socket.io)
- 💬 Create One-on-One or Group Chats
- 👥 Join & Leave Rooms in Real-Time
- 🟢 Online / Offline User Presence
- 💬 Reply to Specific Messages
- ⚡ Real-Time Last Message Updates
- 🤖 Spark AI – Built-in Chat Intelligence
- 📁 File Upload with Cloudinary Integration
- 🌗 Light & Dark Mode
- 📱 Fully Responsive UI
- 🎨 Styled with  **Shadcn/UI**
- 🧩 Built with **Node.js**, **MongoDB**, **React**
- 🚀 Deployment Ready

---

## 📘 Documentation (Basic to Advanced),

### 1) Beginner Overview (What the app does)
Spark is a real-time messaging app. Users can sign up, log in, chat in real time, share images/voice notes, and make audio/video calls. It works like WhatsApp or Messenger but is built with React (frontend) and Node.js (backend).

### 2) Folder Structure (Where to look)

**Frontend (client):**
- `client/src/pages`: screens like login, signup, and chat
- `client/src/components`: reusable UI pieces (chat list, message bubble, call UI)
- `client/src/hooks`: app logic (auth, chat, socket, call)
- `client/src/lib`: helpers and API client

**Backend (backend):**
- `backend/src/index.js`: server entry
- `backend/src/routes`: API endpoints
- `backend/src/controllers`: request handling
- `backend/src/services`: business logic
- `backend/src/models`: database tables (Sequelize)
- `backend/src/lib/socket.js`: real-time socket events

### 3) How Data Flows (Simple)
1. User logs in (API request to backend).
2. Backend returns a secure auth cookie.
3. Frontend connects to Socket.io for real-time events.
4. Messages are sent to the backend and saved in the database.
5. Backend emits the message to the other user instantly via Socket.io.

### 4) Core Features (Intermediate)
**Authentication**
- Login/signup with secure cookies and JWT.

**Real-time messaging**
- Socket.io keeps a live connection for fast delivery.

**Voice messages**
- Browser records audio, converts it to base64, and sends to backend.

**Audio/Video calls**
- WebRTC connects users directly (peer-to-peer).
- Socket.io is used only for call signaling.

### 5) Advanced Architecture (Detailed)

**Frontend**
- React + Zustand for state management
- Axios for REST APIs
- Socket.io-client for real-time updates
- WebRTC for calls

**Backend**
- Express handles REST endpoints
- Passport JWT validates users
- Sequelize handles database queries
- Socket.io manages online presence and messages

---

## 🗄️ Database (PostgreSQL)

### Main Tables,

**users**
- `id` (UUID, primary key)
- `name` (string)
- `email` (string, unique)
- `password` (string, hashed)
- `avatar` (text, base64 or null)
- `createdAt`, `updatedAt` (timestamps)

**chats**
- `id` (UUID, primary key)
- `type` (private or group)
- `createdAt`, `updatedAt`

**chat_participants**
- `chatId` (foreign key to chats)
- `userId` (foreign key to users)
- `createdAt`

**messages**
- `id` (UUID, primary key)
- `chatId` (foreign key to chats)
- `senderId` (foreign key to users)
- `content` (text or null)
- `imageUrl` (text/base64 or null)
- `voiceUrl` (text/base64 or null)
- `createdAt`, `updatedAt`

### Relationship Summary
- A user can be in many chats (many-to-many via chat_participants).
- A chat can have many messages.
- Each message belongs to one chat and one sender.

---

## 🔄 Workflow Examples

### Send a Text Message
1. Frontend sends `POST /api/message`.
2. Backend validates the user and saves the message.
3. Backend emits `message:new` via Socket.io.

### Voice Call Flow
1. Caller clicks call -> frontend requests microphone.
2. Backend sends an incoming call event.
3. Receiver accepts -> WebRTC offer/answer exchange.
4. Audio streams connect directly between users.

---

## 📡 API Documentation (REST)

### Auth
- `POST /api/auth/signup`
	- Body: `{ name, email, password }`
	- Returns: `{ user, message }` and sets auth cookie
- `POST /api/auth/signin`
	- Body: `{ email, password }`
	- Returns: `{ user, message }` and sets auth cookie
- `GET /api/auth/status`
	- Returns: `{ user }` if logged in
- `POST /api/auth/signout`
	- Clears auth cookie

### Users
- `GET /api/user/all`
	- Returns: list of users (for new chat search)

### Chats
- `POST /api/chat`
	- Body: `{ participantId }`
	- Returns: existing or new chat
- `GET /api/chat/all`
	- Returns: all chats for current user
- `GET /api/chat/:id`
	- Returns: `{ chat, messages }`

### Messages
- `POST /api/message`
	- Body (text): `{ chatId, content }`
	- Body (image): `{ chatId, image }` (base64)
	- Body (voice): `{ chatId, voiceData }` (base64)
	- Returns: created message

---

## 🔌 Socket Events (Real-Time)

### Presence
- `online:users` -> list of online userIds

### Messaging
- `message:new` -> new message for a chat

### Calls (Signaling)
- `call:request` -> start call
- `call:incoming` -> incoming call event
- `call:accept` -> receiver accepts
- `call:reject` -> receiver rejects
- `call:offer` / `call:answer` -> WebRTC SDP exchange
- `call:ice` -> ICE candidate exchange
- `call:end` -> end call

---

## ⚙️ Environment Setup

### Backend (.env)
Create `backend/.env`:

```
NODE_ENV=development
PORT=8002
JWT_SECRET=your_secret_key
DATABASE_URL=postgres://postgres:12345@localhost:5432/realtimechat
```

### Database Setup
1. Install PostgreSQL and create database: `realtimechat`
2. Update `DATABASE_URL` if your username/password differs
3. Backend connects and syncs tables automatically

### Frontend
No .env required by default (uses current hostname).

---

## 🚀 Deployment Guide (Basic)

### Backend (Render / Railway / VPS)
1. Set environment variables:
	 - `NODE_ENV=production`
	 - `PORT=8002`
	 - `JWT_SECRET=your_secret_key`
	 - `DATABASE_URL=your_production_db_url`
2. Install dependencies and run:
	 - `npm install`
	 - `npm start`

### Frontend (Vercel / Netlify)
1. Build frontend:
	 - `npm run build`
2. Deploy `client/dist` folder
3. Ensure backend URL is reachable in production

---

## 🧭 Diagrams

### System Architecture
```mermaid
graph TB
	A[Browser or Mobile] --> B[React Frontend]
	B --> C[REST API]
	B --> D[Socket.io]
	C --> E[Express Backend]
	D --> E
	E --> F[Sequelize ORM]
	F --> G[(PostgreSQL)]
	B --> H[WebRTC P2P Calls]
```

### Database Schema
```mermaid
erDiagram
	USERS ||--o{ CHAT_PARTICIPANTS : joins
	CHATS ||--o{ CHAT_PARTICIPANTS : has
	CHATS ||--o{ MESSAGES : contains
	USERS ||--o{ MESSAGES : sends

	USERS {
		uuid id
		string name
		string email
		string password
		string avatar
		timestamp createdAt
		timestamp updatedAt
	}
	CHATS {
		uuid id
		string type
		timestamp createdAt
		timestamp updatedAt
	}
	CHAT_PARTICIPANTS {
		uuid chatId
		uuid userId
		timestamp createdAt
	}
	MESSAGES {
		uuid id
		uuid chatId
		uuid senderId
		text content
		text imageUrl
		text voiceUrl
		timestamp createdAt
		timestamp updatedAt
	}
```

---

## ✅ Recommended Next Steps (Advanced)
- Add cloud storage for media files (S3/Cloudinary).
- Add message search and pagination.
- Add push notifications for mobile.
- Add group admin roles and moderation.

## 🧠 How to Use This Project

### 📺 Watch the Complete Full Course on YouTube (Include the Spark AI)

Learn how it all works — from real-time messaging to the complete folder structure and design system.

👉 [Watch the Course](https://youtube.com/@techwithemmaofficial)

## 🤖 Want the full code with _Spark AI Integration_?

- 📡 Real-time streaming via WebSocket
- 🧠 Context-aware AI chat replies
- 🔌 Secure backend + frontend AI setup
- ⚙️ Ready configuration

👉 [Get the Full Code + Spark AI Integration](https://techwithemma.gumroad.com/l/btzdi)

---

## 📜 License

A **paid license** is required for commercial use.
👉 [Get License](https://techwithemma.gumroad.com/l/puvbkz)
Read full license here: [TECHWITHEMMA-LICENSE.md](https://github.com/TechWithEmmaYT/MERN-RealTime-Messagers-Platform/blob/main/TECHWITHEMMA-LICENSE.md)

---

## 🌟 Stay Connected

For more premium SaaS & AI projects:

- 🧠 [TechWithEmma Gumroad Store](https://techwithemma.gumroad.com)
- 🎥 [YouTube Channel](https://tinyurl.com/subcribe-to-techwithEmma)
- 💬 [Follow on GitHub](https://github.com/TechWithEmmaYT)
