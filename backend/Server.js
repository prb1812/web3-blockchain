require("dotenv").config();
const express = require("express");
const cors = require("cors");

const uploadRoute = require("./routes/upload");
const decryptRoute = require("./routes/decrypt");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend is running" });
});

app.use("/upload", uploadRoute);
app.use("/decrypt", decryptRoute);

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});