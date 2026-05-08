const { useState, useEffect, useCallback } = React;

const API = '/api';

// ── helpers ──────────────────────────────────────────────────────────────────

const PLANT_EMOJIS = ['🌿', '🌵', '🌱', '🌸', '🌺', '🍀', '🌻', '🌴', '🪴', '🌾', '🍃', '🌲'];
const CATEGORIES = ['Houseplant', 'Garden', 'Herb', 'Succulent', 'Tree', 'Lawn', 'Flower'];
const WATER_INTERVALS = [
  { label: 'Every day', days: 1 },
  { label: 'Every 2 days', days: 2 },
  { label: 'Every 3 days', days: 3 },
  { label: 'Once a week', days: 7 },
  { label: 'Every 2 weeks', days: 14 },
  { label: 'Once a month', days: 30 },
];

function getToken() { return localStorage.getItem('rooted_token'); }
function setToken(t) { localStorage.setItem('rooted_token', t); }
function clearToken() { localStorage.removeItem('rooted_token'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function waterStatus(plant) {
  const days = daysSince(plant.last_watered);
  if (days >= plant.water_interval) return 'due';
  if (days >= plant.water_interval - 1) return 'today';
  return 'ok';
}

function waterStatusLabel(plant) {
  const days = daysSince(plant.last_watered);
  const remaining = plant.water_interval - days;
  if (days >= plant.water_interval) return `${days - plant.water_interval + 1}d overdue`;
  if (remaining === 1) return 'Water tomorrow';
  if (remaining <= 0) return 'Water today';
  return `Water in ${remaining}d`;
}

// ── Auth Screen ───────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const body = mode === 'login'
        ? { login, password }
        : { email, username, password, name };
      const data = await apiFetch(`/auth/${mode}`, { method: 'POST', body });
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return React.createElement('div', { className: 'app-shell' },
    React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 20px' } },

      React.createElement('div', { style: { textAlign: 'center', marginBottom: '40px' } },
        React.createElement(Logo),
        React.createElement('div', { style: { fontSize: '28px', fontWeight: 300, letterSpacing: '0.08em', color: 'var(--green)', marginTop: '8px' } }, 'rooted')
      ),

      React.createElement('div', { style: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } },

        React.createElement('div', { className: 'tab-bar', style: { padding: 0, marginBottom: '20px' } },
          React.createElement('button', { className: `tab-btn ${mode === 'login' ? 'active' : ''}`, onClick: () => { setMode('login'); setError(''); } }, 'Sign In'),
          React.createElement('button', { className: `tab-btn ${mode === 'register' ? 'active' : ''}`, onClick: () => { setMode('register'); setError(''); } }, 'Create Account')
        ),

        mode === 'register' && React.createElement('div', null,
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Name'),
            React.createElement('input', { className: 'form-input', placeholder: 'Your name', value: name, onChange: e => setName(e.target.value) })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Username'),
            React.createElement('input', { className: 'form-input', placeholder: 'e.g. plantlover42', value: username, onChange: e => setUsername(e.target.value) })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Email'),
            React.createElement('input', { className: 'form-input', type: 'email', placeholder: 'you@email.com', value: email, onChange: e => setEmail(e.target.value) })
          )
        ),

        mode === 'login' && React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Email or Username'),
          React.createElement('input', { className: 'form-input', placeholder: 'Email or username', value: login, onChange: e => setLogin(e.target.value) })
        ),

        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Password'),
          React.createElement('input', { className: 'form-input', type: 'password', placeholder: '••••••••', value: password, onChange: e => setPassword(e.target.value),
            onKeyDown: e => e.key === 'Enter' && handleSubmit() })
        ),

        error && React.createElement('p', { style: { color: 'var(--red)', fontSize: '14px', marginBottom: '12px' } }, error),

        React.createElement('button', { className: 'btn-primary', style: { width: '100%', opacity: loading ? 0.7 : 1 }, onClick: handleSubmit, disabled: loading },
          loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'
        )
      )
    )
  );
}

// ── Components ────────────────────────────────────────────────────────────────

