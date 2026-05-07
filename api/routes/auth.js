const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register
router.post('/register', async (req, res) => {
  const { email, password, name, username } = req.body;
  if (!email || !password || !username) return res.status(400).json({ error: 'Email, username and password required' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exists.rows.length) return res.status(400).json({ error: 'Email or username already in use' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING id, email, username, name',
      [email, username.toLowerCase(), hash, name || '']
    );

    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login — accepts email or username
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Login and password required' });

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [login.toLowerCase()]
    );
    if (!result.rows.length) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
