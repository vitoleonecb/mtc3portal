import {productionsRouter} from './productions.js';
import {workshopsRouter} from './workshops.js';
import {usersRouter} from './users.js';
import dotenv from 'dotenv';
dotenv.config();
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


export async function authenticateToken(req, res, next, isAdmin = false) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).send('No Access Token Provided');

    try {
        const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (isAdmin) {
            const [results] = await connection.query('SELECT COUNT(*) as count FROM users WHERE email = ? AND user_type = "admin"',[user.email]);
            if (results[0].count === 0) {
                return res.status(403).send('Access Denied: admin privileges required');
            };
        }
        req.user = user;
        console.log(req.user);
        next();
    }    
    catch (error) {
        return res.status(403).send(`Invalid Token: ${error}`);
    }
};

export function authenticateTokenAdmin(req, res, next) {
    authenticateToken(req, res, next, true);
    /* query the database to find out if the user object in the signed token should be admin or not */
};

app.listen(PORT, () => {
    console.log(`Server Listening on ${PORT}`);
});

