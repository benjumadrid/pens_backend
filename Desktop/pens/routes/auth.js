const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");


// 🔥 REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(
      sql,
      [name, email, hashedPassword, role || "user"],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "User registered successfully" });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});


// 🔥 LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    res.json({
      message: "Login success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});


// 🔥 UPDATE (SMART / PARTIAL UPDATE)
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  let fields = [];
  let values = [];

  if (name) {
    fields.push("name = ?");
    values.push(name);
  }

  if (email) {
    fields.push("email = ?");
    values.push(email);
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    fields.push("password = ?");
    values.push(hashedPassword);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No data to update" });
  }

  values.push(id);

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "User updated successfully" });
  });
});


// 🔥 DELETE
router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM users WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "User deleted successfully" });
  });
});

router.post("/reset-password-email", async (req, res) => {
  const { email, password } = req.body;

  // 1. validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    // 2. check if user exists
    const checkSql = "SELECT * FROM users WHERE email = ?";

    db.query(checkSql, [email], async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(404).json({ message: "Email not found" });
      }

      // 3. hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. update password
      const updateSql = "UPDATE users SET password = ? WHERE email = ?";

      db.query(updateSql, [hashedPassword, email], (err2) => {
        if (err2) return res.status(500).json(err2);

        return res.json({
          message: "Password updated successfully"
        });
      });
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      err
    });
  }
});

module.exports = router;