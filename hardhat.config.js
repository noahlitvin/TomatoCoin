/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');

module.exports = {
  solidity: "0.8.7",
};

/*

  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/HHtNKx3aX7v7iboD05tf8U-ua9GBLtXD`,
      accounts: [`0x`],
    },
  },
  */