const { useState, useEffect, useCallback } = React;

const API = '/api';

// ── helpers ──────────────────────────────────────────────────────────────────

const PLANT_EMOJIS = ['🌿', '🌵', '🌱', '🌸', '🌺', '🍀', '🌻', '🌴', '🪴', '🌾', '🍃', '🌲'];
const CATEGORIES = ['Houseplant', 'Garden', 'Herb', 'Succulent', 'Tree', 'Lawn', 'Flower'];
const HEALTH_OPTIONS = ['thriving', 'okay', 'struggling', 'dormant'];
const WATER_INTERVALS = [
  { label: 'Every day', days: 1 },
  { label: 'Every 2 days', days: 2 },
  { label: 'Every 3 days', days: 3 },
  { label: 'Once a week', days: 7 },
  { label: 'Every 2 weeks', days: 14 },
  { label: 'Once a month', days: 30 },
];
const FERTILIZE_INTERVALS = [
  { label: 'Every 2 weeks', days: 14 },
  { label: 'Once a month', days: 30 },
  { label: 'Every 2 months', days: 60 },
  { label: 'Every 3 months', days: 90 },
];
const ROOM_EMOJIS = ['🏠', '🛋️', '🛏️', '🍳', '🚿', '🌳', '🏢', '☀️'];

function getToken() { return localStorage.getItem('rooted_token'); }
function setToken(t) { localStorage.setItem('rooted_token', t); }
function clearToken() { localStorage.removeItem('rooted_token'); }
function getDarkMode() { return localStorage.getItem('rooted_dark') === 'true'; }
function setDarkMode(v) { localStorage.setItem('rooted_dark', v); document.body.classList.toggle('dark', v); }

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

function streakDays(plant) {
  if (!plant.streak_start) return 0;
  return Math.floor((Date.now() - new Date(plant.streak_start)) / 86400000);
}

function seasonalTip() {
  const month = new Date().getMonth();
  if (month >= 11 || month <= 1) return '❄️ Winter: Most plants need less water. Reduce frequency.';
  if (month >= 2 && month <= 4) return '🌱 Spring: Growth season! Time to fertilize and increase watering.';
  if (month >= 5 && month <= 7) return '☀️ Summer: Water more frequently. Watch for heat stress.';
  return '🍂 Fall: Slow down watering. Bring outdoor plants inside.';
}

