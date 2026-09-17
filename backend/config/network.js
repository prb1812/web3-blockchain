const NETWORK = process.env.NETWORK || "local";

const RPC_URLS = {
  local: process.env.RPC_URL_LOCAL || "http://127.0.0.1:8545",
  amoy: process.env.RPC_URL_AMOY || "",
};

const CONTRACT_ADDRESSES = {
  local: process.env.CONTRACT_ADDRESS_LOCAL || "",
  amoy: process.env.CONTRACT_ADDRESS_AMOY || "",
};

function getRpcUrl() {
  return RPC_URLS[NETWORK];
}

function getContractAddress() {
  return CONTRACT_ADDRESSES[NETWORK];
}

function getCurrentNetwork() {
  return NETWORK;
}

module.exports = { getRpcUrl, getContractAddress, getCurrentNetwork };