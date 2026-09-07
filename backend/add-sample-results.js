const db = require('./database/db');

// Find the first patient ID
db.get(`SELECT id FROM patients LIMIT 1`, (err, patient) => {
  if (err) {
    console.error('Error fetching patient:', err.message);
    process.exit(1);
  }
  if (!patient) {
    console.log('No patient found. Please create a patient first.');
    process.exit(0);
  }

  const patientId = patient.id;
  console.log(`Adding sample results for patient ID ${patientId}...`);

  // Sample results for 6 games, levels 1-3, with random scores
  const sampleData = [
    { game_id: 1, level: 1, score: 75, accuracy: 80, correct_answers: 8, wrong_answers: 2, attempts: 10, completion_time: 120 },
    { game_id: 1, level: 2, score: 85, accuracy: 90, correct_answers: 9, wrong_answers: 1, attempts: 10, completion_time: 100 },
    { game_id: 2, level: 1, score: 60, accuracy: 65, correct_answers: 5, wrong_answers: 3, attempts: 8, completion_time: 90 },
    { game_id: 3, level: 1, score: 90, accuracy: 95, correct_answers: 9, wrong_answers: 1, attempts: 10, completion_time: 80 },
    { game_id: 4, level: 2, score: 70, accuracy: 72, correct_answers: 6, wrong_answers: 2, attempts: 8, completion_time: 110 },
    { game_id: 5, level: 1, score: 80, accuracy: 85, correct_answers: 7, wrong_answers: 1, attempts: 8, completion_time: 95 },
    { game_id: 6, level: 2, score: 65, accuracy: 68, correct_answers: 5, wrong_answers: 3, attempts: 8, completion_time: 130 }
  ];

  let inserted = 0;
  sampleData.forEach((data) => {
    db.run(
      `INSERT INTO game_results 
       (patient_id, game_id, level, score, accuracy, correct_answers, wrong_answers, attempts, completion_time, hints_used, audio_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        data.game_id,
        data.level,
        data.score,
        data.accuracy,
        data.correct_answers,
        data.wrong_answers,
        data.attempts,
        data.completion_time,
        0, // hints_used
        0  // audio_used
      ],
      function(err) {
        if (err) {
          console.error('Error inserting sample:', err.message);
        } else {
          inserted++;
          console.log(`Inserted result for game ${data.game_id}, level ${data.level}`);
        }
      }
    );
  });

  // Wait a moment then show summary
  setTimeout(() => {
    console.log(`✅ Added ${inserted} sample results for patient ID ${patientId}`);
    console.log('Now refresh your patient detail page to see the data!');
    process.exit(0);
  }, 1000);
});