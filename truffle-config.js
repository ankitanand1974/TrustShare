require("babel-register");
require("babel-polyfill");

require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    goerli: {
      networkCheckTimeout: 10000,
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `wss://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_API_KEY}`
        );
      },
      gasPrice: 25000000000,
      network_id: "5",
    },
    // sepolia: {
    //   networkCheckTimeout: 10000,
    //   provider: function () {
    //     return new HDWalletProvider(
    //       process.env.MNEMONIC,
    //       `wss://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_API_KEY}`
    //     );
    //   },
    //   gasPrice: 25000000000,
    //   network_id: "11155111",
    // },
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis/",
  compilers: {
    solc: {
      version: "^0.8",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
