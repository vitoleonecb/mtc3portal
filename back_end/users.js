import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js';

const SALT_ROUNDS = 10;

export const usersRouter = express.Router();

///
///
/// ADMIN AUTOMATION LEVEL
///
///

usersRouter.get('/list', authenticateTokenAdmin, async(req, res, next) => {
    console.log("Decoded token:", req.user);
    try {
        const [results] = await connection.query('SELECT * FROM users');
        res.status(200).send(results);
    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});


///
///
/// GENERAL ACCESS
///
///

usersRouter.get('/:id/isadmin', authenticateToken, async (req, res, next) => {
		const { id } = req.params;
		try {
			const [rows] = await connection.query('SELECT COUNT(*) AS admin_count FROM users WHERE user_type = "admin" AND user_id = ?',[id]);
			console.log(rows);
			res.status(200).json(rows[0].admin_count);
		} catch (error) {
			res.status(500).send(`Internal Server Error: ${error}`);
		}
	}
	
);

usersRouter.get('', authenticateToken, async (req, res, next) => {
    try{
        const [results] = await connection.query('SELECT * FROM users'); 
        res.status(200).json(results);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`)
    }    
    });

usersRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
    
        if (!email || !password) {
            return res.status(400).json({ message: "Email/username and password are required." });
        }
    
        // 1️⃣ Look up the user by email OR username
        const [[user]] = await connection.query(
        "SELECT user_id, email, username, first_name, last_name, user_password, user_type, avatar_config FROM users WHERE email = ? OR username = ? LIMIT 1",
        [email, email]
        );
    
        if (!user) {
            return res.status(401).json({ message: "Invalid email/username or password." });
        }
    
        // 2️⃣ Compare passwords using bcrypt
        const passwordMatch = await bcrypt.compare(password, user.user_password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email/username or password." });
        }
    
        // 3️⃣ Define role flag
        const isAdmin = user.user_type === "admin";

        // 4️⃣ Normalize avatar_config from DB (string → JSON object)
        let avatarConfig = null;
        if (user.avatar_config) {
            try {
                avatarConfig = typeof user.avatar_config === 'string'
                    ? JSON.parse(user.avatar_config)
                    : user.avatar_config;
            } catch (err) {
                console.error('Invalid avatar_config on login:', err);
                avatarConfig = null;
            }
        }
    
        // 5️⃣ Create JWT payload (include avatar_config so frontend header can match registration)
        const payload = {
            user_id: user.user_id,
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
            is_admin: isAdmin,
            avatar_config: avatarConfig,
        };
    
        // 6️⃣ Sign the token
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h"
        });
    
        // 7️⃣ Send response (including avatar_config for convenience)
        res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type,
                is_admin: isAdmin,
                avatar_config: avatarConfig,
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
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

// Check if email already exists (for registration validation)
usersRouter.get('/email/:email/exists', async (req, res) => {
    try {
        const { email } = req.params;
        const [rows] = await connection.query('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
        res.status(200).json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
});

// Check if username already exists (for registration validation)
usersRouter.get('/username/:username/exists', async (req, res) => {
    try {
        const { username } = req.params;
        const [rows] = await connection.query('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
        res.status(200).json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
});

usersRouter.post('/registration', async (req, res, next) => {
    try {
        console.log(req.body);
        const {username, email, first_name, last_name, user_password, user_type, user_phone, avatar_config} = req.body;
        const [userNameRows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        const [emailRows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (userNameRows.length > 0 || emailRows.length > 0) {
            return res.status(400).send('username or email already exists');
        }
        
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(user_password, SALT_ROUNDS);
        
        const [response] = await connection.query(
            'INSERT INTO users (username, email, first_name, last_name, user_password, user_type, user_phone, avatar_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                username,
                email,
                first_name,
                last_name,
                hashedPassword,
                user_type,
                user_phone,
                avatar_config ? JSON.stringify(avatar_config) : null,
            ]
        );
        res.status(201).send(response);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
})