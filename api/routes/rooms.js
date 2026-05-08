const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE user_id = $1 ORDER BY name', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, emoji } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO rooms (user_id, name, emoji) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, emoji || '🏠']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
