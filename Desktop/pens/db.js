const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // XAMPP default is empty
  database: "pension"
});

db.connect((err) => {
  if (err) {
    console.log("❌ Database connection FAILED");
    console.log(err.message);
  } else {
    console.log("✅ Database connected successfully!");
  }
});

module.exports = db;