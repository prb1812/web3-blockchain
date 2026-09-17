const { expect } = require("chai");
const { ethers } = require("hardhat");

async function chainNow() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

describe("PaperRegistry", function () {
  let registry, admin, board, center, other;

  beforeEach(async function () {
    [admin, board, center, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PaperRegistry", admin);
    registry = await Factory.deploy(board.address);
    await registry.waitForDeployment();
  });

  it("allows Exam Board to upload a paper", async function () {
    const futureTime = (await chainNow()) + 3600;
    await expect(
      registry.connect(board).uploadPaper("cid123", "hash123", futureTime, "Math")
    ).to.emit(registry, "PaperUploaded");
  });

  it("rejects upload from a non-Board address", async function () {
    const futureTime = (await chainNow()) + 3600;
    await expect(
      registry.connect(other).uploadPaper("cid123", "hash123", futureTime, "Math")
    ).to.be.revertedWith("Not authorized: not Exam Board");
  });

  it("logs a denied attempt before exam time (no revert, event still fires)", async function () {
    const futureTime = (await chainNow()) + 3600;
    await registry.connect(board).uploadPaper("cid123", "hash123", futureTime, "Math");
    await registry.connect(admin).registerCenter(center.address);

    await expect(registry.connect(center).requestKey(1))
      .to.emit(registry, "AccessAttempted")
      .withArgs(1, center.address, false, "Too early");
  });

  it("allows requestKey after exam time (using simulateTime)", async function () {
    const futureTime = (await chainNow()) + 3600;
    await registry.connect(board).uploadPaper("cid123", "hash123", futureTime, "Math");
    await registry.connect(admin).registerCenter(center.address);

    const past = (await chainNow()) - 10;
    await registry.connect(admin).simulateTime(1, past);

    await expect(registry.connect(center).requestKey(1))
      .to.emit(registry, "AccessAttempted")
      .withArgs(1, center.address, true, "Granted");
  });

  it("rejects requestKey from an unregistered center", async function () {
    const futureTime = (await chainNow()) + 3600;
    await registry.connect(board).uploadPaper("cid123", "hash123", futureTime, "Math");

    await expect(registry.connect(other).requestKey(1)).to.be.revertedWith(
      "Not authorized: center not registered"
    );
  });

  it("rejects registerCenter from a non-admin address", async function () {
    await expect(
      registry.connect(other).registerCenter(center.address)
    ).to.be.revertedWith("Not authorized: not admin");
  });
});