function plantOfTheDay(plants) {
  if (!plants.length) return null;
  const idx = Math.floor(Date.now() / 86400000) % plants.length;
  return plants[idx];
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
  return React.createElement('svg', { width: '44', height: '44', viewBox: '0 0 100 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
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

function HealthBadge({ health }) {
  const colors = { thriving: 'ok', okay: 'ok', struggling: 'today', dormant: 'due' };
  const icons = { thriving: '🌟', okay: '👍', struggling: '😟', dormant: '💤' };
  return React.createElement('span', { className: `water-badge ${colors[health] || 'ok'}` }, icons[health] || '🌟', ' ', health);
}

function PlantCard({ plant, onWater, onClick }) {
  return React.createElement('div', { className: 'plant-card', onClick },
    plant.photo
      ? React.createElement('img', { src: plant.photo, alt: plant.name, className: 'plant-card-photo' })
      : React.createElement('div', { className: 'plant-emoji' }, plant.emoji),
    React.createElement('div', { className: 'plant-info' },
      React.createElement('div', { className: 'plant-name' }, plant.name),
      React.createElement('div', { className: 'plant-type' }, plant.category, plant.room ? ` · ${plant.room}` : ''),
      React.createElement(WaterBadge, { plant })
    ),
    React.createElement('button', { className: 'water-btn', onClick: e => { e.stopPropagation(); onWater(plant.id); } }, '💧')
  );
}

// ── Add/Edit Plant Modal ──────────────────────────────────────────────────────

function AddPlantModal({ onClose, onSave, editPlant, rooms }) {
  const [name, setName] = useState(editPlant?.name || '');
  const [emoji, setEmoji] = useState(editPlant?.emoji || '🌿');
  const [category, setCategory] = useState(editPlant?.category || 'Houseplant');
  const [waterInterval, setWaterInterval] = useState(editPlant?.water_interval || 7);
  const [fertilizeInterval, setFertilizeInterval] = useState(editPlant?.fertilize_interval || 30);
  const [notes, setNotes] = useState(editPlant?.notes || '');
  const [location, setLocation] = useState(editPlant?.location || '');
  const [room, setRoom] = useState(editPlant?.room || '');
  const [health, setHealth] = useState(editPlant?.health || 'thriving');
  const [photo, setPhoto] = useState(editPlant?.photo || null);
  const [tags, setTags] = useState(editPlant?.tags || []);
  const [tagInput, setTagInput] = useState('');
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

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  }

  function removeTag(t) { setTags(tags.filter(x => x !== t)); }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, category, water_interval: Number(waterInterval), fertilize_interval: Number(fertilizeInterval), notes, location, room, photo, tags, health });
  }

  const intervalLabel = WATER_INTERVALS.find(w => w.days === Number(waterInterval))?.label;

  return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
    React.createElement('div', { className: 'modal-sheet', onClick: e => e.stopPropagation() },
      React.createElement('div', { className: 'modal-handle' }),
      React.createElement('div', { className: 'modal-title' }, editPlant ? 'Edit Plant' : 'Add a Plant'),

      // Photo
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Photo'),
        React.createElement('label', { className: 'photo-upload' },
          photo && React.createElement('img', { src: photo, alt: 'plant' }),
          !photo && React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { className: 'photo-upload-icon' }, '📷'),
            React.createElement('div', { className: 'photo-upload-label' }, 'Tap to add a photo')
          ),
          React.createElement('input', { type: 'file', accept: 'image/*', onChange: handlePhoto })
        )
      ),

      // Name
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Plant Name'),
        React.createElement('div', { className: 'autocomplete-wrap' },
          React.createElement('input', { className: 'form-input', placeholder: 'e.g. Pothos, Monstera…', value: name, onChange: e => handleNameChange(e.target.value), autoComplete: 'off' }),
          suggestions.length > 0 && React.createElement('div', { className: 'autocomplete-list' },
            suggestions.map(p => React.createElement('div', { key: p.name, className: 'autocomplete-item', onClick: () => handleSuggestionPick(p) },
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

      // Emoji
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Icon'),
        React.createElement('div', { className: 'emoji-picker' },
          PLANT_EMOJIS.map(e => React.createElement('button', { key: e, className: `emoji-option ${emoji === e ? 'selected' : ''}`, onClick: () => setEmoji(e) }, e))
        )
      ),

      // Category & Room
      React.createElement('div', { style: { display: 'flex', gap: '10px' } },
        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
          React.createElement('label', { className: 'form-label' }, 'Category'),
          React.createElement('select', { className: 'form-select', value: category, onChange: e => setCategory(e.target.value) },
            CATEGORIES.map(c => React.createElement('option', { key: c, value: c }, c))
          )
        ),
        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
          React.createElement('label', { className: 'form-label' }, 'Room'),
          React.createElement('select', { className: 'form-select', value: room, onChange: e => setRoom(e.target.value) },
            React.createElement('option', { value: '' }, 'None'),
            rooms.map(r => React.createElement('option', { key: r.id, value: r.name }, `${r.emoji} ${r.name}`))
          )
        )
      ),

      // Watering & Fertilizing
      React.createElement('div', { style: { display: 'flex', gap: '10px' } },
        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
          React.createElement('label', { className: 'form-label' }, 'Watering'),
          React.createElement('select', { className: 'form-select', value: waterInterval, onChange: e => setWaterInterval(e.target.value) },
            WATER_INTERVALS.map(w => React.createElement('option', { key: w.days, value: w.days }, w.label))
          )
        ),
        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
          React.createElement('label', { className: 'form-label' }, 'Fertilizing'),
          React.createElement('select', { className: 'form-select', value: fertilizeInterval, onChange: e => setFertilizeInterval(e.target.value) },
            FERTILIZE_INTERVALS.map(w => React.createElement('option', { key: w.days, value: w.days }, w.label))
          )
        )
      ),

      // Health
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Health'),
        React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          HEALTH_OPTIONS.map(h => React.createElement('button', {
            key: h, className: `tab-btn ${health === h ? 'active' : ''}`,
            style: { padding: '6px 12px', fontSize: '13px' },
            onClick: () => setHealth(h)
          }, h))
        )
      ),

      // Tags
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Tags'),
        React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' } },
          tags.map(t => React.createElement('span', { key: t, className: 'water-badge ok', style: { cursor: 'pointer' }, onClick: () => removeTag(t) }, t, ' ×'))
        ),
        React.createElement('div', { style: { display: 'flex', gap: '6px' } },
          React.createElement('input', { className: 'form-input', placeholder: 'Add tag…', value: tagInput, onChange: e => setTagInput(e.target.value), onKeyDown: e => e.key === 'Enter' && addTag(), style: { flex: 1 } }),
          React.createElement('button', { className: 'btn-primary', style: { padding: '10px 14px' }, onClick: addTag }, '+')
        )
      ),

      // Location & Notes
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Location'),
        React.createElement('input', { className: 'form-input', placeholder: 'e.g. Window sill…', value: location, onChange: e => setLocation(e.target.value) })
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Notes'),
        React.createElement('textarea', { className: 'form-textarea', placeholder: 'Any notes…', value: notes, onChange: e => setNotes(e.target.value) })
      ),

      React.createElement('div', { className: 'btn-row' },
        React.createElement('button', { className: 'btn-secondary', onClick: onClose }, 'Cancel'),
        React.createElement('button', { className: 'btn-primary', onClick: handleSave }, editPlant ? 'Save' : 'Add Plant')
      )
    )
  );
}

