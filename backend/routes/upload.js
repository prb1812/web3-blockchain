const express = require("express");
const multer = require("multer");
const router = express.Router();

const { encryptFile } = require("../services/encryption");
const { uploadToIPFS } = require("../services/ipfs");
const { saveKey } = require("../keystore/keystore");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { examTimestamp, subject } = req.body;
    if (!examTimestamp || !subject) {
      return res.status(400).json({
        success: false,
        error: "examTimestamp and subject are required",
      });
    }

    const { encryptedData, key, fileHash } = encryptFile(req.file.buffer);
    const cid = await uploadToIPFS(encryptedData, req.file.originalname);
    saveKey(cid, key);

    return res.json({
      success: true,
      data: { cid, fileHash, examTimestamp, subject },
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    return res.status(500).json({ success: false, error: "IPFS or encryption failure" });
  }
});

module.exports = router;