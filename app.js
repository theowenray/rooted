const { useState, useEffect, useCallback } = React;

// ── helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rooted_plants';
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

function loadPlants() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function savePlants(plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function waterStatus(plant) {
  const days = daysSince(plant.lastWatered);
  if (days >= plant.waterInterval) return 'due';
  if (days >= plant.waterInterval - 1) return 'today';
  return 'ok';
}

function waterStatusLabel(plant) {
  const days = daysSince(plant.lastWatered);
  const remaining = plant.waterInterval - days;
  if (days >= plant.waterInterval) return `${days - plant.waterInterval + 1}d overdue`;
  if (remaining === 1) return 'Water tomorrow';
  if (remaining <= 0) return 'Water today';
  return `Water in ${remaining}d`;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Notification helpers ──────────────────────────────────────────────────────

async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function scheduleNotifications(plants) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  plants.forEach(plant => {
    const status = waterStatus(plant);
    if (status === 'due' || status === 'today') {
      new Notification('Rooted 🌿', {
        body: `Time to water your ${plant.name}!`,
        icon: '/favicon.ico',
        tag: plant.id,
      });
    }
  });
}

// ── Components ────────────────────────────────────────────────────────────────

function Logo() {
  return React.createElement('svg', {
    width: '44', height: '44', viewBox: '0 0 100 100',
    fill: 'none', xmlns: 'http://www.w3.org/2000/svg'
  },
    // U-shaped soil container
    React.createElement('path', {
      d: 'M18 42 Q18 78 50 78 Q82 78 82 42',
      stroke: '#3a7d44', strokeWidth: '5.5', strokeLinecap: 'round', fill: 'none'
    }),
    // Stem
    React.createElement('line', {
      x1: '50', y1: '78', x2: '50', y2: '20',
      stroke: '#3a7d44', strokeWidth: '5.5', strokeLinecap: 'round'
    }),
    // Root center down
    React.createElement('line', {
      x1: '50', y1: '78', x2: '50', y2: '90',
      stroke: '#3a7d44', strokeWidth: '4', strokeLinecap: 'round'
    }),
    // Root left
    React.createElement('line', {
      x1: '50', y1: '83', x2: '32', y2: '90',
      stroke: '#3a7d44', strokeWidth: '3.5', strokeLinecap: 'round'
    }),
    // Root right
    React.createElement('line', {
      x1: '50', y1: '83', x2: '68', y2: '90',
      stroke: '#3a7d44', strokeWidth: '3.5', strokeLinecap: 'round'
    }),
    // Root far left
    React.createElement('line', {
      x1: '32', y1: '90', x2: '22', y2: '96',
      stroke: '#3a7d44', strokeWidth: '3', strokeLinecap: 'round'
    }),
    // Root far right
    React.createElement('line', {
      x1: '68', y1: '90', x2: '78', y2: '96',
      stroke: '#3a7d44', strokeWidth: '3', strokeLinecap: 'round'
    }),
    // Left leaf
    React.createElement('path', {
      d: 'M50 38 Q36 22 24 26 Q28 40 50 38Z',
      stroke: '#3a7d44', strokeWidth: '4.5', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none'
    }),
    // Right leaf
    React.createElement('path', {
      d: 'M50 30 Q62 12 76 16 Q72 32 50 30Z',
      stroke: '#3a7d44', strokeWidth: '4.5', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none'
    })
  );
}

function WaterBadge({ plant }) {
  const status = waterStatus(plant);
  const label = waterStatusLabel(plant);
  return React.createElement('span', { className: `water-badge ${status}` },
    status === 'due' ? '💧' : status === 'today' ? '⚠️' : '✓',
    ' ', label
  );
}

function PlantCard({ plant, onWater, onClick }) {
  return React.createElement('div', { className: 'plant-card', onClick },
    React.createElement('div', { className: 'plant-emoji' }, plant.emoji),
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
  const [waterInterval, setWaterInterval] = useState(editPlant?.waterInterval || 7);
  const [notes, setNotes] = useState(editPlant?.notes || '');
  const [location, setLocation] = useState(editPlant?.location || '');

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, category, waterInterval: Number(waterInterval), notes, location });
  }

  return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
    React.createElement('div', { className: 'modal-sheet', onClick: e => e.stopPropagation() },
      React.createElement('div', { className: 'modal-handle' }),
      React.createElement('div', { className: 'modal-title' }, editPlant ? 'Edit Plant' : 'Add a Plant'),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Pick an icon'),
        React.createElement('div', { className: 'emoji-picker' },
          PLANT_EMOJIS.map(e =>
            React.createElement('button', {
              key: e,
              className: `emoji-option ${emoji === e ? 'selected' : ''}`,
              onClick: () => setEmoji(e)
            }, e)
          )
        )
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Name'),
        React.createElement('input', {
          className: 'form-input',
          placeholder: 'e.g. Monstera, Basil, Front Lawn…',
          value: name,
          onChange: e => setName(e.target.value)
        })
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Category'),
        React.createElement('select', {
          className: 'form-select',
          value: category,
          onChange: e => setCategory(e.target.value)
        }, CATEGORIES.map(c => React.createElement('option', { key: c, value: c }, c)))
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Watering schedule'),
        React.createElement('select', {
          className: 'form-select',
          value: waterInterval,
          onChange: e => setWaterInterval(e.target.value)
        }, WATER_INTERVALS.map(w =>
          React.createElement('option', { key: w.days, value: w.days }, w.label)
        ))
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Location (optional)'),
        React.createElement('input', {
          className: 'form-input',
          placeholder: 'e.g. Living room, Backyard…',
          value: location,
          onChange: e => setLocation(e.target.value)
        })
      ),

      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Notes (optional)'),
        React.createElement('textarea', {
          className: 'form-textarea',
          placeholder: 'Sunlight needs, soil type, tips…',
          value: notes,
          onChange: e => setNotes(e.target.value)
        })
      ),

      React.createElement('div', { className: 'btn-row' },
        React.createElement('button', { className: 'btn-secondary', onClick: onClose }, 'Cancel'),
        React.createElement('button', { className: 'btn-primary', onClick: handleSave }, editPlant ? 'Save Changes' : 'Add Plant')
      )
    )
  );
}

