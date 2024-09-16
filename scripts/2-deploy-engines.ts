import { ethers, hardhatArguments } from "hardhat";
import { Address, writeAddresses } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  // FEE CALCULATOR
  const FeeCalculator = await ethers.getContractFactory("FeeCalculator");
  const feeCalculator = await FeeCalculator.deploy();
  await feeCalculator.deployed();
  console.log("done feeCal");
  // ========================

  //  SPOT ENGINE
  const SpotEngine = await ethers.getContractFactory("SpotEngine");
  const spotEngine = await SpotEngine.deploy();
  await spotEngine.deployed();
  console.log("done spotengine");

  // PERP ENGINE
  const PerpEngine = await ethers.getContractFactory("PerpEngine");
  const perpEngine = await PerpEngine.deploy();
  await perpEngine.deployed();
  console.log("done perp");

  const contracts: Address = {
    feeCalculator: feeCalculator.address.toString(),
    spotEngine: spotEngine.address.toString(),
    perpEngine: perpEngine.address.toString(),
  };

  writeAddresses(contracts, network);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
