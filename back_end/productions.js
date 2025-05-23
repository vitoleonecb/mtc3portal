import express from 'express';
import jwt from 'jsonwebtoken';
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js';

export const productionsRouter = express.Router();

// Get All Productions
productionsRouter.get('', authenticateToken, async (req, res, next) => {
    const [rows] = await connection.query('SELECT * FROM productions');
    res.status(200).send(rows);
});

productionsRouter.get('/:productionid/modules', authenticateToken, async (req, res, next) => {
    const {productionid} = req.params;
    try {
        const [rows] = await connection.query('SELECT * FROM production_modules WHERE production_id = ?', [productionid]);
        res.status(200).send(rows);
    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

productionsRouter.get('/:productionid/modules/:productionmoduleid/prompts', authenticateToken, async(req,res,next) => {
    const {productionid, productionmoduleid} = req.params;

    try {
        const [productionRows] = await connection.query('SELECT * FROM productions WHERE production_id = ?',[productionid]);
        const [productionModuleRows] = await connection.query('SELECT * FROM production_modules WHERE production_module_id = ?', [productionmoduleid]);

        if (productionRows.length === 0 || productionModuleRows.length === 0) {
            return res.status(404).send('Production or module not found');
        }

        const [productionModulePromptRows] = await connection.query('SELECT * FROM production_prompts WHERE production_module_id = ?', [productionmoduleid]);
        res.status(200).send(productionModulePromptRows);

    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

productionsRouter.post('/:productionid/module/:productionmoduleid/prompts/:productionpromptid', authenticateToken, async(req,res,next) => {
    const {productionid, productionmoduleid, productionpromptid} = req.params;
    const {responseContent} = req.body;
    const userEmail = req.user.email;

    try {
        const [userRows] = await connection.query('SELECT user_id FROM users WHERE email = ?', [userEmail]);

        if (userRows.length === 0) {
            return res.status(404).send('User not found.');
        }

        const userId = userRows[0].user_id;

        const [productionRows] = await connection.query('SELECT * FROM productions WHERE production_id = ?',[productionid]);
        const [productionModuleRows] = await connection.query('SELECT * FROM production_modules WHERE production_module_id = ?', [productionmoduleid]);
        const [productionPromptRows] = await connection.query('SELECT * FROM production_prompts WHERE production_prompt_id = ?', [productionpromptid]);

        if (productionRows.length === 0 || productionModuleRows.length === 0 || productionPromptRows.length === 0) {
            return res.status(404).send('Production, module or prompt not found');
        }

        const [productionResponse] = await connection.query(
            'INSERT INTO production_responses (user_id, production_prompt_id, production_response_content) VALUES (?, ?, ?)', 
            [userId, productionpromptid, JSON.stringify(responseContent)]
            );
        res.status(201).send('Response succesfully added.');

    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});