function PlantDetail({ plant, onBack, onWater, onEdit, onDelete }) {
  const intervalLabel = WATER_INTERVALS.find(w => w.days === plant.waterInterval)?.label || `Every ${plant.waterInterval} days`;

  return React.createElement('div', null,
    React.createElement('button', { className: 'back-btn', onClick: onBack },
      '‹ All Plants'
    ),
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
          plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'
        )
      ),
      React.createElement('div', { className: 'info-row' },
        React.createElement('span', { className: 'info-row-label' }, 'Added'),
        React.createElement('span', { className: 'info-row-value' },
          new Date(plant.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  const [plants, setPlants] = useState(loadPlants);
  const [tab, setTab] = useState('today');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  useEffect(() => { savePlants(plants); }, [plants]);

  // Check for due plants on load and daily
  useEffect(() => {
    if (notifGranted) scheduleNotifications(plants);
    const interval = setInterval(() => {
      if (notifGranted) scheduleNotifications(plants);
    }, 3600000); // hourly check
    return () => clearInterval(interval);
  }, [plants, notifGranted]);

  function handleWater(id) {
    setPlants(prev => prev.map(p =>
      p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p
    ));
  }

  function handleAdd(data) {
    if (editingPlant) {
      setPlants(prev => prev.map(p => p.id === editingPlant.id ? { ...p, ...data } : p));
      setEditingPlant(null);
    } else {
      setPlants(prev => [...prev, { id: uid(), createdAt: new Date().toISOString(), lastWatered: null, ...data }]);
    }
    setShowAdd(false);
  }

  function handleDelete(id) {
    setPlants(prev => prev.filter(p => p.id !== id));
    setSelectedId(null);
  }

  async function handleEnableNotifs() {
    const granted = await requestNotifPermission();
    setNotifGranted(granted);
    if (granted) scheduleNotifications(plants);
  }

  const selectedPlant = plants.find(p => p.id === selectedId);

  // Sorted lists
  const duePlants = plants.filter(p => waterStatus(p) !== 'ok')
    .sort((a, b) => daysSince(a.lastWatered) - daysSince(b.lastWatered));
  const allPlants = [...plants].sort((a, b) => a.name.localeCompare(b.name));

  const dueCount = plants.filter(p => waterStatus(p) === 'due').length;
  const todayCount = plants.filter(p => waterStatus(p) === 'today').length;

  // ── Detail view ──
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
      (showAdd || editingPlant) && React.createElement(AddPlantModal, {
        onClose: () => { setShowAdd(false); setEditingPlant(null); },
        onSave: handleAdd,
        editPlant: editingPlant
      })
    );
  }

  // ── Main view ──
  return React.createElement('div', { className: 'app-shell' },
    React.createElement('div', { className: 'header' },
      React.createElement('div', { className: 'header-logo' },
        React.createElement(Logo),
        React.createElement('span', { className: 'header-logo-wordmark' }, 'rooted')
      ),
      React.createElement('p', null, new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    ),

    React.createElement('div', { className: 'tab-bar' },
      React.createElement('button', { className: `tab-btn ${tab === 'today' ? 'active' : ''}`, onClick: () => setTab('today') }, 'Today'),
      React.createElement('button', { className: `tab-btn ${tab === 'all' ? 'active' : ''}`, onClick: () => setTab('all') }, `All (${plants.length})`)
    ),

    React.createElement('div', { className: 'content' },

      // Notification prompt
      !notifGranted && plants.length > 0 && React.createElement('div', {
        className: 'notif-banner',
        onClick: handleEnableNotifs,
        style: { cursor: 'pointer' }
      }, '🔔', ' Enable notifications to get watering reminders'),

      tab === 'today' && React.createElement('div', null,
        // Summary card
        plants.length > 0 && React.createElement('div', { className: 'summary-card' },
          React.createElement('h2', null, dueCount + todayCount > 0 ? `${dueCount + todayCount} plant${dueCount + todayCount !== 1 ? 's' : ''} need water` : 'All plants are happy 🌿'),
          React.createElement('p', null, dueCount + todayCount > 0 ? 'Tap 💧 to mark as watered' : 'Check back tomorrow'),
          plants.length > 0 && React.createElement('div', { className: 'summary-stats' },
            React.createElement('div', { className: 'stat' },
              React.createElement('div', { className: 'stat-num' }, plants.length),
              React.createElement('div', { className: 'stat-label' }, 'Total')
            ),
            React.createElement('div', { className: 'stat' },
              React.createElement('div', { className: 'stat-num' }, dueCount),
              React.createElement('div', { className: 'stat-label' }, 'Overdue')
            ),
            React.createElement('div', { className: 'stat' },
              React.createElement('div', { className: 'stat-num' }, todayCount),
              React.createElement('div', { className: 'stat-label' }, 'Due soon')
            )
          )
        ),

        duePlants.length > 0
          ? React.createElement('div', null,
              React.createElement('div', { className: 'section-label' }, 'Needs water'),
              duePlants.map(p => React.createElement(PlantCard, { key: p.id, plant: p, onWater: handleWater, onClick: () => setSelectedId(p.id) }))
            )
          : plants.length > 0
            ? React.createElement('div', { className: 'empty-state' },
                React.createElement('div', { className: 'empty-icon' }, '✅'),
                React.createElement('h3', null, 'All watered'),
                React.createElement('p', null, 'Nothing needs water right now. Check back later.')
              )
            : React.createElement('div', { className: 'empty-state' },
                React.createElement('div', { className: 'empty-icon' }, '🪴'),
                React.createElement('h3', null, 'No plants yet'),
                React.createElement('p', null, 'Add your first plant to start tracking watering schedules.')
              )
      ),

      tab === 'all' && React.createElement('div', null,
        allPlants.length > 0
          ? allPlants.map(p => React.createElement(PlantCard, { key: p.id, plant: p, onWater: handleWater, onClick: () => setSelectedId(p.id) }))
          : React.createElement('div', { className: 'empty-state' },
              React.createElement('div', { className: 'empty-icon' }, '🪴'),
              React.createElement('h3', null, 'No plants yet'),
              React.createElement('p', null, 'Tap the button below to add your first plant.')
            )
      )
    ),

    React.createElement('button', { className: 'fab', onClick: () => setShowAdd(true) },
      '＋ Add Plant'
    ),

    showAdd && React.createElement(AddPlantModal, {
      onClose: () => { setShowAdd(false); setEditingPlant(null); },
      onSave: handleAdd,
      editPlant: editingPlant
    })
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(App));
