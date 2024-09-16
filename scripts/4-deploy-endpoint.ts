import { ethers, hardhatArguments, upgrades } from "hardhat";
import { Address, loadData, writeAddresses } from "./printer";
import { Endpoint } from "../typechain-types";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const [deployer] = await ethers.getSigners();

  const data = loadData(network);

  const sequencer = data.addresses.sequencer;
  const clearinghouse = data.addresses.clearinghouse;
  const spotEngine = data.addresses.spotEngine;
  const perpEngine = data.addresses.perpEngine;
  const sanctionsList = data.addresses.sanctionsList;

  // ENDPOINT
  const Endpoint = await ethers.getContractFactory("Endpoint");
  const endpoint = (await upgrades.deployProxy(Endpoint, [], { initializer: false })) as Endpoint;
  await endpoint.deployed();
  console.log("done endpoint");

  // set endpoint, add engines for clearing house
  console.log("clearinghoust set endpoint");
  const clearinghouseContract = await ethers.getContractAt("Clearinghouse", clearinghouse);
  await (await clearinghouseContract.connect(deployer).setEndpoint(endpoint.address)).wait();

  // SPOT = 0, PERP = 1
  // only run 1 times
  await (await clearinghouseContract.addEngine(spotEngine, 0)).wait();
  await (await clearinghouseContract.addEngine(perpEngine, 1)).wait();

  console.log("endpoint initialize");
  await endpoint.initialize(
    sanctionsList, // sanactions address ??
    sequencer, // sequencer address,
    clearinghouse, // clearinghouse address
    72000, // slowModeTimeout - if place order with Central-Limit OrderBook (CLOB) failed -> swap through AMM
    0, // time {perpTime, spotTime}??
    [
      ethers.BigNumber.from("52000000000000000000000"),
      ethers.BigNumber.from("52000000000000000000000"),
      ethers.BigNumber.from("2700000000000000000000"),
      ethers.BigNumber.from("2700000000000000000000"),
    ] // price[a-spot, a-perp, b-spot, b-perp, ...] -> healthGroup[a-spot, a-prep]
  );


  const contracts: Address = {
    endpoint: endpoint.address.toString(),
  };

  writeAddresses(contracts, network);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
