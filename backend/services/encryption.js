const CryptoJS = require("crypto-js");
const crypto = require("crypto");

function generateKey() {
  return crypto.randomBytes(32).toString("hex"); // 256-bit key
}

function hashFile(fileBuffer) {
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return "0x" + hash;
}

function encryptFile(fileBuffer) {
  const key = generateKey();
  const fileHash = hashFile(fileBuffer);

  // Generate a random 16-byte IV (required for CBC mode)
  const iv = CryptoJS.lib.WordArray.random(16);

  const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, CryptoJS.enc.Hex.parse(key), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Store IV alongside ciphertext (IV isn't secret, just needs to be known for decryption)
  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const ciphertextHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

  // Combine as "iv:ciphertext" so decryptFile can split them back apart
  const encryptedData = ivHex + ":" + ciphertextHex;

  return {
    encryptedData,
    key,
    fileHash,
  };
}

function decryptFile(encryptedData, key) {
  const [ivHex, ciphertextHex] = encryptedData.split(":");

  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const ciphertext = CryptoJS.enc.Hex.parse(ciphertextHex);

  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, CryptoJS.enc.Hex.parse(key), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return wordArrayToBuffer(decrypted);
}

function wordArrayToBuffer(wordArray) {
  const { words, sigBytes } = wordArray;
  const buffer = Buffer.alloc(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    buffer[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return buffer;
}

module.exports = { generateKey, hashFile, encryptFile, decryptFile };