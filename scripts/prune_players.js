import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const src = join(__dirname, '..', 'public', 'players.json');
const out = join(__dirname, '..', 'public', 'players_pruned.json');

// Fields to keep (adjust if you need others)
const KEEP = new Set(['player_id', 'first_name', 'last_name', 'full_name', 'position', 'team', 'status', 'bye_week', 'fantasy_positions']);

function pruneObject(obj) {
  const res = {};
  for (const k of Object.keys(obj)) {
    if (KEEP.has(k)) res[k] = obj[k];
  }
  // ensure player_id exists if original key is id-like
  if (!res.player_id && (obj.id || obj.playerId)) {
    res.player_id = obj.id || obj.playerId;
  }
  return res;
}

try {
  const raw = readFileSync(src, 'utf8');
  const data = JSON.parse(raw);

  let pruned;
  if (Array.isArray(data)) {
    pruned = data.map(pruneObject);
  } else if (typeof data === 'object' && data !== null) {
    // handle map of id -> player
    const isMap = Object.values(data).every((v) => typeof v === 'object');
    if (isMap) {
      pruned = {};
      for (const [k, v] of Object.entries(data)) {
        pruned[k] = pruneObject(v);
        // keep key if player_id missing
        if (!pruned[k].player_id) pruned[k].player_id = k;
      }
    } else {
      pruned = pruneObject(data);
    }
  } else {
    throw new Error('Unexpected players.json format');
  }

  writeFileSync(out, JSON.stringify(pruned, null, 2));
  console.log('Pruned players written to', out);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
