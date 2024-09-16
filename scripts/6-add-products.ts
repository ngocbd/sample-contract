import { ethers, hardhatArguments } from "hardhat";
import { loadData } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const data = loadData(network)

  const spotEngineAddress = data.addresses.spotEngine;
  const offchainBook = data.addresses.offchainBook;
  const [deployer] = await ethers.getSigners();

  const healthGroup = 0;
  // Mock data for addProduct function parameters
  const sizeIncrement = ethers.BigNumber.from("1000000000000000");
  const priceIncrementX18 = ethers.BigNumber.from("1000000000000000000");
  const minSize = ethers.BigNumber.from("10000000000000000");
  const lpSpreadX18 = ethers.BigNumber.from("3000000000000000");
  const config = {
    token: data.addresses.btc, // Replace with a token contract address
    interestInflectionUtilX18: ethers.BigNumber.from("800000000000000000"),
    interestFloorX18: ethers.BigNumber.from("10000000000000000"),
    interestSmallCapX18: ethers.BigNumber.from("40000000000000000"),
    interestLargeCapX18: ethers.BigNumber.from("1000000000000000000"),
  };
  const riskStore = {
    longWeightInitial: ethers.BigNumber.from("900000000"),
    shortWeightInitial: ethers.BigNumber.from("1100000000"),
    longWeightMaintenance: ethers.BigNumber.from("950000000"),
    shortWeightMaintenance: ethers.BigNumber.from("1050000000"),
    largePositionPenalty: ethers.BigNumber.from("0"),
  };

  const spotEngine = (await ethers.getContractAt("SpotEngine", spotEngineAddress, deployer)).connect(deployer);
  console.log(await spotEngine.owner());

  const tx = await spotEngine.addProduct(
    healthGroup,
    offchainBook,
    sizeIncrement,
    priceIncrementX18,
    minSize,
    lpSpreadX18,
    config,
    riskStore
  );

  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log(">> Transaction mined in block: ", receipt.blockNumber);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
