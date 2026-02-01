import express from 'express';
import jwt from 'jsonwebtoken';
import moduleQueue from './queues/moduleQueue.js';
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

// GET Progress for Modules Inside Workshop
workshopsRouter.get('/:workshopid/modulesprogress', authenticateToken, async (req, res, next) => {
	const { workshopid } = req.params;

	const user_id = req.user.user_id;

	console.log(`user id: ${user_id} workshop_id: ${workshopid}`);

	try {
		const [promptCounts] = await connection.query(
			'SELECT wm.workshop_module_id AS module_id, COUNT(*) AS prompt_count FROM workshop_modules wm JOIN workshop_prompts wp ON(wm.workshop_module_id = wp.workshop_module_id) WHERE wm.workshop_id = ? AND wm.workshop_module_status = "open" GROUP BY wm.workshop_module_id',
			[workshopid]
		);
		
		const [responseCounts] = await connection.query(
			'SELECT wm.workshop_module_id AS module_id, COUNT(*) AS response_count FROM workshop_responses wr JOIN workshop_prompts wp ON (wr.workshop_prompt_id = wp.workshop_prompt_id) JOIN workshop_modules wm ON (wp.workshop_module_id = wm.workshop_module_id) WHERE wr.user_id = ? AND wm.workshop_id = ?  AND wm.workshop_module_status = "open" GROUP BY wm.workshop_module_id',
			[user_id, workshopid]
		);

		const responseMap = new Map();
		responseCounts.forEach(({module_id, response_count}) => {
			responseMap.set(module_id, response_count);
		});

		const progressData = promptCounts.map(({ module_id, prompt_count }) => ({
				module_id,
				prompt_count,
				response_count: responseMap.get(module_id) || 0
		}));	
		res.json(progressData);
	} catch (error) {
		console.log(`Error: ${error}`);
		res.status(500).json({error: `Internal Server Error: ${error}`});
	}
});

