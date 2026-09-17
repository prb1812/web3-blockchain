const fs = require("fs");
const path = require("path");
const { encryptFile, decryptFile, hashFile } = require("./services/encryption");

const SAMPLE_FILE_PATH = path.join(__dirname, "sample.pdf");

function run() {
  if (!fs.existsSync(SAMPLE_FILE_PATH)) {
    console.error(`❌ Sample file not found at ${SAMPLE_FILE_PATH}`);
    console.error("   Put any small PDF there named 'sample.pdf' and re-run.");
    process.exit(1);
  }

  const originalBuffer = fs.readFileSync(SAMPLE_FILE_PATH);
  console.log(`Original file size: ${originalBuffer.length} bytes`);

  const { encryptedData, key, fileHash } = encryptFile(originalBuffer);
  console.log(`\nEncrypted. Key (KEEP SECRET): ${key}`);
  console.log(`Original file hash: ${fileHash}`);

  const decryptedBuffer = decryptFile(encryptedData, key);
  console.log(`Decrypted file size: ${decryptedBuffer.length} bytes`);

  const identical = Buffer.compare(originalBuffer, decryptedBuffer) === 0;
  const decryptedHash = hashFile(decryptedBuffer);
  const hashesMatch = decryptedHash === fileHash;

  console.log("\n--- RESULTS ---");
  console.log(`Byte-for-byte identical: ${identical ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Hash matches original:   ${hashesMatch ? "✅ PASS" : "❌ FAIL"}`);

  if (identical && hashesMatch) {
    console.log("\n✅ Encryption round-trip integrity test PASSED.");
  } else {
    console.log("\n❌ Encryption round-trip integrity test FAILED.");
    process.exit(1);
  }
}

run();