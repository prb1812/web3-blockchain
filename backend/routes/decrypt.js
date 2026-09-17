const express = require("express");
const router = express.Router();

const { fetchFromIPFS } = require("../services/ipfs");
const { decryptFile } = require("../services/encryption");
const { verifyAccess, getPaper } = require("../services/blockchain");
const { getKey } = require("../keystore/keystore");

router.post("/", async (req, res) => {
  try {
    const { paperId, requesterAddress } = req.body;

    if (!paperId || !requesterAddress) {
      return res.status(400).json({
        success: false,
        error: "paperId and requesterAddress are required",
      });
    }

    const { allowed, reason } = await verifyAccess(paperId, requesterAddress);
    if (!allowed) {
      return res.status(403).json({ success: false, error: reason || "Access denied" });
    }

    const paper = await getPaper(paperId);
    const cid = paper.cid;
    if (!cid) {
      return res.status(404).json({ success: false, error: "Paper not found" });
    }

    const encryptedData = await fetchFromIPFS(cid);

    const key = getKey(cid);
    if (!key) {
      return res.status(500).json({ success: false, error: "Decryption key not found" });
    }
    const decryptedBuffer = decryptFile(encryptedData, key);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment; filename=decrypted-paper.pdf");
    return res.send(decryptedBuffer);
  } catch (err) {
    console.error("Decrypt error:", err.message);
    return res.status(500).json({ success: false, error: "Decryption failed" });
  }
});

module.exports = router;