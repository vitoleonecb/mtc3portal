import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import cors from 'cors';

import { usersRouter } from './users.js';
import { workshopsRouter } from './workshops.js';
import { productionsRouter } from './productions.js';
import { analyticsRouter } from "./analytics.js";
import { materialsRouter } from "./materials.js";
import { cycleRouter } from "./cycleScheduler.js";
import { stripeRouter } from "./stripe.js";
import { showcasesRouter } from "./showcases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

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

// Stripe webhook needs raw body for signature verification —
// mount it BEFORE the global express.json() parser.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/workshops', workshopsRouter);
app.use('/api/productions', productionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/cycle', cycleRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/showcases', showcasesRouter);

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

// Start the HTTP server in normal app contexts. Scripts that only need
// the DB pool (e.g. AI analysis scripts) can set DISABLE_APP_LISTEN=true
// *before* importing any modules that depend on this file.
if (!process.env.DISABLE_APP_LISTEN) {
  app.listen(PORT, () => {
    console.log(`Server Listening on ${PORT}`);
  });
}

