const { Database } = require('bun:sqlite');
const sqlite = new Database('dev.db');
const rows = sqlite.query("SELECT t.id, t.surface_form, t.normalized_form, a.vocalized_form, a.phonetic_breakdown_json, a.spoken_urdu_synonyms_json, a.english_contextual_gloss FROM tokens t LEFT JOIN token_analyses a ON t.id = a.token_id WHERE t.normalized_form LIKE '%انوکھ%' LIMIT 5;").all();
console.log(JSON.stringify(rows, null, 2));
