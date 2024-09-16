/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-deploy";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  defaultNetwork: "localnet",
  networks: {
    hardhat: {},
    localnet: {
      url: "http://127.0.0.1:8545/",
      accounts: [process.env.WALLET1 || ""],
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.PRIVATE_KEY || "import-key"],
    },
    // TESTnet
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [process.env.PRIVATE_KEY || "import-key"],
    },
    bsctest: {
      url: "https://data-seed-prebsc-1-s2.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 5000000000,
      accounts: [process.env.PRIVATE_KEY || "import-key"],
    },
    ethSepolia: {
      url: "https://rpc.sepolia.org",
      chainId: 11155111,
      gasMultiplier: 1.05,
      accounts: [process.env.PRIVATE_KEY || "import-key"],
    },
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: [process.env.PRIVATE_KEY || "import-key"],
      gasMultiplier: 1.2,
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "import-key",
    // apiKey: process.env.ETHERSCAN_API_KEY || "import-key",
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  contractSizer: {
    runOnCompile: false,
  },
  abiExporter: {
    path: "./abis",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
  },
  gasReporter: {
    onlyCalledMethods: true,
    showTimeSpent: true,
  },
  mocha: {
    timeout: 1000000000,
  },
};

export default config;