// ── Plant Detail ──────────────────────────────────────────────────────────────

function PlantDetail({ plant, onBack, onWater, onFertilize, onEdit, onDelete }) {
  const [logs, setLogs] = useState([]);
  const [journal, setJournal] = useState([]);
  const [journalNote, setJournalNote] = useState('');
  const [journalPhoto, setJournalPhoto] = useState(null);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    apiFetch(`/plants/${plant.id}/logs`).then(setLogs).catch(() => {});
    apiFetch(`/plants/${plant.id}/journal`).then(setJournal).catch(() => {});
  }, [plant.id]);

  async function addJournalEntry() {
    if (!journalNote.trim()) return;
    const entry = await apiFetch(`/plants/${plant.id}/journal`, { method: 'POST', body: { note: journalNote, photo: journalPhoto } });
    setJournal([entry, ...journal]);
    setJournalNote('');
    setJournalPhoto(null);
  }

  function handleJournalPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setJournalPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  const intervalLabel = WATER_INTERVALS.find(w => w.days === plant.water_interval)?.label || `Every ${plant.water_interval} days`;
  const fertLabel = FERTILIZE_INTERVALS.find(w => w.days === plant.fertilize_interval)?.label || `Every ${plant.fertilize_interval} days`;
  const streak = streakDays(plant);

  return React.createElement('div', null,
    React.createElement('button', { className: 'back-btn', onClick: onBack }, '‹ All Plants'),
    plant.photo && React.createElement('img', { src: plant.photo, alt: plant.name, className: 'detail-photo' }),
    React.createElement('div', { className: 'detail-header' },
      React.createElement('div', { className: 'detail-emoji' }, plant.emoji),
      React.createElement('div', null,
        React.createElement('div', { className: 'detail-name' }, plant.name),
        React.createElement('div', { className: 'detail-type' }, plant.category, plant.room ? ` · ${plant.room}` : ''),
        React.createElement(WaterBadge, { plant }),
        React.createElement(HealthBadge, { health: plant.health })
      )
    ),

    streak > 0 && React.createElement('div', { className: 'plant-info-banner' }, `🔥 ${streak} day streak — keep it up!`),

    plant.tags && plant.tags.length > 0 && React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' } },
      plant.tags.map(t => React.createElement('span', { key: t, className: 'water-badge ok' }, t))
    ),

    // Tabs
    React.createElement('div', { className: 'tab-bar', style: { padding: 0, marginBottom: '16px' } },
      React.createElement('button', { className: `tab-btn ${tab === 'info' ? 'active' : ''}`, onClick: () => setTab('info') }, 'Info'),
      React.createElement('button', { className: `tab-btn ${tab === 'history' ? 'active' : ''}`, onClick: () => setTab('history') }, 'History'),
      React.createElement('button', { className: `tab-btn ${tab === 'journal' ? 'active' : ''}`, onClick: () => setTab('journal') }, 'Journal')
    ),

    tab === 'info' && React.createElement('div', null,
      React.createElement('div', { className: 'info-card' },
        React.createElement('div', { className: 'info-row' },
          React.createElement('span', { className: 'info-row-label' }, 'Watering'),
          React.createElement('span', { className: 'info-row-value' }, intervalLabel)
        ),
        React.createElement('div', { className: 'info-row' },
          React.createElement('span', { className: 'info-row-label' }, 'Fertilizing'),
          React.createElement('span', { className: 'info-row-value' }, fertLabel)
        ),
        plant.location && React.createElement('div', { className: 'info-row' },
          React.createElement('span', { className: 'info-row-label' }, 'Location'),
          React.createElement('span', { className: 'info-row-value' }, plant.location)
        ),
        React.createElement('div', { className: 'info-row' },
          React.createElement('span', { className: 'info-row-label' }, 'Last watered'),
          React.createElement('span', { className: 'info-row-value' }, plant.last_watered ? new Date(plant.last_watered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never')
        ),
        React.createElement('div', { className: 'info-row' },
          React.createElement('span', { className: 'info-row-label' }, 'Added'),
          React.createElement('span', { className: 'info-row-value' }, new Date(plant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
        )
      ),
      plant.notes && React.createElement('div', { className: 'info-card' },
        React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' } }, 'Notes'),
        React.createElement('p', { style: { fontSize: '15px', lineHeight: 1.5 } }, plant.notes)
      )
    ),

    tab === 'history' && React.createElement('div', null,
      logs.length === 0
        ? React.createElement('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' } }, 'No care history yet')
        : logs.map(log => React.createElement('div', { key: log.id, className: 'info-card', style: { marginBottom: '8px' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
              React.createElement('span', null, log.action === 'watered' ? '💧 Watered' : '🌱 Fertilized'),
              React.createElement('span', { style: { fontSize: '13px', color: 'var(--text-secondary)' } }, new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))
            ),
            log.note && React.createElement('p', { style: { fontSize: '13px', marginTop: '4px', color: 'var(--text-secondary)' } }, log.note)
          ))
    ),

    tab === 'journal' && React.createElement('div', null,
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('textarea', { className: 'form-textarea', placeholder: 'Add a journal entry…', value: journalNote, onChange: e => setJournalNote(e.target.value) }),
        React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } },
          React.createElement('label', { className: 'btn-secondary', style: { padding: '8px 12px', fontSize: '13px', textAlign: 'center', cursor: 'pointer' } },
            '📷', React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleJournalPhoto, style: { display: 'none' } })
          ),
          React.createElement('button', { className: 'btn-primary', style: { flex: 1, padding: '8px' }, onClick: addJournalEntry }, 'Add Entry')
        ),
        journalPhoto && React.createElement('img', { src: journalPhoto, style: { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' } })
      ),
      journal.map(entry => React.createElement('div', { key: entry.id, className: 'info-card', style: { marginBottom: '8px' } },
        React.createElement('div', { style: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' } },
          new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        ),
        React.createElement('p', { style: { fontSize: '15px', lineHeight: 1.5 } }, entry.note),
        entry.photo && React.createElement('img', { src: entry.photo, style: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' } })
      ))
    ),

    React.createElement('div', { className: 'btn-row', style: { marginTop: '16px' } },
      React.createElement('button', { className: 'btn-secondary', onClick: onEdit }, '✏️ Edit'),
      React.createElement('button', { className: 'btn-primary', onClick: () => onWater(plant.id) }, '💧 Water'),
      React.createElement('button', { className: 'btn-primary', style: { background: '#8B5E3C' }, onClick: () => onFertilize(plant.id) }, '🌱 Feed')
    ),
    React.createElement('button', { className: 'btn-danger', onClick: onDelete }, 'Remove Plant')
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [plants, setPlants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState('today');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [filterRoom, setFilterRoom] = useState('');
  const [dark, setDark] = useState(getDarkMode());
  const [showSettings, setShowSettings] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState('🏠');

  useEffect(() => { setAuthChecked(true); }, []);
  useEffect(() => { if (getToken()) { loadPlants(); loadRooms(); } }, [user]);
  useEffect(() => { document.body.classList.toggle('dark', dark); }, [dark]);

  async function loadPlants() {
    try { setPlants(await apiFetch('/plants')); }
    catch { clearToken(); setUser(null); }
  }

  async function loadRooms() {
    try { setRooms(await apiFetch('/rooms')); } catch {}
  }

  function handleAuth(userData) { setUser(userData); }
  function handleLogout() { clearToken(); setUser(null); setPlants([]); }

  async function handleWater(id) {
    const updated = await apiFetch(`/plants/${id}/water`, { method: 'POST', body: {} });
    setPlants(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function handleFertilize(id) {
    const updated = await apiFetch(`/plants/${id}/fertilize`, { method: 'POST', body: {} });
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

  async function addRoom() {
    if (!newRoomName.trim()) return;
    const room = await apiFetch('/rooms', { method: 'POST', body: { name: newRoomName.trim(), emoji: newRoomEmoji } });
    setRooms([...rooms, room]);
    setNewRoomName('');
  }

  async function deleteRoom(id) {
    await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
    setRooms(rooms.filter(r => r.id !== id));
  }

  function toggleDark() { const v = !dark; setDark(v); setDarkMode(v); }

  if (!authChecked) return null;
  if (!getToken() && !user) return React.createElement(AuthScreen, { onAuth: handleAuth });

  const selectedPlant = plants.find(p => p.id === selectedId);
  const filteredPlants = filterRoom ? plants.filter(p => p.room === filterRoom) : plants;
  const duePlants = filteredPlants.filter(p => waterStatus(p) !== 'ok').sort((a, b) => daysSince(a.last_watered) - daysSince(b.last_watered));
  const allPlants = [...filteredPlants].sort((a, b) => a.name.localeCompare(b.name));
  const dueCount = filteredPlants.filter(p => waterStatus(p) === 'due').length;
  const todayCount = filteredPlants.filter(p => waterStatus(p) === 'today').length;
  const potd = plantOfTheDay(plants);

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
          onFertilize: handleFertilize,
          onEdit: () => { setEditingPlant(selectedPlant); setShowAdd(true); },
          onDelete: () => handleDelete(selectedPlant.id)
        })
      ),
      showAdd && React.createElement(AddPlantModal, { onClose: () => { setShowAdd(false); setEditingPlant(null); }, onSave: handleSave, editPlant: editingPlant, rooms })
    );
  }

  // Settings view
  if (showSettings) {
    return React.createElement('div', { className: 'app-shell' },
      React.createElement('div', { className: 'header' },
        React.createElement('div', { className: 'header-logo' },
          React.createElement(Logo),
          React.createElement('span', { className: 'header-logo-wordmark' }, 'rooted')
        )
      ),
      React.createElement('div', { className: 'content' },
        React.createElement('button', { className: 'back-btn', onClick: () => setShowSettings(false) }, '‹ Back'),
        React.createElement('div', { className: 'modal-title' }, 'Settings'),

        // Dark mode
        React.createElement('div', { className: 'info-card', style: { cursor: 'pointer' }, onClick: toggleDark },
          React.createElement('div', { className: 'info-row', style: { borderBottom: 'none' } },
            React.createElement('span', { className: 'info-row-label' }, '🌙 Dark Mode'),
            React.createElement('span', { className: 'info-row-value' }, dark ? 'On' : 'Off')
          )
        ),

        // Rooms
        React.createElement('div', { className: 'section-label', style: { marginTop: '24px' } }, 'Rooms'),
        rooms.map(r => React.createElement('div', { key: r.id, className: 'info-card', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
          React.createElement('span', null, `${r.emoji} ${r.name}`),
          React.createElement('button', { onClick: () => deleteRoom(r.id), style: { background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px' } }, '×')
        )),
        React.createElement('div', { style: { display: 'flex', gap: '6px', marginTop: '8px' } },
          React.createElement('select', { className: 'form-select', value: newRoomEmoji, onChange: e => setNewRoomEmoji(e.target.value), style: { width: '60px' } },
            ROOM_EMOJIS.map(e => React.createElement('option', { key: e, value: e }, e))
          ),
          React.createElement('input', { className: 'form-input', placeholder: 'Room name', value: newRoomName, onChange: e => setNewRoomName(e.target.value), style: { flex: 1 } }),
          React.createElement('button', { className: 'btn-primary', style: { padding: '10px 14px' }, onClick: addRoom }, '+')
        ),

        // Export
        React.createElement('div', { className: 'section-label', style: { marginTop: '24px' } }, 'Data'),
        React.createElement('button', { className: 'btn-secondary', style: { width: '100%', marginBottom: '10px' }, onClick: () => {
          const blob = new Blob([JSON.stringify(plants, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'rooted-plants.json'; a.click();
        }}, '📥 Export Plant Data'),

        React.createElement('button', { className: 'btn-danger', style: { marginTop: '20px' }, onClick: handleLogout }, 'Sign Out')
      )
    );
  }

  // Main view
  return React.createElement('div', { className: 'app-shell' },
    React.createElement('div', { className: 'header' },
      React.createElement('div', { className: 'header-logo' },
        React.createElement(Logo),
        React.createElement('span', { className: 'header-logo-wordmark' }, 'rooted'),
        React.createElement('button', { onClick: () => setShowSettings(true), style: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' } }, '⚙️')
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('p', null, new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
      )
    ),

    // Room filter
    rooms.length > 0 && React.createElement('div', { style: { display: 'flex', gap: '6px', padding: '0 20px 10px', overflowX: 'auto' } },
      React.createElement('button', { className: `tab-btn ${!filterRoom ? 'active' : ''}`, style: { padding: '5px 12px', fontSize: '12px', whiteSpace: 'nowrap' }, onClick: () => setFilterRoom('') }, 'All'),
      rooms.map(r => React.createElement('button', { key: r.id, className: `tab-btn ${filterRoom === r.name ? 'active' : ''}`, style: { padding: '5px 12px', fontSize: '12px', whiteSpace: 'nowrap' }, onClick: () => setFilterRoom(r.name) }, `${r.emoji} ${r.name}`))
    ),

    React.createElement('div', { className: 'tab-bar' },
      React.createElement('button', { className: `tab-btn ${tab === 'today' ? 'active' : ''}`, onClick: () => setTab('today') }, 'Today'),
      React.createElement('button', { className: `tab-btn ${tab === 'all' ? 'active' : ''}`, onClick: () => setTab('all') }, `All (${filteredPlants.length})`)
    ),

    React.createElement('div', { className: 'content' },
      tab === 'today' && React.createElement('div', null,
        // Seasonal tip
        React.createElement('div', { className: 'plant-info-banner', style: { marginBottom: '12px' } }, seasonalTip()),

        // Summary
        filteredPlants.length > 0 && React.createElement('div', { className: 'summary-card' },
          React.createElement('h2', null, dueCount + todayCount > 0 ? `${dueCount + todayCount} plant${dueCount + todayCount !== 1 ? 's' : ''} need water` : 'All plants are happy 🌿'),
          React.createElement('p', null, dueCount + todayCount > 0 ? 'Tap 💧 to mark as watered' : 'Check back tomorrow'),
          React.createElement('div', { className: 'summary-stats' },
            React.createElement('div', { className: 'stat' }, React.createElement('div', { className: 'stat-num' }, filteredPlants.length), React.createElement('div', { className: 'stat-label' }, 'Total')),
            React.createElement('div', { className: 'stat' }, React.createElement('div', { className: 'stat-num' }, dueCount), React.createElement('div', { className: 'stat-label' }, 'Overdue')),
            React.createElement('div', { className: 'stat' }, React.createElement('div', { className: 'stat-num' }, todayCount), React.createElement('div', { className: 'stat-label' }, 'Due soon'))
          )
        ),

        // Plant of the day
        potd && React.createElement('div', { className: 'info-card', style: { marginBottom: '12px' } },
          React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' } }, '🌟 Plant of the Day'),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement('span', { style: { fontSize: '28px' } }, potd.emoji),
            React.createElement('div', null,
              React.createElement('div', { style: { fontWeight: 600 } }, potd.name),
              React.createElement('div', { style: { fontSize: '13px', color: 'var(--text-secondary)' } }, `Alive for ${streakDays(potd)} days!`)
            )
          )
        ),

        duePlants.length > 0
          ? React.createElement('div', null,
              React.createElement('div', { className: 'section-label' }, 'Needs water'),
              duePlants.map(p => React.createElement(PlantCard, { key: p.id, plant: p, onWater: handleWater, onClick: () => setSelectedId(p.id) }))
            )
          : filteredPlants.length > 0
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
    showAdd && React.createElement(AddPlantModal, { onClose: () => { setShowAdd(false); setEditingPlant(null); }, onSave: handleSave, editPlant: editingPlant, rooms })
  );
}

function VersionBadge() {
  const [version, setVersion] = useState('');
  useEffect(() => { fetch('/version.json').then(r => r.json()).then(d => setVersion(d.version)).catch(() => {}); }, []);
  if (!version) return null;
  return React.createElement('div', { className: 'version-badge' }, version);
}

ReactDOM.createRoot(document.getElementById('app')).render(
  React.createElement(React.Fragment, null,
    React.createElement(App),
    React.createElement(VersionBadge)
  )
);