function Logo() {
  return React.createElement('svg', {
    width: '44', height: '44', viewBox: '0 0 100 100',
    fill: 'none', xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { d: 'M18 42 Q18 78 50 78 Q82 78 82 42', stroke: '#3a7d44', strokeWidth: '5.5', strokeLinecap: 'round', fill: 'none' }),
    React.createElement('line', { x1: '50', y1: '78', x2: '50', y2: '20', stroke: '#3a7d44', strokeWidth: '5.5', strokeLinecap: 'round' }),
    React.createElement('line', { x1: '50', y1: '78', x2: '50', y2: '90', stroke: '#3a7d44', strokeWidth: '4', strokeLinecap: 'round' }),
    React.createElement('line', { x1: '50', y1: '83', x2: '32', y2: '90', stroke: '#3a7d44', strokeWidth: '3.5', strokeLinecap: 'round' }),
    React.createElement('line', { x1: '50', y1: '83', x2: '68', y2: '90', stroke: '#3a7d44', strokeWidth: '3.5', strokeLinecap: 'round' }),
    React.createElement('line', { x1: '32', y1: '90', x2: '22', y2: '96', stroke: '#3a7d44', strokeWidth: '3', strokeLinecap: 'round' }),
    React.createElement('line', { x1: '68', y1: '90', x2: '78', y2: '96', stroke: '#3a7d44', strokeWidth: '3', strokeLinecap: 'round' }),
    React.createElement('path', { d: 'M50 38 Q36 22 24 26 Q28 40 50 38Z', stroke: '#3a7d44', strokeWidth: '4.5', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }),
    React.createElement('path', { d: 'M50 30 Q62 12 76 16 Q72 32 50 30Z', stroke: '#3a7d44', strokeWidth: '4.5', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' })
  );
}

function WaterBadge({ plant }) {
  const status = waterStatus(plant);
  const label = waterStatusLabel(plant);
  return React.createElement('span', { className: `water-badge ${status}` },
    status === 'due' ? '💧' : status === 'today' ? '⚠️' : '✓', ' ', label
  );
}

function PlantCard({ plant, onWater, onClick }) {
  return React.createElement('div', { className: 'plant-card', onClick },
    plant.photo
      ? React.createElement('img', { src: plant.photo, alt: plant.name, className: 'plant-card-photo' })
      : React.createElement('div', { className: 'plant-emoji' }, plant.emoji),
    React.createElement('div', { className: 'plant-info' },
      React.createElement('div', { className: 'plant-name' }, plant.name),
      React.createElement('div', { className: 'plant-type' }, plant.category),
      React.createElement(WaterBadge, { plant })
    ),
    React.createElement('button', {
      className: 'water-btn',
      onClick: e => { e.stopPropagation(); onWater(plant.id); }
    }, '💧')
  );
}

function AddPlantModal({ onClose, onSave, editPlant }) {
  const [name, setName] = useState(editPlant?.name || '');
  const [emoji, setEmoji] = useState(editPlant?.emoji || '🌿');
  const [category, setCategory] = useState(editPlant?.category || 'Houseplant');
  const [waterInterval, setWaterInterval] = useState(editPlant?.water_interval || 7);
  const [notes, setNotes] = useState(editPlant?.notes || '');
  const [location, setLocation] = useState(editPlant?.location || '');
  const [photo, setPhoto] = useState(editPlant?.photo || null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlantInfo, setSelectedPlantInfo] = useState(null);

  function handleNameChange(val) {
    setName(val);
    setSuggestions(searchPlants(val));
    if (selectedPlantInfo && val !== selectedPlantInfo.name) setSelectedPlantInfo(null);
  }

  function handleSuggestionPick(plant) {
    setName(plant.name);
    setEmoji(plant.emoji);
    setCategory(plant.category);
    setWaterInterval(plant.water_interval);
    setSelectedPlantInfo(plant);
    setSuggestions([]);
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, category, water_interval: Number(waterInterval), notes, location, photo });
  }

  const intervalLabel = WATER_INTERVALS.find(w => w.days === Number(waterInterval))?.label;

  return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
    React.createElement('div', { className: 'modal-sheet', onClick: e => e.stopPropagation() },
      React.createElement('div', { className: 'modal-handle' }),
      React.createElement('div', { className: 'modal-title' }, editPlant ? 'Edit Plant' : 'Add a Plant'),

      // Photo upload
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Photo (optional)'),
        React.createElement('label', { className: 'photo-upload' },
          photo && React.createElement('img', { src: photo, alt: 'plant' }),
          !photo && React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { className: 'photo-upload-icon' }, '📷'),
            React.createElement('div', { className: 'photo-upload-label' }, 'Tap to add a photo')
          ),
          React.createElement('input', { type: 'file', accept: 'image/*', onChange: handlePhoto })
        )
      ),

      // Name with autocomplete
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Plant Name'),
        React.createElement('div', { className: 'autocomplete-wrap' },
          React.createElement('input', {
            className: 'form-input',
            placeholder: 'e.g. Pothos, Monstera, Basil…',
            value: name,
            onChange: e => handleNameChange(e.target.value),
            autoComplete: 'off'
          }),
          suggestions.length > 0 && React.createElement('div', { className: 'autocomplete-list' },
            suggestions.map(p => React.createElement('div', {
              key: p.name, className: 'autocomplete-item', onClick: () => handleSuggestionPick(p)
            },
              React.createElement('span', { className: 'autocomplete-item-emoji' }, p.emoji),
              React.createElement('div', { className: 'autocomplete-item-info' },
                React.createElement('div', { className: 'autocomplete-item-name' }, p.name),
                React.createElement('div', { className: 'autocomplete-item-sub' }, `${p.category} · ${WATER_INTERVALS.find(w => w.days === p.water_interval)?.label}`)
              )
            ))
          )
        )
      ),

      selectedPlantInfo && React.createElement('div', { className: 'plant-info-banner' },
        React.createElement('strong', null, '☀️ Light: '), selectedPlantInfo.light, React.createElement('br'),
        React.createElement('strong', null, '💧 Water: '), intervalLabel, React.createElement('br'),
        selectedPlantInfo.notes
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Pick an icon'),
        React.createElement('div', { className: 'emoji-picker' },
          PLANT_EMOJIS.map(e => React.createElement('button', {
            key: e, className: `emoji-option ${emoji === e ? 'selected' : ''}`, onClick: () => setEmoji(e)
          }, e))
        )
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Category'),
        React.createElement('select', { className: 'form-select', value: category, onChange: e => setCategory(e.target.value) },
          CATEGORIES.map(c => React.createElement('option', { key: c, value: c }, c))
        )
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Watering schedule'),
        React.createElement('select', { className: 'form-select', value: waterInterval, onChange: e => setWaterInterval(e.target.value) },
          WATER_INTERVALS.map(w => React.createElement('option', { key: w.days, value: w.days }, w.label))
        )
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Location (optional)'),
        React.createElement('input', { className: 'form-input', placeholder: 'e.g. Living room…', value: location, onChange: e => setLocation(e.target.value) })
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Notes (optional)'),
        React.createElement('textarea', { className: 'form-textarea', placeholder: 'Sunlight needs, soil type…', value: notes, onChange: e => setNotes(e.target.value) })
      ),

      React.createElement('div', { className: 'btn-row' },
        React.createElement('button', { className: 'btn-secondary', onClick: onClose }, 'Cancel'),
        React.createElement('button', { className: 'btn-primary', onClick: handleSave }, editPlant ? 'Save Changes' : 'Add Plant')
      )
    )
  );
}

