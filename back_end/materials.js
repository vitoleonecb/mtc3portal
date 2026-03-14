import express from 'express';
import { authenticateToken, authenticateTokenAdmin, connection } from './app.js';

export const materialsRouter = express.Router();

// Basic materials model:
// - Each material belongs to a workshop (no module association)
// - type: 'script' | 'scene_breakdown' | 'challenge_list' | 'exercise_plan' | 'beats'
// - content: JSON payload shaped per type
// - title, created/updated timestamps handled by DB defaults

// GET all materials for a workshop (optionally filter by type)
// Any authenticated user can view materials.
materialsRouter.get('/workshops/:workshopid', authenticateToken, async (req, res) => {
  try {
    const { workshopid } = req.params;
    const { type } = req.query || {};

    const where = ['workshop_id = ?'];
    const params = [workshopid];

    if (type) {
      where.push('material_type = ?');
      params.push(type);
    }

    const [rows] = await connection.query(
      `SELECT material_id, workshop_id, material_type, title, content_json, created_at, updated_at
       FROM workshop_materials
       WHERE ${where.join(' AND ')}
       ORDER BY created_at ASC, material_id ASC`,
      params
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('GET /materials/workshops/:workshopid error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all script materials across all workshops (for cross-workshop
// breakdowns such as beats). Admin-only.
materialsRouter.get('/scripts', authenticateTokenAdmin, async (_req, res) => {
  try {
    const [rows] = await connection.query(
      `SELECT m.material_id,
              m.workshop_id,
              m.title,
              m.created_at,
              w.workshop_name,
              w.workshop_date
         FROM workshop_materials m
         JOIN workshops w ON w.workshop_id = m.workshop_id
        WHERE m.material_type = 'script'
        ORDER BY w.workshop_date ASC, m.created_at ASC, m.material_id ASC`
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('GET /materials/scripts error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST create one or more materials for a workshop
materialsRouter.post('/workshops/:workshopid', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopid } = req.params;
    const body = req.body || {};

    const materials = Array.isArray(body.materials) ? body.materials : [body];
    if (!materials.length) {
      return res.status(400).json({ error: 'No materials provided' });
    }

    const values = [];
    const params = [];

    materials.forEach((m) => {
      const type = m.type;
      const title = m.title || '';
      const content = JSON.stringify(m.content ?? {});

      // Workshop-level only: (workshop_id, material_type, title, content_json)
      values.push('(?, ?, ?, ?)');
      params.push(workshopid, type, title, content);
    });

    const [result] = await connection.query(
      `INSERT INTO workshop_materials
         (workshop_id, material_type, title, content_json)
       VALUES ${values.join(', ')}`,
      params
    );

    return res.status(201).json({ ok: true, inserted: result.affectedRows });
  } catch (error) {
    console.error('POST /materials/workshops/:workshopid error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET single material by id
materialsRouter.get('/:materialId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { materialId } = req.params;
    const [[row]] = await connection.query(
      `SELECT material_id, workshop_id, material_type, title, content_json, created_at, updated_at
       FROM workshop_materials
       WHERE material_id = ?`,
      [materialId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Material not found' });
    }

    return res.status(200).json(row);
  } catch (error) {
    console.error('GET /materials/:materialId error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT update an existing material (replace content/title/type)
materialsRouter.put('/:materialId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { materialId } = req.params;
    const { type, title, content } = req.body || {};

    const payload = JSON.stringify(content ?? {});

    const [result] = await connection.query(
      `UPDATE workshop_materials
       SET material_type = ?, title = ?, content_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE material_id = ?`,
      [type, title || '', payload, materialId]
    );

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('PUT /materials/:materialId error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a material
materialsRouter.delete('/:materialId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { materialId } = req.params;
    const [result] = await connection.query(
      'DELETE FROM workshop_materials WHERE material_id = ?',
      [materialId]
    );

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('DELETE /materials/:materialId error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});