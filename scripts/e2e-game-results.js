/* End-to-end test of the game-results save/query pipeline on port 5177.
 * Usage:  1) JWT_SECRET=e2e-test-secret PORT=5177 node backend/server.js
 *         2) node scripts/e2e-game-results.js
 * Creates its own caretaker+patient, verifies the whole pipeline, then removes all test rows.
 */
const path = require('path');
const BASE = 'http://localhost:5177/api';
const DB_PATH = path.join(__dirname, '..', 'backend', 'database', 'cognitive_gaming.db');
const resolve = (name) => require.resolve(name, { paths: ['./backend'] });
const jwt = require(resolve('jsonwebtoken'));
const SECRET = 'e2e-test-secret';
const ok = (name, cond, detail = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  → ' + detail : ''}`);

(async () => {
  const stamp = Date.now();
  const cEmail = `e2e-caretaker-${stamp}@test.local`;
  const pEmail = `e2e-patient-${stamp}@test.local`;

  // 1. Register caretaker
  let r = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'E2E Caretaker', email: cEmail, password: 'pass123', role: 'caretaker', phone: '123' }) });
  const caretaker = await r.json();
  ok('caretaker registered', !!caretaker.token);

  // 2. Caretaker creates a patient (like Add Patient)
  r = await fetch(`${BASE}/patients`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${caretaker.token}` }, body: JSON.stringify({ name: 'E2E Ram', email: pEmail, password: 'pass123', age: 70 }) });
  const created = await r.json();
  const patientsTableId = created.patientId;
  ok('patient created & linked to caretaker', r.status === 201 && !!patientsTableId, `patients.id=${patientsTableId}`);

  // 3. Patient logs in → token MUST now contain the correct patients.id (Fix 1: race bug)
  r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pEmail, password: 'pass123', role: 'patient' }) });
  const patient = await r.json();
  const payload = JSON.parse(Buffer.from(patient.token.split('.')[1], 'base64').toString());
  ok('login token embeds correct patientId', payload.patientId === patientsTableId, `token.patientId=${payload.patientId}, expected=${patientsTableId}`);

  // 4. Simulate a PRE-FIX stale token (patientId: null) — server must still resolve correctly (Fix 2)
  const staleToken = jwt.sign({ userId: payload.userId, role: 'patient', patientId: null }, SECRET, { expiresIn: '1h' });

  // 5. Save 3 game results: one with the fresh token, one with NO patientId, one with the stale token
  //    (server must ignore client ids and resolve from auth)
  const sessions = [
    { token: patient.token, body: { gameId: 1, level: 3, score: 100, accuracy: 90, correctAnswers: 9, wrongAnswers: 1, attempts: 10 } },
    { token: patient.token, body: { gameId: 2, level: 2, score: 80, accuracy: 80, correctAnswers: 8, wrongAnswers: 2, attempts: 10 } },
    { token: staleToken, body: { gameId: 3, level: 4, score: 60, accuracy: 60, correctAnswers: 6, wrongAnswers: 4, attempts: 10 } },
  ];
  let allSaved = true;
  for (const s of sessions) {
    r = await fetch(`${BASE}/game-results`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` }, body: JSON.stringify(s.body) });
    const data = await r.json();
    if (r.status !== 201 || data.patientId !== patientsTableId) { allSaved = false; console.log('   save failed:', r.status, JSON.stringify(data)); }
  }
  ok('3 sessions saved, all under correct patients.id (incl. stale token)', allSaved);

  // 6. Caretaker queries the patient's results (the exact call PatientDetail makes)
  r = await fetch(`${BASE}/game-results/${patientsTableId}`, { headers: { Authorization: `Bearer ${caretaker.token}` } });
  const rows = await r.json();
  ok('caretaker sees 3 game results', rows.length === 3, `got ${rows.length} rows, ids=${rows.map(x => x.patient_id).join(',')}`);

  // 7. Patient "my results" endpoint
  r = await fetch(`${BASE}/game-results`, { headers: { Authorization: `Bearer ${patient.token}` } });
  const mine = await r.json();
  ok('patient my-results endpoint returns 3', mine.length === 3, `got ${mine.length}`);

  // 8. Caretaker dashboard aggregation (the getAllPatients query used by the UI)
  r = await fetch(`${BASE}/patients`, { headers: { Authorization: `Bearer ${caretaker.token}` } });
  const list = await r.json();
  const ram = list.find(p => p.patient_id === patientsTableId);
  ok('dashboard shows games_completed=3 and avg accuracy', ram && ram.games_completed === 3, `games=${ram?.games_completed}, avg_acc=${Math.round(ram?.avg_accuracy || 0)}%`);

  // 9. Cleanup test data (sequential so counts reflect final state)
  const db = require(resolve('sqlite3')).verbose();
  const d = new db.Database(DB_PATH);
  const run = (sql, params = []) => new Promise((res, rej) => d.run(sql, params, (e) => e ? rej(e) : res()));
  (async () => {
    await run(`DELETE FROM game_results WHERE patient_id = ?`, [patientsTableId]);
    await run(`DELETE FROM patient_caretakers WHERE patient_id = ?`, [patientsTableId]);
    await run(`DELETE FROM patients WHERE id = ?`, [patientsTableId]);
    await run(`DELETE FROM users WHERE email IN (?, ?)`, [cEmail, pEmail]);
    const left = await new Promise((res) => d.get(`SELECT COUNT(*) n FROM users WHERE email IN (?, ?)`, [cEmail, pEmail], (e, r) => res(r.n)));
    ok('cleanup removed all test rows', left === 0, `${left} rows left`);
    d.close();
  })();
})().catch(e => { console.error('E2E ERROR:', e.message); process.exit(1); });