function PlantDetail({ plant, onBack, onWater, onEdit, onDelete }) {
  const intervalLabel = WATER_INTERVALS.find(w => w.days === plant.water_interval)?.label || `Every ${plant.water_interval} days`;

  return React.createElement('div', null,
    React.createElement('button', { className: 'back-btn', onClick: onBack }, '‹ All Plants'),
    plant.photo && React.createElement('img', { src: plant.photo, alt: plant.name, className: 'detail-photo' }),
    React.createElement('div', { className: 'detail-header' },
      React.createElement('div', { className: 'detail-emoji' }, plant.emoji),
      React.createElement('div', null,
        React.createElement('div', { className: 'detail-name' }, plant.name),
        React.createElement('div', { className: 'detail-type' }, plant.category),
        React.createElement(WaterBadge, { plant })
      )
    ),

    React.createElement('div', { className: 'info-card' },
      React.createElement('div', { className: 'info-row' },
        React.createElement('span', { className: 'info-row-label' }, 'Watering'),
        React.createElement('span', { className: 'info-row-value' }, intervalLabel)
      ),
      plant.location && React.createElement('div', { className: 'info-row' },
        React.createElement('span', { className: 'info-row-label' }, 'Location'),
        React.createElement('span', { className: 'info-row-value' }, plant.location)
      ),
      React.createElement('div', { className: 'info-row' },
        React.createElement('span', { className: 'info-row-label' }, 'Last watered'),
        React.createElement('span', { className: 'info-row-value' },
          plant.last_watered ? new Date(plant.last_watered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'
        )
      ),
      React.createElement('div', { className: 'info-row' },
        React.createElement('span', { className: 'info-row-label' }, 'Added'),
        React.createElement('span', { className: 'info-row-value' },
          new Date(plant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        )
      )
    ),

    plant.notes && React.createElement('div', { className: 'info-card' },
      React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' } }, 'Notes'),
      React.createElement('p', { style: { fontSize: '15px', lineHeight: 1.5 } }, plant.notes)
    ),

    React.createElement('div', { className: 'btn-row' },
      React.createElement('button', { className: 'btn-secondary', onClick: onEdit }, '✏️ Edit'),
      React.createElement('button', { className: 'btn-primary', onClick: () => onWater(plant.id) }, '💧 Water Now')
    ),
    React.createElement('button', { className: 'btn-danger', onClick: onDelete }, 'Remove Plant')
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [plants, setPlants] = useState([]);
  const [tab, setTab] = useState('today');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for existing token on load
  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    apiFetch('/auth/login', { method: 'POST', body: {} })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
    // Just mark checked — token presence means we try to load plants
    setAuthChecked(true);
  }, []);

  // Load plants when user is set
  useEffect(() => {
    if (!getToken()) return;
    loadPlants();
  }, [user]);

  async function loadPlants() {
    try {
      const data = await apiFetch('/plants');
      setPlants(data);
    } catch {
      clearToken();
      setUser(null);
    }
  }

  function handleAuth(userData) {
    setUser(userData);
    loadPlants();
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setPlants([]);
  }

  async function handleWater(id) {
    const plant = plants.find(p => p.id === id);
    if (!plant) return;
    const updated = await apiFetch(`/plants/${id}`, {
      method: 'PUT',
      body: { ...plant, last_watered: new Date().toISOString() }
    });
    setPlants(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function handleSave(data) {
    if (editingPlant) {
      const updated = await apiFetch(`/plants/${editingPlant.id}`, { method: 'PUT', body: { ...editingPlant, ...data } });
      setPlants(prev => prev.map(p => p.id === editingPlant.id ? updated : p));
      setEditingPlant(null);
    } else {
      const created = await apiFetch('/plants', { method: 'POST', body: data });
      setPlants(prev => [...prev, created]);
    }
    setShowAdd(false);
  }

  async function handleDelete(id) {
    await apiFetch(`/plants/${id}`, { method: 'DELETE' });
    setPlants(prev => prev.filter(p => p.id !== id));
    setSelectedId(null);
  }

  if (!authChecked) return null;
  if (!getToken() && !user) return React.createElement(AuthScreen, { onAuth: handleAuth });

  const selectedPlant = plants.find(p => p.id === selectedId);
  const duePlants = plants.filter(p => waterStatus(p) !== 'ok').sort((a, b) => daysSince(a.last_watered) - daysSince(b.last_watered));
  const allPlants = [...plants].sort((a, b) => a.name.localeCompare(b.name));
  const dueCount = plants.filter(p => waterStatus(p) === 'due').length;
  const todayCount = plants.filter(p => waterStatus(p) === 'today').length;

  // Detail view
  if (selectedPlant) {
    return React.createElement('div', { className: 'app-shell' },
      React.createElement('div', { className: 'header' },
        React.createElement('div', { className: 'header-logo' },
          React.createElement(Logo),
          React.createElement('span', { className: 'header-logo-wordmark' }, 'rooted')
        )
      ),
      React.createElement('div', { className: 'content' },
        React.createElement(PlantDetail, {
          plant: selectedPlant,
          onBack: () => setSelectedId(null),
          onWater: handleWater,
          onEdit: () => { setEditingPlant(selectedPlant); setShowAdd(true); },
          onDelete: () => handleDelete(selectedPlant.id)
        })
      ),
      showAdd && React.createElement(AddPlantModal, {
        onClose: () => { setShowAdd(false); setEditingPlant(null); },
        onSave: handleSave,
        editPlant: editingPlant
      })
    );
  }

  // Main view
  return React.createElement('div', { className: 'app-shell' },
    React.createElement('div', { className: 'header' },
      React.createElement('div', { className: 'header-logo' },
        React.createElement(Logo),
        React.createElement('span', { className: 'header-logo-wordmark' }, 'rooted')
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('p', null, new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })),
        React.createElement('button', { onClick: handleLogout, style: { background: 'none', border: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' } }, 'Sign out')
      )
    ),

    React.createElement('div', { className: 'tab-bar' },
      React.createElement('button', { className: `tab-btn ${tab === 'today' ? 'active' : ''}`, onClick: () => setTab('today') }, 'Today'),
      React.createElement('button', { className: `tab-btn ${tab === 'all' ? 'active' : ''}`, onClick: () => setTab('all') }, `All (${plants.length})`)
    ),

    React.createElement('div', { className: 'content' },
      tab === 'today' && React.createElement('div', null,
        plants.length > 0 && React.createElement('div', { className: 'summary-card' },
          React.createElement('h2', null, dueCount + todayCount > 0 ? `${dueCount + todayCount} plant${dueCount + todayCount !== 1 ? 's' : ''} need water` : 'All plants are happy 🌿'),
          React.createElement('p', null, dueCount + todayCount > 0 ? 'Tap 💧 to mark as watered' : 'Check back tomorrow'),
          React.createElement('div', { className: 'summary-stats' },
            React.createElement('div', { className: 'stat' }, React.createElement('div', { className: 'stat-num' }, plants.length), React.createElement('div', { className: 'stat-label' }, 'Total')),
            React.createElement('div', { className: 'stat' }, React.createElement('div', { className: 'stat-num' }, dueCount), React.createElement('div', { className: 'stat-label' }, 'Overdue')),
            React.createElement('div', { className: 'stat' }, React.createElement('div', { className: 'stat-num' }, todayCount), React.createElement('div', { className: 'stat-label' }, 'Due soon'))
          )
        ),
        duePlants.length > 0
          ? React.createElement('div', null,
              React.createElement('div', { className: 'section-label' }, 'Needs water'),
              duePlants.map(p => React.createElement(PlantCard, { key: p.id, plant: p, onWater: handleWater, onClick: () => setSelectedId(p.id) }))
            )
          : plants.length > 0
            ? React.createElement('div', { className: 'empty-state' }, React.createElement('div', { className: 'empty-icon' }, '✅'), React.createElement('h3', null, 'All watered'), React.createElement('p', null, 'Nothing needs water right now.'))
            : React.createElement('div', { className: 'empty-state' }, React.createElement('div', { className: 'empty-icon' }, '🪴'), React.createElement('h3', null, 'No plants yet'), React.createElement('p', null, 'Add your first plant to get started.'))
      ),

      tab === 'all' && React.createElement('div', null,
        allPlants.length > 0
          ? allPlants.map(p => React.createElement(PlantCard, { key: p.id, plant: p, onWater: handleWater, onClick: () => setSelectedId(p.id) }))
          : React.createElement('div', { className: 'empty-state' }, React.createElement('div', { className: 'empty-icon' }, '🪴'), React.createElement('h3', null, 'No plants yet'), React.createElement('p', null, 'Tap the button below to add your first plant.'))
      )
    ),

    React.createElement('button', { className: 'fab', onClick: () => setShowAdd(true) }, '＋ Add Plant'),

    showAdd && React.createElement(AddPlantModal, {
      onClose: () => { setShowAdd(false); setEditingPlant(null); },
      onSave: handleSave,
      editPlant: editingPlant
    })
  );
}

function VersionBadge() {
  const [version, setVersion] = useState('');
  useEffect(() => {
    fetch('/version.json')
      .then(r => r.json())
      .then(d => setVersion(d.version))
      .catch(() => {});
  }, []);
  if (!version) return null;
  return React.createElement('div', { className: 'version-badge' }, version);
}

ReactDOM.createRoot(document.getElementById('app')).render(
  React.createElement(React.Fragment, null,
    React.createElement(App),
    React.createElement(VersionBadge)
  )
);
