import { ethers, hardhatArguments } from "hardhat";
import { loadData } from "./printer";

async function main() {
  const network = hardhatArguments.network ?? "hardhat";
  const data = loadData(network);
  const endpoint = data.addresses.endpoint;
  const usdc = data.addresses.usdc;
  // const btc = data.addresses.btc;

  // The address of the deployed contract
  const [deployer] = await ethers.getSigners();

  console.log("approving...");
  // approve token
  const usdcContract = await ethers.getContractAt("USDC", usdc);

  // params của hàm depositCollateral
  const subaccountName = "default"; // 12-bytes sub-account
  const productId = 0; // productId -  usdc: 0, BTC-spot: 1,
  const amount = ethers.utils.parseEther("100");

  let tx = await usdcContract.connect(deployer).approve(endpoint, amount);
  await tx.wait();

  // Chuyển đổi subaccountName thành bytes32 và sau đó lấy 12 bytes đầu tiên
  const subaccountNameBytes32 = ethers.utils.formatBytes32String(subaccountName);
  const subaccountNameBytes12 = subaccountNameBytes32.slice(0, 26);
  //   '0x' + 24 ký tự tiếp theo (12 bytes)

  console.log(subaccountNameBytes12);

  const endpointContract = await ethers.getContractAt("Endpoint", endpoint);

  tx = await endpointContract
    .connect(deployer)
    .depositCollateral(subaccountNameBytes12, productId, amount, { gasLimit: 1000000 });

  await tx.wait();

  console.log(`=> tx hash: ${tx.hash}`);
  // console.log("=> tx: ", tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