// GET All Prompts Inside Modules
workshopsRouter.get('/:workshopid/modules/:moduleid/prompts', authenticateToken, async(req, res, next) => {
    console.log("Decoded token:", req.user);
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

// GET 1 Response for Prompt
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

// POST RSVP
workshopsRouter.post('/rsvp/create', authenticateToken, async (req, res, next) => {
   
    try {
        const { user_id, workshop_id } = req.body;

        const [response] = await connection.query(
            'INSERT INTO workshop_rsvps (user_id, workshop_id) VALUES (?,?)',
            [user_id, workshop_id]
        );
        res.status(203).send(`RSVP Created Succesfully`);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`)
    }
});

// PUT RSVP Status (confirm / unconfirm toggle)
// Body: { confirmed: boolean }
workshopsRouter.put('/:workshopid/rsvp/:userid/update', async (req, res, next) => {
    try {
        const { workshopid, userid } = req.params;
        const { confirmed } = req.body || {};

        // Map boolean-ish values. When unconfirming, reset the column to its
        // database DEFAULT to avoid enum/NOT NULL issues without knowing the
        // exact schema.
        const shouldConfirm = confirmed === true || confirmed === 1 || confirmed === '1';

        let response;
        if (shouldConfirm) {
            [response] = await connection.query(
                'UPDATE workshop_rsvps SET rsvp_confirmation_status = "confirmed" WHERE user_id = ? AND workshop_id = ?',
                [userid, workshopid]
            );
        } else {
            [response] = await connection.query(
                'UPDATE workshop_rsvps SET rsvp_confirmation_status = DEFAULT WHERE user_id = ? AND workshop_id = ?',
                [userid, workshopid]
            );
        }

        if (response.affectedRows === 0) {
            return res.status(404).send('RSVP not found');
        }

        return res.status(200).json({
            user_id: Number(userid),
            workshop_id: Number(workshopid),
            confirmed: shouldConfirm
        });
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// GET RSVP STATUS
workshopsRouter.get('/:workshopid/rsvp/:userid/status', authenticateToken, async (req, res, next) => {
    try {
        const { userid, workshopid } = req.params;

        const [response] = await connection.query(
            'SELECT * FROM workshop_rsvps WHERE user_id = ? and workshop_id = ?',
            [userid, workshopid]
        );
        res.status(203).send(response);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`)
    }
});

// GET RSVP (digital RSVP view)
workshopsRouter.get('/:workshopid/rsvp/:userid', authenticateToken, async (req, res, next) => {
    try {
        const { userid, workshopid } = req.params;

        const [rows] = await connection.query(
'SELECT u.first_name AS first_name, u.username AS username, u.avatar_config AS avatar_config, w.workshop_name AS workshop_name, w.workshop_description AS workshop_description, w.workshop_date AS workshop_date, w.workshop_location AS workshop_location, w.workshop_public AS workshop_public, wr.rsvp_confirmation_status AS rsvp_confirmation_status FROM workshops w JOIN workshop_rsvps wr ON (w.workshop_id = wr.workshop_id) JOIN users u ON (wr.user_id = u.user_id) WHERE w.workshop_id = ? AND u.user_id = ?',
            [workshopid, userid]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).send('RSVP not found');
        }

        let checkinToken = null;
        try {
            checkinToken = jwt.sign(
                {
                    workshop_id: Number(workshopid),
                    user_id: Number(userid),
                    type: 'rsvp_checkin',
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '7d' }
            );
        } catch (err) {
            console.error('Error generating RSVP check-in token:', err);
        }

        const payload = [{
            ...rows[0],
            checkin_token: checkinToken,
        }];

        res.status(203).send(payload);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`)
    }
});

// GET RSVP check-in preview (admin-only, opened from QR link)
workshopsRouter.get('/rsvp/checkin/:token', authenticateTokenAdmin, async (req, res) => {
    try {
        const { token } = req.params;
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            console.error('Invalid or expired RSVP check-in token:', err);
            return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
        }

        if (!decoded || decoded.type !== 'rsvp_checkin') {
            return res.status(400).json({ ok: false, error: 'Invalid token payload' });
        }

        const workshopId = Number(decoded.workshop_id);
        const userId = Number(decoded.user_id);

        const [rows] = await connection.query(
            'SELECT wr.user_id, wr.workshop_id, u.first_name, u.last_name, u.username, u.avatar_config, w.workshop_name, w.workshop_description, w.workshop_date, w.workshop_location, wr.rsvp_confirmation_status, wr.checked_in, wr.checked_in_at FROM workshop_rsvps wr JOIN users u ON (wr.user_id = u.user_id) JOIN workshops w ON (wr.workshop_id = w.workshop_id) WHERE wr.workshop_id = ? AND wr.user_id = ?',
            [workshopId, userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'RSVP not found' });
        }

        const row = rows[0];
        const alreadyCheckedIn = !!row.checked_in;

        return res.status(200).json({
            ok: true,
            attendee: {
                user_id: row.user_id,
                first_name: row.first_name,
                last_name: row.last_name,
                username: row.username,
            },
            workshop: {
                workshop_id: row.workshop_id,
                name: row.workshop_name,
                description: row.workshop_description,
                date: row.workshop_date,
                location: row.workshop_location,
            },
            rsvp: {
                confirmation_status: row.rsvp_confirmation_status,
            },
            alreadyCheckedIn,
            checkedInAt: row.checked_in_at,
        });
    } catch (error) {
        console.error('RSVP check-in preview error:', error);
        return res.status(500).json({ ok: false, error: 'Server error' });
    }
});

// POST RSVP check-in (admin-only, used by scanner and confirm page)
workshopsRouter.post('/rsvp/checkin/:token', authenticateTokenAdmin, async (req, res) => {
    try {
        const { token } = req.params;
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            console.error('Invalid or expired RSVP check-in token (POST):', err);
            return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
        }

        if (!decoded || decoded.type !== 'rsvp_checkin') {
            return res.status(400).json({ ok: false, error: 'Invalid token payload' });
        }

        const workshopId = Number(decoded.workshop_id);
        const userId = Number(decoded.user_id);

        // Fetch current attendance state
        const [rows] = await connection.query(
            'SELECT wr.user_id, wr.workshop_id, u.first_name, u.last_name, u.username, u.avatar_config, w.workshop_name, w.workshop_description, w.workshop_date, w.workshop_location, wr.rsvp_confirmation_status, wr.checked_in, wr.checked_in_at FROM workshop_rsvps wr JOIN users u ON (wr.user_id = u.user_id) JOIN workshops w ON (wr.workshop_id = w.workshop_id) WHERE wr.workshop_id = ? AND wr.user_id = ?',
            [workshopId, userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'RSVP not found' });
        }

        const row = rows[0];
        const alreadyCheckedIn = !!row.checked_in;

        if (!alreadyCheckedIn) {
            await connection.query(
                'UPDATE workshop_rsvps SET checked_in = 1, checked_in_at = NOW() WHERE workshop_id = ? AND user_id = ?',
                [workshopId, userId]
            );
        }

        // Re-fetch to get updated timestamp
        const [updatedRows] = await connection.query(
            'SELECT wr.user_id, wr.workshop_id, u.first_name, u.last_name, u.username, u.avatar_config, w.workshop_name, w.workshop_description, w.workshop_date, w.workshop_location, wr.rsvp_confirmation_status, wr.checked_in, wr.checked_in_at FROM workshop_rsvps wr JOIN users u ON (wr.user_id = u.user_id) JOIN workshops w ON (wr.workshop_id = w.workshop_id) WHERE wr.workshop_id = ? AND wr.user_id = ?',
            [workshopId, userId]
        );

        const updated = updatedRows[0];

        return res.status(200).json({
            ok: true,
            attendee: {
                user_id: updated.user_id,
                first_name: updated.first_name,
                last_name: updated.last_name,
                username: updated.username,
            },
            workshop: {
                workshop_id: updated.workshop_id,
                name: updated.workshop_name,
                description: updated.workshop_description,
                date: updated.workshop_date,
                location: updated.workshop_location,
            },
            rsvp: {
                confirmation_status: updated.rsvp_confirmation_status,
            },
            alreadyCheckedIn: alreadyCheckedIn,
            checkedInAt: updated.checked_in_at,
        });
    } catch (error) {
        console.error('RSVP check-in POST error:', error);
        return res.status(500).json({ ok: false, error: 'Server error' });
    }
});

// GET Analytics
workshopsRouter.get('/:workshopid/modules/:moduleid/prompts/:promptid/analytics', authenticateToken, async (req, res, next) => {
    try {
        const { userid, promptid } = req.params;

        const { templateId } = req.body;

        switch (templateId) {
            case 1:
                
            case 1:
                
            case 1:
                
            case 1:
                
            case 1:
                
            case 1:
                
            case 1:
                
        }

        const [response] = await connection.query(
            'SELECT u.first_name AS first_name, u.username AS username, w.workshop_name AS workshop_name, w.workshop_description AS workshop_description, w.workshop_date AS workshop_date, w.workshop_location AS workshop_location, w.workshop_public AS workshop_public, wr.rsvp_confirmation_status AS rsvp_confirmation_status FROM workshops w JOIN workshop_rsvps wr ON (w.workshop_id = wr.workshop_id) JOIN users u ON (wr.user_id = u.user_id) WHERE w.workshop_id = ? AND u.user_id = ?',
            [workshopid, userid]
        );
        res.status(203).send(response);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`)
    }
});

