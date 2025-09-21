// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('chatbot.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT 'New Chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("Error creating session table:", err);
    else console.log("Session table ready");
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS conversation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      sender TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES session(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error("Error creating conversation table:", err);
    else console.log("Conversation table ready");
  });

  db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err) console.error("Error enabling foreign keys:", err);
    else console.log("Foreign keys enabled");
  });
});

module.exports = db;