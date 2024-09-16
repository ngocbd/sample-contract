import { ethers, hardhatArguments, upgrades } from "hardhat";
import { Address, loadData, writeAddresses } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const data = loadData(network);
  const usdc = data.addresses.usdc;
  const sequencer = data.addresses.sequencer;
  const feeCalculator = data.addresses.feeCalculator;
  const spotEngine = data.addresses.spotEngine;
  const perpEngine = data.addresses.perpEngine;

  // CLEARING HOUSE LIQ
  const ClearinghouseLiq = await ethers.getContractFactory("ClearinghouseLiq");
  const clearinghouseLiq = await ClearinghouseLiq.deploy();
  await clearinghouseLiq.deployed();
  console.log("done clearinghouseliq");
  // ========================

  // CLEARING HOUSE
  const Clearinghouse = await ethers.getContractFactory("Clearinghouse");
  const clearinghouse = await upgrades.deployProxy(
    Clearinghouse,
    [
      "0x0000000000000000000000000000000000000000", // endpoint -> 'll set later
      usdc, // quote -> USDC
      feeCalculator, // feeCalculator
      clearinghouseLiq.address, // clearinghouseLiq
    ],
    {
      initializer: "initialize",
      unsafeAllow: ["delegatecall"],
    }
  );
  await clearinghouse.deployed();
  console.log("done clearinghouse");
  // ========================

  const contracts: Address = {
    clearinghouseLiq: clearinghouseLiq.address.toString(),
    clearinghouse: clearinghouse.address.toString(),
  };

  writeAddresses(contracts, network);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
