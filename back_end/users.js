import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js';
import notificationQueue from './queues/notificationQueue.js';

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

        // Check for existing username (always reject if taken by another user)
        const [userNameRows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        const [emailRows] = await connection.query('SELECT user_id, user_type FROM users WHERE email = ?', [email]);

        // --- Guest account upgrade path ---
        // If the email belongs to an existing guest account, upgrade it
        // instead of rejecting as a duplicate.
        if (emailRows.length > 0 && emailRows[0].user_type === 'guest') {
            // Make sure the chosen username isn't already taken by someone else
            if (userNameRows.length > 0 && userNameRows[0].user_id !== emailRows[0].user_id) {
                return res.status(400).send('username already exists');
            }

            const guestUserId = emailRows[0].user_id;
            const hashedPassword = await bcrypt.hash(user_password, SALT_ROUNDS);

            await connection.query(
                `UPDATE users SET username = ?, first_name = ?, last_name = ?,
                 user_password = ?, user_type = ?, user_phone = ?, avatar_config = ?
                 WHERE user_id = ?`,
                [
                    username,
                    first_name,
                    last_name,
                    hashedPassword,
                    user_type || 'user',
                    user_phone,
                    avatar_config ? JSON.stringify(avatar_config) : null,
                    guestUserId,
                ]
            );

            // Enqueue email confirmation
            try {
                const confirmToken = jwt.sign(
                    { user_id: guestUserId, type: 'email_confirm' },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '24h' }
                );
                await notificationQueue.add('confirmEmail', { userId: guestUserId, email, confirmToken });
            } catch (notifErr) {
                console.error('Failed to enqueue confirmEmail:', notifErr.message);
            }

            return res.status(201).send({ insertId: guestUserId, affectedRows: 1 });
        }

        // --- Standard registration (no guest to upgrade) ---
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

        // Enqueue email confirmation notification
        try {
            const newUserId = response.insertId;
            const confirmToken = jwt.sign(
                { user_id: newUserId, type: 'email_confirm' },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '24h' }
            );
            await notificationQueue.add('confirmEmail', { userId: newUserId, email, confirmToken });
        } catch (notifErr) {
            console.error('Failed to enqueue confirmEmail:', notifErr.message);
        }

        res.status(201).send(response);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// ── Confirm email via token ────────────────────────────────────
usersRouter.get('/confirm-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'email_confirm') {
            return res.status(400).json({ error: 'Invalid token type' });
        }

        await connection.execute(
            'UPDATE users SET email_verified = TRUE WHERE user_id = ?',
            [decoded.user_id]
        );

        return res.status(200).json({ ok: true, message: 'Email confirmed' });
    } catch (error) {
        return res.status(400).json({ error: `Invalid or expired token: ${error.message}` });
    }
});

// ── Forgot password ────────────────────────────────────────────
usersRouter.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const [[user]] = await connection.query(
            'SELECT user_id, first_name FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        // Always return success to avoid leaking whether the email exists
        if (!user) return res.status(200).json({ ok: true });

        const resetToken = jwt.sign(
            { user_id: user.user_id, type: 'password_reset' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        await notificationQueue.add('resetPassword', {
            userId: user.user_id,
            email,
            resetToken,
        });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('forgot-password error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── Reset password ─────────────────────────────────────────────
usersRouter.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({ error: 'Invalid token type' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await connection.execute(
            'UPDATE users SET user_password = ? WHERE user_id = ?',
            [hashedPassword, decoded.user_id]
        );

        return res.status(200).json({ ok: true, message: 'Password updated' });
    } catch (error) {
        return res.status(400).json({ error: `Invalid or expired token: ${error.message}` });
    }
});

// ── GET notification settings ──────────────────────────────────
usersRouter.get('/:id/notification-settings', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [[row]] = await connection.query(
            'SELECT notification_settings FROM users WHERE user_id = ?',
            [id]
        );
        if (!row) return res.status(404).json({ error: 'User not found' });

        let settings = row.notification_settings;
        if (typeof settings === 'string') {
            try { settings = JSON.parse(settings); } catch { settings = {}; }
        }
        return res.status(200).json(settings);
    } catch (error) {
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});

// ── PUT notification settings ──────────────────────────────────
usersRouter.put('/:id/notification-settings', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const settings = req.body;

        // Validate channel
        const validChannels = ['none', 'email', 'sms', 'both'];
        if (!validChannels.includes(settings.channel)) {
            return res.status(400).json({ error: 'Invalid channel value' });
        }

        // Validate sub-options are booleans
        const boolKeys = ['module_open', 'last_day_reminder', 'materials_ready', 'workshop_rsvp', 'showcase_announcements', 'showcase_ticket'];
        for (const key of boolKeys) {
            if (key in settings && typeof settings[key] !== 'boolean') {
                return res.status(400).json({ error: `${key} must be a boolean` });
            }
        }

        await connection.execute(
            'UPDATE users SET notification_settings = ? WHERE user_id = ?',
            [JSON.stringify(settings), id]
        );

        return res.status(200).json({ ok: true });
    } catch (error) {
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
})
