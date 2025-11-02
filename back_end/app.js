import {productionsRouter} from './productions.js';
import {workshopsRouter} from './workshops.js';
import {usersRouter} from './users.js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import cors from 'cors';

export const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    waitForConnections: true
});

const app = express();

const PORT = process.env.PORT || 3036;

app.use(cors(
    { allowedHeaders: ['Content-Type', 'Authorization'] }
));
app.use(morgan('dev'));
app.use(express.json());

app.use('/users', usersRouter);
app.use('/workshops', workshopsRouter);
app.use('/productions', productionsRouter);

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: {
      PORT: process.env.PORT,
      HAS_ACCESS_SECRET: !!process.env.ACCESS_TOKEN_SECRET,
      DB_HOST: process.env.DB_HOST,
      DB_DB: process.env.DB_DATABASE
    }
  });
});

export async function authenticateToken(req, res, next) {
    await verifyToken(req, res, next, false);
  }
  
export async function authenticateTokenAdmin(req, res, next) {
await verifyToken(req, res, next, true);
}

async function verifyToken(req, res, next, requireAdmin) {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];

if (!token) {
    return res.status(401).send('No Access Token Provided');
}

try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Always fetch full user record
    const [[userRow]] = await connection.query(
    'SELECT user_id, email, user_type FROM users WHERE email = ? LIMIT 1',
    [decoded.email]
    );

    if (!userRow) {
    return res.status(403).send('Invalid user');
    }

    const isAdmin = userRow.user_type === 'admin';

    // If this route requires admin, enforce it
    if (requireAdmin && !isAdmin) {
    return res.status(403).send('Access Denied: admin privileges required');
    }

    // Attach complete info to req.user
    req.user = {
    ...decoded,
    is_admin: isAdmin,
    user_type: userRow.user_type
    };

    next();
} catch (error) {
    return res.status(403).send(`Invalid Token: ${error.message}`);
}
}

app.get('/health', (req,res)=>res.json({ ok:true, env:{
  PORT:process.env.PORT, HAS_ACCESS_SECRET:!!process.env.ACCESS_TOKEN_SECRET,
  DB_HOST:process.env.DB_HOST, DB_DB:process.env.DB_DATABASE
}}));

app.listen(PORT, () => {
    console.log(`Server Listening on ${PORT}`);
});

