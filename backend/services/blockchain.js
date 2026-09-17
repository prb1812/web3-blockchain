const { ethers } = require("ethers");
const { getRpcUrl, getContractAddress } = require("../config/network");

let contractABI;
try {
  contractABI = require("../contracts/PaperRegistry.json").abi;
} catch (err) {
  console.warn("⚠️  Contract ABI not found yet. Add contracts/PaperRegistry.json once Member A shares it.");
  contractABI = [];
}

function getProvider() {
  return new ethers.JsonRpcProvider(getRpcUrl());
}

function getContract() {
  const provider = getProvider();
  return new ethers.Contract(getContractAddress(), contractABI, provider);
}

async function getPaper(paperId) {
  const contract = getContract();
  return await contract.getPaper(paperId);
}

async function verifyAccess(paperId, requesterAddress) {
  const contract = getContract();

  const paper = await contract.getPaper(paperId);
  const currentBlock = await getProvider().getBlock("latest");
  const now = currentBlock.timestamp;

  const examTimestamp = Number(paper.examTimestamp);
  const isTimeOk = now >= examTimestamp;

  const isRegistered = await contract.isRegisteredCenter(requesterAddress);

  return {
    allowed: isTimeOk && isRegistered,
    reason: !isTimeOk ? "Too early" : !isRegistered ? "Not authorized" : null,
  };
}

module.exports = { getProvider, getContract, getPaper, verifyAccess };