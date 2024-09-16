import { ethers, hardhatArguments, upgrades } from "hardhat";
import { loadData, writeAddresses } from "./printer";

// Each token-spot or token-perp; has a separate OffchainBook contract
async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const data = loadData(network);

  // Need update for deployed addresses (2-deploy.ts)
  const feeCalculator = data.addresses.feeCalculator;
  const clearinghouse = data.addresses.clearinghouse;
  const endpoint = data.addresses.endpoint;
  const productEngineSpot = data.addresses.spotEngine;
  const productEnginePerp = data.addresses.perpEngine;
  const admin = data.addresses.admin;

  // OffchainBook BTC-SPOT - token ID = 1
  const OffchainBook = await ethers.getContractFactory("OffchainBook");
  const offchainBook = await upgrades.deployProxy(
    OffchainBook,
    [
      clearinghouse,
      productEngineSpot,
      productEnginePerp,
      endpoint,
      admin,
      feeCalculator,
      // token
      1,
      ethers.BigNumber.from("1000000000000000"), // 0,001
      ethers.BigNumber.from("1000000000000000000"), // 1
      ethers.BigNumber.from("10000000000000000"), // 0,01
      ethers.BigNumber.from("3000000000000000"), // 0,003
    ],
    {
      // initializer: "initialize",
      initializer: false,
    }
  );
  await offchainBook.deployed();

  writeAddresses({ offchainBook: offchainBook.address }, network);

  console.log(">> OffchainBook: ", offchainBook.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// address: 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570 // BTC spot
