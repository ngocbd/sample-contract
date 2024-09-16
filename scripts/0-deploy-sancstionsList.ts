import { ethers, hardhatArguments } from "hardhat";
import { writeAddresses, Address } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const SanctionsList = await ethers.getContractFactory("SanctionsList");
  const sanctionsList = await SanctionsList.deploy();
  await sanctionsList.deployed();
  console.log("done sanctionsList", sanctionsList.deployTransaction.hash);

  const addresses: Address = {
    sanctionsList: sanctionsList.address,
  };

  writeAddresses(addresses, network);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
