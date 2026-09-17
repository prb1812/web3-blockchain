const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  // Local Hardhat network: use the second built-in account as the Exam Board.
  // Amoy testnet: you only control one account, so set EXAM_BOARD_ADDRESS in .env instead.
  const boardAddress =
    process.env.EXAM_BOARD_ADDRESS ||
    (signers[1] ? signers[1].address : deployer.address);

  const Registry = await hre.ethers.getContractFactory("PaperRegistry");
  const registry = await Registry.deploy(boardAddress);
  await registry.waitForDeployment();

  console.log("PaperRegistry deployed to:", await registry.getAddress());
  console.log("Admin (deployer):", deployer.address);
  console.log("Exam Board:", boardAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});