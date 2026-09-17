const axios = require("axios");
const FormData = require("form-data");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

async function uploadToIPFS(encryptedData, filename = "encrypted-paper.txt") {
  const formData = new FormData();
  const buffer = Buffer.from(encryptedData, "utf-8");
  formData.append("file", buffer, filename);

  const response = await axios.post(PINATA_PIN_URL, formData, {
    maxBodyLength: Infinity,
    headers: {
      ...formData.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_API_KEY,
    },
  });

  return response.data.IpfsHash;
}

async function fetchFromIPFS(cid) {
  const url = `${PINATA_GATEWAY}/${cid}`;
  const response = await axios.get(url, { responseType: "text" });
  return response.data;
}

module.exports = { uploadToIPFS, fetchFromIPFS };