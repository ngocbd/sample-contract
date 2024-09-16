import { ethers, hardhatArguments } from "hardhat";
import { loadData } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const data = loadData(network);
  const endpoint = data.addresses.endpoint;

  // The address of the deployed contract
  const [deployer] = await ethers.getSigners();

  const endpointContract = await ethers.getContractAt("Endpoint", endpoint);
  const tx = await endpointContract.connect(deployer).executeSlowModeTransaction();

  await tx.wait();

  console.log(`=> tx hash: ${tx.hash}`);
  // console.log("=> tx: ", tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
