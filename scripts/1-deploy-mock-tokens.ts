import { ethers, hardhatArguments } from "hardhat";
import { writeAddresses, Address } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const [deployer] = await ethers.getSigners();
  console.log("deployed by:", deployer.address);

  const USDC = await ethers.getContractFactory("USDC");
  const usdc = await USDC.deploy();
  await usdc.deployed();
  console.log("done usdc");

  const BTC = await ethers.getContractFactory("BTC");
  const btc = await BTC.deploy();
  await btc.deployed();
  console.log("done btc");

  const ETH = await ethers.getContractFactory("ETH");
  const eth = await ETH.deploy();
  await eth.deployed();
  console.log("done eth");

  const tokens: Address = {
    admin: deployer.address,
    sequencer: deployer.address,
    usdc: usdc.address,
    btc: btc.address,
    eth: eth.address,
  };

  writeAddresses(tokens, network);

  console.log(">> USDC: ", usdc.address);
  console.log(">> BTC: ", btc.address);
  console.log(">> ETH: ", eth.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});