require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

connectDB();

app.use(cors());
app.use(express.json({ extended: false }));

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/chat', require('./routes/chat'));
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket:', socket.id);
    const token = socket.handshake.auth.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.join(decoded.agency.id);
            console.log(`Socket ${socket.id} joined room for agency ${decoded.agency.id}`);
        } catch (error) {
            console.log("Invalid token for socket connection.");
        }
    }
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/', (req, res) => res.send('API Running'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/agencies', require('./routes/agencies'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server (with Socket.IO) started on port ${PORT}`));
