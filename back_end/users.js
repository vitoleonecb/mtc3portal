import express from 'express';
import jwt from 'jsonwebtoken';
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js'; 

export const usersRouter = express.Router();

usersRouter.get('', authenticateToken, async (req, res, next) => {
    try{
        const [results] = await connection.query('SELECT * FROM users'); 
        res.status(200).json(results);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`)
    }    
    });

usersRouter.post('/login', async (req, res, next) => {
    try {
        const {email, password} = req.body;
        console.log(email);
        const [rows] = await connection.query('CALL login_auth(?, ?, @msg); SELECT @msg as msg', [email, password]);
        if (!process.env.ACCESS_TOKEN_SECRET) {
            throw new Error("Missing ACCESS_TOKEN_SECRET environment variable");
        }
        const [[user_id]] = await connection.query(
            'SELECT user_id FROM users WHERE email = ?', 
            [email]
        );
        console.log(process.env.ACCESS_TOKEN_SECRET)
        const accessToken = jwt.sign({email: email, user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
        console.log(`Access token signed: ${accessToken}`);
        res.status(200).json({accessToken: accessToken});
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

usersRouter.get('/:id', authenticateToken, async(req, res, next) => {
    try {
        const id = req.params.id;
        const [results] = await connection.query('SELECT * FROM users WHERE user_id = ?', [id])
        console.log(`User With Id: ${id} Found`)
        res.status(200).send(results)
    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

usersRouter.put('/:id/update/email', authenticateToken, async (req, res, next) => {
    try {
        const {newEmail} = req.body;
        const [results] = await connection.query('UPDATE users SET email = ? WHERE user_id = ?', [newEmail, req.params.id]);
        res.status(203).send(results);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

usersRouter.post('', authenticateToken, async (req, res, next) => {
    try {
        const {userName, email, firstName, lastName, userPassword, userPhone} = req.body;
        const [rows] = await connection.query('CALL email_check( ?, ?, ?, ?, ?, ?, @message); SELECT @message as message;', [userName, email, firstName, lastName, userPassword, userPhone]);
        res.status(201).json(rows[1]);
    }
    catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

usersRouter.post('/registration', async (req, res, next) => {
    try {
        console.log(req.body);
        const {username, email, first_name, last_name, user_password, user_type, user_phone} = req.body;
        const [userNameRows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        const [emailRows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (userNameRows.length > 0 || emailRows.length > 0) {
            return res.status(400).send('username or email already exists');
        }
        const [response] = await connection.query('INSERT INTO users (username, email, first_name, last_name, user_password, user_type, user_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',[username, email, first_name, last_name, user_password, user_type, user_phone]);
        res.status(201).send(response);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
})