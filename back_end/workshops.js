import express from 'express';
import jwt from 'jsonwebtoken';
import {authenticateTokenAdmin, authenticateToken, connection} from './app.js';

export const workshopsRouter = express.Router();

// GET Workshops
workshopsRouter.get('', authenticateToken, async (req, res, next) => {
    const [rows] = await connection.query('SELECT * FROM workshops');
    res.status(200).send(rows);
});

// GET Workshop Name
workshopsRouter.get('/:workshopId', authenticateToken, async (req, res, next) => {
    const { workshopId } = req.params;
    try {
        const [rows] = await connection.query('SELECT * FROM workshops WHERE workshop_id = ?', [workshopId]);
        res.status(200).send(rows);
    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// GET All Modules Inside Workshop
workshopsRouter.get('/:workshopid/modules', authenticateToken, async (req, res, next) => {
    const { workshopid } = req.params;
    try {
        const [rows] = await connection.query(`
            SELECT 
                wm.*, 
                (
                    SELECT wp.workshop_prompt_id 
                    FROM workshop_prompts wp 
                    WHERE wp.workshop_module_id = wm.workshop_module_id 
                    ORDER BY wp.workshop_prompt_id ASC 
                    LIMIT 1
                ) AS first_prompt_id
            FROM workshop_modules wm
            WHERE wm.workshop_id = ?
        `, [workshopid]);
        res.status(200).send(rows);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// GET All Prompts Inside Modules
workshopsRouter.get('/:workshopid/modules/:moduleid/prompts', authenticateToken, async(req, res, next) => {
    try{
        const { moduleid } = req.params;
        const [rows] = await connection.query('SELECT * FROM workshop_prompts WHERE workshop_module_id = ?', [moduleid]);
        res.status(200).send(rows);
    } catch(error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// GET Prompt Instructions / Responses
workshopsRouter.get('/:workshopid/modules/:moduleid/prompts/promptid', authenticateToken, async (req, res) => {
    try {
        const  user_id = req.user.user_id;

        const { workshopid, promptid } = req.params;

        const [[{ workshop_status }]] = await connection.query(
            'SELECT workshop_status FROM workshops WHERE workshop_id = ?', 
            [workshopid]
        );

        const [userResponseExists] = await connection.query(
            'SELECT * FROM workshop_prompts WHERE prompt_id = ? AND user_id = ?', 
            [promptid, user_id]
        );

        if (userResponseExists.length > 0) {
            const [[{ prompt_instruction }]] = await connection.query(
                'SELECT prompt_instruction FROM workshop_prompts WHERE prompt_id = ?', 
                [promptid]
            );

            const [[{ response_content: userResponse }]] = await connection.query(
                'SELECT response_content FROM workshop_responses WHERE user_id = ? AND workshop_prompt_id = ?', 
                [user_id, promptid]
            );

            const [otherResponses] = await connection.query(
                'SELECT response_content FROM workshop_responses WHERE user_id != ? AND workshop_prompt_id = ? ORDER BY RAND() LIMIT 1', 
                [user_id, promptid]
            );

            return res.status(200).json({
                promptInstruction: prompt_instruction,
                userResponse,
                otherResponse: otherResponses.length > 0 ? otherResponses[0].response_content : null
            });
        }

        if (workshop_status === 'scheduled') {
            const [[{ prompt_instruction }]] = await connection.query(
                'SELECT prompt_instruction FROM workshop_prompts WHERE prompt_id = ?', 
                [promptid]
            );
            return res.status(200).json({ promptInstruction: prompt_instruction });
        }

        if (workshop_status === 'completed') {
            const [otherResponses] = await connection.query(
                'SELECT response_content FROM workshop_responses WHERE user_id != ? AND workshop_prompt_id = ? ORDER BY RAND() LIMIT 1', 
                [user_id, promptid]
            );
            return res.status(200).json({
                otherResponse: otherResponses.length > 0 ? otherResponses[0].response_content : null
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// GET Number of Responses for Prompt
workshopsRouter.get('/modules/:moduleid/progress', authenticateToken, async (req, res, next) => {
    try {
	const { moduleid } = req.params;
	const userid = req.user.user_id;
	console.log(`moduleId: ${moduleid} userId: ${userid}`);
	const [numberOfResponses] = await connection.query(
		'SELECT COUNT(*) FROM workshop_responses wr JOIN workshop_prompts wp ON (wr.workshop_prompt_id = wp.workshop_prompt_id) WHERE wp.workshop_module_id = ? AND wr.user_id = ?',
		[moduleid, userid]
	);
	const count = Number(numberOfResponses?.[0]?.['COUNT(*)'] ?? 0);
	res.status(200).json({ count });
    } catch (error) {
	res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// GET Response for Prompt
workshopsRouter.get('/prompts/:promptid/response', authenticateToken, async (req, res) => {
    try {
        const { promptid } = req.params;
        const userId = req.user.user_id;

        const [rows] = await connection.query(
            'SELECT workshop_response_content FROM workshop_responses WHERE user_id = ? AND workshop_prompt_id = ?',
            [userId, promptid]
        );

        if (rows.length === 0) {
            return res.status(200).json({ response: null });
        }

        res.status(200).json({ response: rows[0].workshop_response_content });
    } catch (error) {
        res.status(500).send(`Error fetching response: ${error.message}`);
    }
});

// POST A Response To A Prompt
workshopsRouter.post('/:workshopid/modules/:moduleid/prompts/:promptid', authenticateToken, async (req, res, next) => {
    try {
        console.log("Decoded user from token:", req.user);
        
        const { workshopid, moduleid, promptid } = req.params;
        const user_id = req.user.user_id;
        const { workshop_response_content } = req.body;
        
        const [response] = await connection.query('INSERT INTO workshop_responses (workshop_response_content, user_id, workshop_prompt_id) VALUES (?, ?, ?)',[JSON.stringify(workshop_response_content), user_id, promptid]);
        
        const [rsvpAccomplishmentRows] = await connection.query('SELECT * FROM number_of_prompts_per_workshop_view WHERE workshop_id = ?',[workshopid]);
        const [userAccomplishmentRows] = await connection.query('SELECT * FROM user_rsvp_ready_view WHERE user_id = ?',[user_id]);
        
        if (rsvpAccomplishmentRows.length === userAccomplishmentRows.length) {
            const rsvpCreateResponse = await connection.query('INSERT INTO workshop_rsvps (user_id, workshop_id) VALUES (?, ?)',[user_id, workshopid]);
            res.status(201).send(`User RSVP unlocked: ${rsvpCreateResponse}`);
        }
        res.status(201).send(response);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// PUT RSVP Status
workshopsRouter.put('/:workshopid/rsvp', async (req, res, next) => {
    try {
        const { workshopid } = req.params;
        const [response] = await connection.query('UPDATE workshop_rsvps SET rsvp_confirmation = "confirmed" WHERE user_id = ? AND workshop_id = ?',[req.user.user_id, workshopid]);
        res.status(201).send(response);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

///
///
/// ADMIN LEVEL
///
///

// GET RSVPS
workshopsRouter.get('/:workshopid/rsvps', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshopid } = req.params;
        const [result] = await connection.query('SELECT * FROM workshop_rsvps WHERE workshop_id = ?',[workshopid]);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// GET Attendance For Workshop
workshopsRouter.get('/:workshopid/attendance', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshopid } = req.params;
        const [workshopAttendance] = await connection.query('SELECT * FROM workshop_attendance_view WHERE workshop_id = ?', [workshopid]);
        res.status(200).send(workshopAttendance);
    } catch (error) {
        res.status(500).send(error);
    }
});

// POST Workshop
workshopsRouter.post('', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshop_name, workshop_description, workshop_location, workshop_date, workshop_public } = req.body;
        const [response] = await connection.query('INSERT INTO workshops (workshop_name, workshop_description, workshop_location, workshop_date, workshop_public) VALUES (?, ?, ?, ?, ?)', [workshop_name, workshop_description, workshop_location, workshop_date, workshop_public]);
        res.status(204).send(`Workshop "${workshop_name}" created successfully`);
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// DELETE Workshop
workshopsRouter.delete('/:workshopid', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshopid } = req.params;
        const [workshopExists] = await connection.query('SELECT * FROM workshops WHERE workshop_id = ?',[workshopid]);
        if (workshopExists.length === 1) {
            const [response] = await connection.query('DELETE FROM workshops WHERE workshop_id = ?', [workshopid]);
            return res.status(201).send(`Workshop deleted successfully`);
        };
        res.status(404).send('Workshop doesn\'t exist');
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// POST Module
workshopsRouter.post('/:workshopid/modules', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const {workshopid} = req.params;
        const { workshop_module_name } = req.body;
        const [response] = await connection.query('INSERT INTO workshop_modules (workshop_id, workshop_module_name) VALUES (?, ?)', [workshopid, workshop_module_name]);
        res.status(201).send(`New Module "${workshop_module_name}" added to workshop id: ${workshopid}`)
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// DELETE Module From Workshop
workshopsRouter.delete('/:workshopid/modules/:moduleid', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { moduleid } = req.params;
        const [moduleExists] = await connection.query('SELECT * FROM workshop_modules WHERE workshop_module_id = ?', [moduleid]);
        if (moduleExists.length === 1) {
            const [response] = await connection.query('DELETE FROM workshop_modules WHERE workshop_module_id = ?',[moduleid]);
            return res.status(201).send('Module Successfully Deleted');
        };
        return res.status(404).send('Module Doesn\'t exist');
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// POST Prompt For Module
workshopsRouter.post('/:workshopid/modules/:moduleid/prompts', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { moduleid } = req.params;
        const { promptDataList } = req.body;

        const templateMap = {
            1 :'Multiple Choice',
            3 :'Checklist',
            4 :'Short Response',
            6 :'Drag and Drop',
            7 :'Sample Rater',
            8 :'Notation',
            9 :'DropDown',
        };

        try {
            for (const prompt of promptDataList) {
                const {
                    prompt_template_id,
                    formData
                } = prompt;

                if ([4, 6].includes(prompt_template_id)) {
                    const [response] = await connection.query('INSERT INTO workshop_prompts (workshop_module_id, prompt_template_id, workshop_prompt_options) VALUES (?,?,?)', [moduleid, prompt_template_id, JSON.stringify(formData)]);
                    console.log(`Successfully Inserted ${templateMap[prompt_template_id]} Prompt`);
                }

                else if ([7, 8].includes(prompt_template_id)) {
                    const referenceText = formData.referenceText;
                    const [response] = await connection.query(
                        'INSERT INTO workshop_prompts (workshop_module_id, prompt_template_id, workshop_prompt_reference) VALUES (?,?,?)',
                        [moduleid, prompt_template_id, referenceText]
                    );
                    console.log(`Successfully Inserted ${templateMap[prompt_template_id]} Prompt`);
                }

                else if ([1,3,9].includes(prompt_template_id)) {
                    const [response] = await connection.query(
                        'INSERT INTO workshop_prompts (workshop_module_id, prompt_template_id, workshop_prompt_options) VALUES (?,?,?)', 
                        [moduleid, prompt_template_id, JSON.stringify(formData)]
                    );
                }

                else {
                    console.warn(`Unhandled template ID: ${prompt_template_id}`);
                }

            }
        } catch (error) {
            return res.status(400).send(`Error Looping Through Prompt Data: ${error}`)
        }
        return res.status(201).send('Prompts Inserted Successfully')
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// DELETE Prompt From Module
workshopsRouter.delete('/:workshopid/modules/:moduleid/prompts/:promptid', authenticateTokenAdmin, async (req, res, next) =>{
    try {
        const { promptid } = req.params;
        const [promptExists] = await connection.query('SELECT * FROM workshop_prompts WHERE workshop_prompt_id = ?',[promptid]);
        if (promptExists === 1) {
            const [response] = await connection.query('DELETE FROM workshop_prompts WHERE workshop_prompt_id = ?',[promptid]);
            return res.status(204).send('Prompt Deleted Successfully');
        };
        return res.status(404).send('Prompt Not Found');
    } catch (error) {
        res.status(500).send(`Internal Server Error: ${error}`);
    }
});

// PUT Module Status
workshopsRouter.put('/:workshopid/modules/:moduleid', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { moduleid, workshopid } = req.params;
        const { newStatus } = req.body;
        const [response] = await connection.query('UPDATE workshop_modules SET workshop_module_status = ? WHERE workshop_module_id = ?', [newStatus, moduleid]);
        res.status(201).send(`Workshop with id of ${workshopid} status changed to: ${newStatus}`);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// POST Response to Module
workshopsRouter.post('/:workshopid/modules/:moduleid/prompts/:promptid/response', authenticateToken, async (req, res, next) => {
    try {
        const { promptid } = req.params;
        const { workshop_response_content } = req.body;
        const  user_id = req.user.user_id;
        const response = await connection.query('INSERT INTO workshop_responses (user_id, workshop_prompt_id, workshop_response_content) VALUES (?, ?, ?)',[user_id,promptid,workshop_response_content])
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// GET Responses To Workshop
workshopsRouter.get('/:workshopid/modules/:moduleid', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshopid, moduleid } = req.params;
        const [results] = await connection.query('SELECT * FROM workshop_module_to_responses_view WHERE workshop_module_id = ?', [moduleid]);
        res.status(200).send(results);     
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

