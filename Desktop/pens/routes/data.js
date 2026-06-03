const express = require("express");
const router = express.Router();
const db = require("../db");

// ─────────────────────────────────────────
// GUESTS
// ─────────────────────────────────────────

// Get all active guests
router.get("/guests", (req, res) => {
  db.query("SELECT * FROM guests WHERE status = 'active'", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// Add guest
router.post("/guests", (req, res) => {
  const { name, phone, nationality, room, room_type, price, check_in, source, booked_by, email, db_registered } = req.body;
  const sql = `INSERT INTO guests (name, phone, nationality, room, room_type, price, check_in, hours, source, booked_by, email, db_registered, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'active')`;
  db.query(sql, [name, phone, nationality, room, room_type, price, check_in, source, booked_by, email || "", db_registered || false], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Guest added", id: result.insertId });
  });
});

// Update guest hours
router.put("/guests/hours", (req, res) => {
  const now = Date.now();
  db.query("SELECT id, check_in FROM guests WHERE status = 'active'", (err, guests) => {
    if (err) return res.status(500).json(err);
    guests.forEach(g => {
      const hours = +((now - g.check_in) / 3_600_000).toFixed(2);
      db.query("UPDATE guests SET hours = ? WHERE id = ?", [hours, g.id]);
    });
    res.json({ message: "Hours updated" });
  });
});

// Checkout guest (mark inactive)
router.put("/guests/checkout/:id", (req, res) => {
  db.query("UPDATE guests SET status = 'checked_out' WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Checked out" });
  });
});

// Delete guest (admin force delete)
router.delete("/guests/:id", (req, res) => {
  db.query("DELETE FROM guests WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Guest deleted" });
  });
});

// ─────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────

router.get("/payments", (req, res) => {
  db.query("SELECT * FROM payments ORDER BY paid_at DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/payments", (req, res) => {
  const { name, room, room_type, price, paid_at, source, booked_by } = req.body;
  const sql = "INSERT INTO payments (name, room, room_type, price, paid_at, source, booked_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [name, room, room_type, price, paid_at, source || "reception", booked_by || "reception"], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Payment saved", id: result.insertId });
  });
});

router.delete("/payments/:id", (req, res) => {
  db.query("DELETE FROM payments WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Payment deleted" });
  });
});

// ─────────────────────────────────────────
// HOUSEKEEPING
// ─────────────────────────────────────────

router.get("/housekeeping", (req, res) => {
  db.query("SELECT * FROM housekeeping", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/housekeeping", (req, res) => {
  const { room, room_type, guest_name, checked_out_at, status } = req.body;
  // Remove existing entry for same room first
  db.query("DELETE FROM housekeeping WHERE room = ?", [room], (err) => {
    if (err) return res.status(500).json(err);
    const sql = "INSERT INTO housekeeping (room, room_type, guest_name, checked_out_at, status) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [room, room_type, guest_name, checked_out_at, status || "needs_cleaning"], (err2, result) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Housekeeping entry added", id: result.insertId });
    });
  });
});

router.put("/housekeeping/:room", (req, res) => {
  const { status } = req.body;
  if (status === "remove") {
    db.query("DELETE FROM housekeeping WHERE room = ?", [req.params.room], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Removed" });
    });
  } else {
    db.query("UPDATE housekeeping SET status = ? WHERE room = ?", [status, req.params.room], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Status updated" });
    });
  }
});

// ─────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────

router.get("/messages", (req, res) => {
  db.query("SELECT * FROM messages ORDER BY sent_at ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/messages", (req, res) => {
  const { msg_id, from_name, to_name, room, text, sent_at, is_reply } = req.body;
  const sql = "INSERT INTO messages (msg_id, from_name, to_name, room, text, sent_at, is_reply) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [msg_id || Date.now(), from_name, to_name || null, room, text, sent_at, is_reply || false], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Message saved", id: result.insertId });
  });
});

router.put("/messages/read/:from_name", (req, res) => {
  db.query("UPDATE messages SET read_by_receptionist = TRUE WHERE from_name = ? AND is_reply = FALSE", [req.params.from_name], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Marked as read" });
  });
});

router.put("/messages/read-by-user/:to_name", (req, res) => {
  db.query("UPDATE messages SET read_by_user = TRUE WHERE to_name = ? AND is_reply = TRUE", [req.params.to_name], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Marked as read by user" });
  });
});

// ─────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────

router.get("/announcements", (req, res) => {
  db.query("SELECT * FROM announcements ORDER BY sent_at DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/announcements", (req, res) => {
  const { text, sent_at } = req.body;
  const sql = "INSERT INTO announcements (text, sent_at) VALUES (?, ?)";
  db.query(sql, [text, sent_at || Date.now()], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Announcement saved", id: result.insertId });
  });
});

router.put("/announcements/:id", (req, res) => {
  const { text } = req.body;
  db.query("UPDATE announcements SET text = ?, sent_at = ? WHERE id = ?", [text, Date.now(), req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Updated" });
  });
});

router.delete("/announcements/:id", (req, res) => {
  db.query("DELETE FROM announcements WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
});

module.exports = router;