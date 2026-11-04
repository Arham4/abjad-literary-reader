const { Database } = require('bun:sqlite');
const db = new Database('dev.db');

const plan1 = db.query("EXPLAIN QUERY PLAN SELECT * FROM token_analyses WHERE token_id = 'tok_p_story_sheikh-chilli_0_18';").all();
console.log('Query plan for token_id = ?:\n', plan1);

const plan2 = db.query("EXPLAIN QUERY PLAN SELECT * FROM token_analyses WHERE token_id IN ('tok_p_story_sheikh-chilli_0_18', 'tok_p_story_sheikh-chilli_0_19');").all();
console.log('Query plan for token_id IN (...):\n', plan2);
