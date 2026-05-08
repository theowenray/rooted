const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all plants for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM plants WHERE user_id = $1 ORDER BY name',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add plant
router.post('/', async (req, res) => {
  const { name, emoji, category, water_interval, fertilize_interval, location, room, notes, photo, tags, health } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO plants (user_id, name, emoji, category, water_interval, fertilize_interval, location, room, notes, photo, tags, health, streak_start)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING *`,
      [req.user.id, name, emoji, category, water_interval || 7, fertilize_interval || 30, location || '', room || '', notes || '', photo || null, tags || [], health || 'thriving']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update plant
router.put('/:id', async (req, res) => {
  const { name, emoji, category, water_interval, fertilize_interval, location, room, notes, last_watered, last_fertilized, photo, tags, health } = req.body;
  try {
    const result = await pool.query(
      `UPDATE plants SET name=$1, emoji=$2, category=$3, water_interval=$4, fertilize_interval=$5,
       location=$6, room=$7, notes=$8, last_watered=$9, last_fertilized=$10, photo=$11, tags=$12, health=$13
       WHERE id=$14 AND user_id=$15 RETURNING *`,
      [name, emoji, category, water_interval, fertilize_interval, location, room, notes, last_watered, last_fertilized, photo || null, tags || [], health || 'thriving', req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Water a plant (creates log entry)
router.post('/:id/water', async (req, res) => {
  const { note } = req.body;
  try {
    await pool.query('UPDATE plants SET last_watered = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    await pool.query(
      'INSERT INTO water_logs (plant_id, user_id, action, note) VALUES ($1, $2, $3, $4)',
      [req.params.id, req.user.id, 'watered', note || '']
    );
    const result = await pool.query('SELECT * FROM plants WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fertilize a plant
router.post('/:id/fertilize', async (req, res) => {
  try {
    await pool.query('UPDATE plants SET last_fertilized = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    await pool.query(
      'INSERT INTO water_logs (plant_id, user_id, action) VALUES ($1, $2, $3)',
      [req.params.id, req.user.id, 'fertilized']
    );
    const result = await pool.query('SELECT * FROM plants WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get water/care log for a plant
router.get('/:id/logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM water_logs WHERE plant_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 50',
      [req.params.id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Journal entries
router.get('/:id/journal', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE plant_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [req.params.id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/journal', async (req, res) => {
  const { note, photo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO journal_entries (plant_id, user_id, note, photo) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.user.id, note, photo || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete plant
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM plants WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