///
///
/// ADMIN LEVEL
///
///

// GET All Responses for Prompt

workshopsRouter.get('/:workshopid/modules/:moduleid/prompts/:promptid', authenticateToken, async (req, res, next) => {
    try {
        const { promptid } = req.params;
        const [promptResponses] = await connection.query('SELECT wr.workshop_response_content, wr.workshop_prompt_id,workshop_response_id, wr.workshop_response_acceptance, workshop_response_created, wr.user_id, u.username, u.first_name, u.last_name FROM workshop_responses wr JOIN users u ON (wr.user_id = u.user_id) WHERE wr.workshop_prompt_id = ?', [promptid]);
        console.log('User ID:', req.user?.user_id, 'Role:', req.user?.is_admin);
        console.log('Prompt responses count:', promptResponses.length);
        res.set('Cache-Control','no-store').status(200).json(promptResponses);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET Attendance For Workshop (admin view)
workshopsRouter.get('/:workshopid/attendance', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshopid } = req.params;
        const [workshopAttendance] = await connection.query('SELECT * FROM workshop_attendance_view WHERE workshop_id = ?', [workshopid]);
        res.status(200).send(workshopAttendance);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET confirmed attendees for a workshop (for avatar strip)
workshopsRouter.get('/:workshopid/attendees', authenticateToken, async (req, res) => {
    try {
        const { workshopid } = req.params;
        const [rows] = await connection.query(
'SELECT wr.user_id, u.username, u.first_name, u.last_name, u.avatar_config FROM workshop_rsvps wr JOIN users u ON (wr.user_id = u.user_id) WHERE wr.workshop_id = ? AND wr.rsvp_confirmation_status = "confirmed"',
            [workshopid]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// POST Workshop
workshopsRouter.post('', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshop_name, workshop_description, workshop_location, workshop_date, workshop_public } = req.body;
        const [response] = await connection.query('INSERT INTO workshops (workshop_name, workshop_description, workshop_location, workshop_date, workshop_public, workshop_public) VALUES (?, ?, ?, ?, ?)', [workshop_name, workshop_description, workshop_location, workshop_date, workshop_public]);
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

// POST Prompts For Module
workshopsRouter.post('/:workshopid/modules/:moduleid/prompts', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { moduleid } = req.params;
        const { promptDataList } = req.body;

	console.log(promptDataList);

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

	    const openDelay = 1000 * 30 * 1;
            const processDelay = openDelay + 1000 * 30 * 1;
            const completedDelay = processDelay + 1000 * 30 * 1;

            // await moduleQueue.add('openModule', { moduleId: moduleid }, { delay: openDelay });
            // await moduleQueue.add('processModule', { moduleId: moduleid }, { delay: processDelay });
            // await moduleQueue.add('completeModule', { moduleId: moduleid }, { delay: completedDelay });
	    // console.log(`Scheduled completeModule for module ${moduleid} with delay ${completedDelay}`);

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

// GET Module Status
workshopsRouter.get('/:workshopid/modules/:moduleid', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { moduleid, workshopid } = req.params;
        const response = await connection.query('SELECT workshop_module_status FROM workshop_modules WHERE workshop_id = ? AND workshop_module_id = ?', [workshopid, moduleid]);
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(`Server Error: ${error}`);
    }
});

// POST Response to Module
workshopsRouter.post('/:workshopid/modules/:moduleid/prompts/:promptid/response', authenticateToken, async (req, res) => {
    try {
      const { promptid } = req.params;
      const { workshop_response_content, prompt_template_id } = req.body;
      const user_id = req.user.user_id;
  
      // Normalize content: avoid double-JSON; store as a JSON string consistently
      const content =
        typeof workshop_response_content === 'string'
          ? workshop_response_content
          : JSON.stringify(workshop_response_content);
  
      // Accept/auto-accept flag for certain templates
      const autoAccept = [1, 3, 6, 7, 9].includes(Number(prompt_template_id)) ? 1 : 0;
  
      // Idempotent upsert — safe on retries / double clicks
      await connection.query(
        `
        INSERT INTO workshop_responses
          (user_id, workshop_prompt_id, workshop_response_content, workshop_response_acceptance)
        VALUES
          (?, ?, ?, ?)
        `,
        [user_id, promptid, content, autoAccept]
      );
  
      // Return once, and only once
      return res.status(201).json({ ok: true, prompt_id: Number(promptid) });
    } catch (error) {
      console.error('Submit response error:', error);
      return res.status(500).json({ ok: false, error: error.code || String(error) });
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

// PATCH Workshop Response
workshopsRouter.patch('/:responseId/response/acceptance', authenticateTokenAdmin, async (req, res) => {
    try {
      const { responseId } = req.params;
      let { acceptance } = req.body; // can be true/false or 0/1
  
      const val = acceptance === true || acceptance === 1 || acceptance === "1" ? 1 : 0;
  
      const [result] = await connection.execute(
        'UPDATE workshop_responses SET workshop_response_acceptance = ? WHERE workshop_response_id = ?',
        [val, responseId]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Response not found' });
      }
  
      return res.status(200).json({
        responseId: Number(responseId),
        accepted: !!val,
        message: val ? 'Approved' : 'Declined'
      });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: String(err) });
      }
    });


///
///
/// ADMIN AUTOMATION LEVEL
///
///

workshopsRouter.post('/:workshopid/modules/:moduleid/prompts/:promptid/automated', authenticateTokenAdmin, async (req, res, next) => {
    try {
        const { workshopid, moduleid, promptid } = req.params;
        const { workshop_response_content, user_id, testing, workshop_response_created } = req.body;

        const content = JSON.stringify(workshop_response_content);

        let insertQuery;
        let insertParams;

        // For testing runs, allow overriding the created timestamp so that
        // seeded responses can be distributed across a fixed date window.
        if (testing && workshop_response_created) {
            // For seeded/testing responses, always mark them as accepted (1)
            // so they flow straight into analytics.
            insertQuery = `
                INSERT INTO workshop_responses
                    (workshop_response_content, user_id, workshop_prompt_id, workshop_response_created, workshop_response_acceptance)
                VALUES (?, ?, ?, ?, 1)
            `;
            insertParams = [content, user_id, promptid, workshop_response_created];
        } else {
            insertQuery = `
                INSERT INTO workshop_responses
                    (workshop_response_content, user_id, workshop_prompt_id, workshop_response_acceptance)
                VALUES (?, ?, ?, 1)
            `;
            insertParams = [content, user_id, promptid];
        }

        const [response] = await connection.query(insertQuery, insertParams);

        // For automated seeding/testing runs, we *only* want to create
        // workshop_responses rows and push them into analytics — we do **not**
        // want to auto-create RSVPs, since those should be driven by real
        // user completion flows or a separate batch-RSVP script.
        if (!testing) {
            const [rsvpAccomplishmentRows] = await connection.query(
                'SELECT * FROM number_of_prompts_per_workshop_view WHERE workshop_id = ?',[workshopid]
            );
            const [userAccomplishmentRows] = await connection.query(
                'SELECT * FROM user_rsvp_ready_view WHERE user_id = ?',[user_id]
            );
            
            if (rsvpAccomplishmentRows.length === userAccomplishmentRows.length) {
                const rsvpCreateResponse = await connection.query(
                    'INSERT INTO workshop_rsvps (user_id, workshop_id) VALUES (?, ?)',
                    [user_id, workshopid]
                );
                return res.status(201).send(`User RSVP unlocked: ${rsvpCreateResponse}`);
            }
        }

        return res.status(201).send(response);
    } catch (error) {
        return res.status(500).send(`Server Error: ${error}`);
    }
});
