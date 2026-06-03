const express = require("express");
const cors = require("cors");
if (process.env.NODE_ENV !== "production") require("dotenv").config();
const db = require("./db");

const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

app.get("/", (req, res) => {
  res.send("Pension backend is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});