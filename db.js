// db.js
// This file connects to the MySQL database using credentials from the .env file.
// We export the connection object so any file can do: const db = require('./db')

require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host:     process.env.DB_HOST,     // e.g. localhost
  user:     process.env.DB_USER,     // e.g. root
  password: process.env.DB_PASS,
  database: process.env.DB_NAME      // e.g. pcparts_db
});

db.connect(err => {
  if (err) {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1); // stop the server if DB is unreachable
  }
  console.log('Connected to MySQL database.');
});

module.exports = db;
