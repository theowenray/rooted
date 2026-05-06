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
  const { name, emoji, category, water_interval, location, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO plants (user_id, name, emoji, category, water_interval, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, name, emoji, category, water_interval, location || '', notes || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update plant
router.put('/:id', async (req, res) => {
  const { name, emoji, category, water_interval, location, notes, last_watered } = req.body;
  try {
    const result = await pool.query(
      `UPDATE plants SET name=$1, emoji=$2, category=$3, water_interval=$4,
       location=$5, notes=$6, last_watered=$7
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [name, emoji, category, water_interval, location, notes, last_watered, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plant not found' });
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
