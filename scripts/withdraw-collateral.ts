import { ethers, getChainId, hardhatArguments, network } from "hardhat";
import { loadData } from "./printer";

async function main() {
  const net = hardhatArguments.network ?? "hardhat";
  const data = loadData(net);
  const endpoint = data.addresses.endpoint;
  const usdc = data.addresses.usdc;
  // const btc = data.addresses.btc;

  // The address of the deployed contract
  const [deployer] = await ethers.getSigners();

  const subaccountName = "default"; // 12-bytes sub-account
  const productId = 0; // productId -  usdc: 0, BTC-spot: 1,
  const amount = ethers.utils.parseEther("100");

  // await usdcContract.connect(deployer).mint(amount);
  // await usdcContract.connect(deployer).approve(endpoint, amount);

  // Chuyển đổi subaccountName thành bytes32 và sau đó lấy 12 bytes đầu tiên
  const subaccountNameBytes32 = ethers.utils.formatBytes32String(subaccountName);
  const subaccountNameBytes12 = subaccountNameBytes32.slice(0, 26);
  //   '0x' + 24 ký tự tiếp theo (12 bytes)

  const endpointContract = await ethers.getContractAt("Endpoint", endpoint);
  const nonce = await endpointContract.getNonce(deployer.address);

  const type = {
    WithdrawCollateral: [
      { name: "sender", type: "bytes32" },
      { name: "productId", type: "uint32" },
      { name: "amount", type: "uint128" },
      { name: "nonce", type: "uint64" },
    ],
    SignedWithdrawCollateral: [
      { name: "tx", type: "WithdrawCollateral" },
      { name: "signature", type: "bytes" },
    ],
  };

  const val = {
    sender: deployer.address + subaccountNameBytes12.slice(2),
    productId: productId,
    amount: amount,
    nonce: nonce,
  };

  console.log(val);

  let chainId = network.config.chainId ?? await getChainId();
  console.log("chainId:", chainId);

  const sig = await deployer._signTypedData(
    {
      name: "Vertex",
      chainId: chainId,
      version: "0.0.1",
      verifyingContract: endpoint,
    },
    { WithdrawCollateral: type.WithdrawCollateral },
    val
  );
  console.log("sig:", sig);

  const paramType = "tuple(tuple(bytes32,uint32,uint128,uint64),bytes)";

  const txn = ethers.utils.defaultAbiCoder.encode(
    [paramType],
    [[[val.sender, val.productId, val.amount, val.nonce], sig]]
  );
  console.log("txn data:", txn);

  const tx = await endpointContract.submitTransactions(["0x02" + txn.slice(2)], { gasLimit: 1000000 });

  await tx.wait();

  // console.log(`=> tx hash: ${tx.hash}`);
  // console.log("=> tx: ", tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
