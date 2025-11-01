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

export function authenticateToken(req, res, next) {
    verifyToken(req, res, next, false);
}

export function authenticateTokenAdmin(req, res, next) {
    verifyToken(req, res, next, true);
}

async function verifyToken(req, res, next, isAdmin) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('No Access Token Provided');
    }

    try {
        const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (isAdmin) {
            const [results] = await connection.query(
                'SELECT COUNT(*) as count FROM users WHERE email = ? AND user_type = "admin"',
                [user.email]
            );

            if (results[0].count === 0) {
                return res.status(403).send('Access Denied: admin privileges required');
            }
        }

        req.user = user;
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

