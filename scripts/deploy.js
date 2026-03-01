const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const EGovernanceVoting = await ethers.getContractFactory("EGovernanceVoting");
  const voting = await EGovernanceVoting.deploy();
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("EGovernanceVoting deployed to:", votingAddress);

  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const land = await LandRegistry.deploy();
  await land.waitForDeployment();
  const landAddress = await land.getAddress();
  console.log("LandRegistry      deployed to:", landAddress);

  const PublicFundTracking = await ethers.getContractFactory("PublicFundTracking");
  const funds = await PublicFundTracking.deploy();
  await funds.waitForDeployment();
  const fundAddress = await funds.getAddress();
  console.log("PublicFundTracking deployed to:", fundAddress);

  console.log("\n──────────────────────────────────────────");
  console.log("All contracts deployed successfully!");
  console.log("Update the CONTRACT_ADDRESS constants in your frontend JS files and backend .env.");
  console.log("──────────────────────────────────────────");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
