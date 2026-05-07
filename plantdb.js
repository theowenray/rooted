// Common houseplant database with care info
const PLANT_DB = [
  { name: 'Pothos', emoji: '🌿', category: 'Houseplant', water_interval: 7, light: 'Low to bright indirect', notes: 'Very forgiving and hard to kill. Tolerates low light well. Let soil dry out between waterings. Toxic to pets.' },
  { name: 'Monstera', emoji: '🌿', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Loves humidity. Water when top 2 inches of soil are dry. Wipe leaves occasionally. Toxic to pets.' },
  { name: 'Snake Plant', emoji: '🌵', category: 'Houseplant', water_interval: 14, light: 'Low to bright indirect', notes: 'Extremely drought tolerant. Water every 2-4 weeks. One of the easiest plants to care for. Toxic to pets.' },
  { name: 'Peace Lily', emoji: '🌸', category: 'Houseplant', water_interval: 7, light: 'Low to medium indirect', notes: 'Will droop when thirsty — a good indicator. Loves humidity. Keep away from cold drafts. Toxic to pets.' },
  { name: 'Spider Plant', emoji: '🌿', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Very adaptable. Water when soil is dry. Produces baby plants on long runners. Safe for pets.' },
  { name: 'ZZ Plant', emoji: '🌿', category: 'Houseplant', water_interval: 14, light: 'Low to bright indirect', notes: 'Extremely drought tolerant due to rhizomes. Water every 2-3 weeks. Great for beginners. Toxic to pets.' },
  { name: 'Fiddle Leaf Fig', emoji: '🌴', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Sensitive to drafts and overwatering. Water when top inch is dry. Avoid moving it around too much.' },
  { name: 'Rubber Plant', emoji: '🌿', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Wipe leaves to keep them shiny. Water when top soil is dry. Tolerates some neglect.' },
  { name: 'Aloe Vera', emoji: '🌵', category: 'Succulent', water_interval: 14, light: 'Bright direct or indirect', notes: 'Water deeply but infrequently. Let soil dry completely between waterings. Great for burns and skin.' },
  { name: 'Succulent', emoji: '🌵', category: 'Succulent', water_interval: 14, light: 'Bright direct', notes: 'Water thoroughly then let dry completely. Needs well-draining soil. Too much water is the #1 killer.' },
  { name: 'Cactus', emoji: '🌵', category: 'Succulent', water_interval: 30, light: 'Bright direct', notes: 'Water sparingly — once a month in winter, every 2 weeks in summer. Needs full sun and well-draining soil.' },
  { name: 'Basil', emoji: '🌿', category: 'Herb', water_interval: 2, light: 'Bright direct', notes: 'Keep soil moist but not soggy. Pinch off flowers to keep producing leaves. Loves warmth and sun.' },
  { name: 'Mint', emoji: '🌿', category: 'Herb', water_interval: 2, light: 'Bright indirect', notes: 'Keep soil consistently moist. Grows aggressively — best kept in its own pot. Harvest regularly.' },
  { name: 'Rosemary', emoji: '🌿', category: 'Herb', water_interval: 7, light: 'Bright direct', notes: 'Drought tolerant once established. Let soil dry between waterings. Needs good airflow.' },
  { name: 'Lavender', emoji: '🌸', category: 'Herb', water_interval: 7, light: 'Bright direct', notes: 'Drought tolerant. Water when soil is dry. Needs excellent drainage. Prune after flowering.' },
  { name: 'Orchid', emoji: '🌺', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Water by soaking roots then letting dry. Never let sit in water. Loves humidity and indirect light.' },
  { name: 'Bird of Paradise', emoji: '🌺', category: 'Houseplant', water_interval: 7, light: 'Bright direct or indirect', notes: 'Water when top 2 inches are dry. Loves humidity. Wipe leaves. Needs space to grow.' },
  { name: 'Philodendron', emoji: '🌿', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Water when top inch of soil is dry. Very adaptable. Toxic to pets.' },
  { name: 'Calathea', emoji: '🌿', category: 'Houseplant', water_interval: 5, light: 'Medium indirect', notes: 'Sensitive to tap water — use filtered or rainwater. Keep soil moist. Loves humidity. Non-toxic.' },
  { name: 'Fern', emoji: '🍀', category: 'Houseplant', water_interval: 3, light: 'Medium indirect', notes: 'Keep soil consistently moist. Loves humidity — mist regularly or use a pebble tray. Non-toxic.' },
  { name: 'Jade Plant', emoji: '🌿', category: 'Succulent', water_interval: 14, light: 'Bright direct', notes: 'Water when soil is completely dry. Can live for decades. Toxic to pets.' },
  { name: 'Dracaena', emoji: '🌴', category: 'Houseplant', water_interval: 10, light: 'Low to bright indirect', notes: 'Water when top half of soil is dry. Sensitive to fluoride — use filtered water. Toxic to pets.' },
  { name: 'Hoya', emoji: '🌸', category: 'Houseplant', water_interval: 10, light: 'Bright indirect', notes: 'Let soil dry between waterings. Blooms with bright light. Very low maintenance.' },
  { name: 'String of Pearls', emoji: '🌿', category: 'Succulent', water_interval: 14, light: 'Bright indirect', notes: 'Water sparingly — overwatering is fatal. Needs well-draining soil. Beautiful trailing plant.' },
  { name: 'Bamboo', emoji: '🌿', category: 'Houseplant', water_interval: 7, light: 'Bright indirect', notes: 'Can grow in water or soil. Change water every 2 weeks if water-grown. Avoid direct sun.' },
  { name: 'Bonsai', emoji: '🌲', category: 'Tree', water_interval: 2, light: 'Bright direct', notes: 'Water when top soil feels dry. Needs regular pruning and shaping. Requires patience and attention.' },
  { name: 'Grass', emoji: '🌾', category: 'Lawn', water_interval: 3, light: 'Full sun', notes: 'Water deeply and infrequently to encourage deep roots. Mow at proper height for your grass type.' },
  { name: 'Tomato', emoji: '🌱', category: 'Garden', water_interval: 2, light: 'Full sun', notes: 'Water consistently to prevent blossom end rot. Needs at least 6 hours of sun. Stake or cage for support.' },
  { name: 'Sunflower', emoji: '🌻', category: 'Garden', water_interval: 3, light: 'Full sun', notes: 'Water at the base, not the leaves. Drought tolerant once established. Follows the sun when young.' },
  { name: 'Rose', emoji: '🌹', category: 'Garden', water_interval: 3, light: 'Full sun', notes: 'Water at base to prevent disease. Deadhead spent blooms. Fertilize regularly during growing season.' },
];

// Fuzzy search — returns matches sorted by relevance
function searchPlants(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return PLANT_DB
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 6);
}
