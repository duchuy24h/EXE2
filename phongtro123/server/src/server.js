require('dotenv').config();

const express = require('express');
const app = express();
const fs = require('fs');
const defaultPort = Number(process.env.PORT) || 3000;

// Danh sách origin được phép truy cập (HTTP API + Socket.IO)
const isAllowedOrigin = (origin) => {
    const allowedOrigins = [
        process.env.CLIENT_URL,
        'https://homiehub.com.vn',
        'https://www.homiehub.com.vn',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
    ].filter(Boolean);

    return (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^https:\/\/.*\.ngrok-free\.(dev|app)$/.test(origin)
    );
};

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    transports: ['polling', 'websocket'],
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                return callback(null, true);
            }
            return callback(new Error('CORS origin not allowed'));
        },
        credentials: true,
    },
});

const startServer = (port) => {
    server.once('error', (error) => {
        if (error && error.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            console.warn(`Port ${port} đang bị chiếm, thử port ${nextPort}...`);
            startServer(nextPort);
            return;
        }

        console.error('Lỗi khởi động server:', error);
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
};

global.io = io;

const bodyParser = require('body-parser');
const cookiesParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const cookie = require('cookie');

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));

const connectDB = require('./config/ConnectDB');
const routes = require('./routes/index');
const { verifyToken } = require('./services/tokenSevices');
const modelMessager = require('./models/Messager.model');
const { askQuestion } = require('./utils/Chatbot/chatbot');
const { AiSearch } = require('./utils/AISearch/AISearch');
const socketServices = require('./services/socketServices');

app.use(express.static(path.join(__dirname, '../src')));
app.use(cookiesParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

routes(app);

connectDB();

app.use((req, res, next) => {
    req.io = io;
    next();
});

global.io.on('connect', socketServices.connection);

app.post('/chat', async (req, res) => {
    const { question } = req.body;
    const data = await askQuestion(question);
    return res.status(200).json(data);
});

app.get('/ai-search', async (req, res) => {
    const { question } = req.query;
    console.log('question', question);
    const data = await AiSearch(question);
    return res.status(200).json(data);
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

app.post('/api/add-search', (req, res) => {
    const { title } = req.body;
    const index = hotSearch.findIndex((item) => item.title === title);
    if (index !== -1) {
        hotSearch[index].count++;
    } else {
        hotSearch.push({ title, count: 1 });
    }
    return res.status(200).json({ message: 'Thêm từ khóa thành công' });
});

startServer(defaultPort);
