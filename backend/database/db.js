const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Use PostgreSQL if DATABASE_URL is set (production), otherwise SQLite (local dev)
const usePostgres = process.env.DATABASE_URL;

// Unified database interface that works with both SQLite and PostgreSQL
class DatabaseWrapper {
  constructor(sqliteDb, pgPool) {
    this.sqlite = sqliteDb;
    this.pg = pgPool;
    this.isPostgres = !!pgPool;
  }

  // Run a statement and return lastID/changes via callback
  run(sql, params = [], callback) {
    if (this.isPostgres) {
      this.pg.query(sql, params, (err, result) => {
        if (callback) {
          callback(err, {
            lastID: result.rows.length > 0 ? result.rows[0].id || result.rows[0].userId || result.rows[0].patientId || result.rows[0].caretakerId || result.rows[0].gameResultId : null,
            changes: result.rowCount,
            rowCount: result.rowCount
          });
        }
      });
    } else {
      this.sqlite.run(sql, params, function(err) {
        if (callback) callback(err, { lastID: this.lastID, changes: this.changes });
      });
    }
  }

  // Get a single row
  get(sql, params = [], callback) {
    if (this.isPostgres) {
      this.pg.query(sql, params, (err, result) => {
        if (callback) callback(err, result.rows && result.rows.length > 0 ? result.rows[0] : null);
      });
    } else {
      this.sqlite.get(sql, params, (err, row) => {
        if (callback) callback(err, row);
      });
    }
  }

  // Get all rows
  all(sql, params = [], callback) {
    if (this.isPostgres) {
      this.pg.query(sql, params, (err, result) => {
        if (callback) callback(err, result.rows || []);
      });
    } else {
      this.sqlite.all(sql, params, (err, rows) => {
        if (callback) callback(err, rows);
      });
    }
  }

  // Serialize - for SQLite transactions, no-op for Postgres (use explicit BEGIN/COMMIT)
  serialize(fn) {
    if (this.isPostgres) {
      fn();
    } else {
      this.sqlite.serialize(fn);
    }
  }

  // Query with rows directly
  query(sql, params = [], callback) {
    if (this.isPostgres) {
      this.pg.query(sql, params, (err, result) => {
        if (callback) callback(err, result);
      });
    } else {
      this.sqlite.run(sql, params, callback);
    }
  }
}

let db;

if (usePostgres) {
  // PostgreSQL mode
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('patient', 'caretaker')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      preferred_language TEXT,
      emergency_contact TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS caretakers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      phone TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patient_caretakers (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      caretaker_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (caretaker_id) REFERENCES caretakers(id) ON DELETE CASCADE,
      UNIQUE(patient_id, caretaker_id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      cognitive_area TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_results (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      score INTEGER,
      accuracy REAL,
      correct_answers INTEGER,
      wrong_answers INTEGER,
      attempts INTEGER,
      completion_time INTEGER,
      average_reaction_time REAL,
      hints_used INTEGER,
      audio_used BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      analysis TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medical_reports (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER,
      data BYTEA,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `;

  pool.query(schema, (err) => {
    if (err) console.error('DB init error:', err.message);
    else console.log('PostgreSQL database tables verified.');
  });

  db = new DatabaseWrapper(null, pool);
} else {
  // SQLite mode (local development)
  const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'cognitive_gaming.db');

  function initDatabase() {
    const sqliteDb = new sqlite3.Database(dbPath);
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('patient', 'caretaker')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        age INTEGER,
        gender TEXT,
        preferred_language TEXT,
        emergency_contact TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS caretakers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS patient_caretakers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        caretaker_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (caretaker_id) REFERENCES caretakers(id) ON DELETE CASCADE,
        UNIQUE(patient_id, caretaker_id)
      );

      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        cognitive_area TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        score INTEGER,
        accuracy REAL,
        correct_answers INTEGER,
        wrong_answers INTEGER,
        attempts INTEGER,
        completion_time INTEGER,
        average_reaction_time REAL,
        hints_used INTEGER,
        audio_used BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ai_analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        analysis TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS medical_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER,
        data BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `;
    sqliteDb.exec(schema, (err) => {
      if (err) console.error('DB init error:', err.message);
      else console.log('SQLite database tables verified.');
    });
    return sqliteDb;
  }

  const sqliteDb = initDatabase();
  db = new DatabaseWrapper(sqliteDb, null);
}

module.exports = db;