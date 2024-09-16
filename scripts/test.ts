import { ethers, hardhatArguments } from "hardhat";
import { loadData } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const data = loadData(network);
  const endpoint = data.addresses.endpoint;
  const spotEngine = data.addresses.spotEngine;

  // The address of the deployed contract
  const [deployer] = await ethers.getSigners();

  // const endpointContract = await ethers.getContractAt("Endpoint", endpoint);
  // const tx = await endpointContract.connect(deployer).executeSlowModeTransaction();

  // params của hàm depositCollateral
  const subaccountName = "default"; // 12-bytes sub-account
  const productId = 0; // productId -  usdc: 0, BTC-spot: 1,

  // Chuyển đổi subaccountName thành bytes32 và sau đó lấy 12 bytes đầu tiên
  const subaccountNameBytes32 = ethers.utils.formatBytes32String(subaccountName);
  const subaccountNameBytes12 = subaccountNameBytes32.slice(0, 26);

  const spotEngineContract = await ethers.getContractAt("SpotEngine", spotEngine);
  const tx = await spotEngineContract
    .connect(deployer)
    .balances(productId, "0x482be3ec3a24ee4fec390576473dbc9dad2e6d6664656661756c740000000000");

  console.log(tx);

  console.log(await spotEngineContract.states(productId));
  // await tx.wait();

  // console.log(`=> tx hash: ${tx.hash}`);
  // console.log("=> tx: ", tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
