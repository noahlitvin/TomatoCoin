const fs = require('fs')
const { ethers, upgrades } = require("hardhat");

async function main() {
    const TomatoTreasury = await ethers.getContractFactory("TomatoTreasury");
    const TomatoTreasuryContract = await upgrades.deployProxy(TomatoTreasury);
    await TomatoTreasuryContract.deployed();
    console.log("TomatoTreasuryContract deployed to:", TomatoTreasuryContract.address);

    const TomatoCoin = await ethers.getContractFactory("TomatoCoin");
    const TomatoCoinContract = await upgrades.deployProxy(TomatoCoin, [TomatoTreasuryContract.address]);
    await TomatoCoinContract.deployed();
    console.log("TomatoCoinContract deployed to:", TomatoCoinContract.address);

    const TomatoLPT = await ethers.getContractFactory("TomatoLPT");
    const TomatoLPTContract = await upgrades.deployProxy(TomatoLPT);
    await TomatoLPTContract.deployed();
    console.log("TomatoLPTContract deployed to:", TomatoLPTContract.address);

    const TomatoPool = await ethers.getContractFactory("TomatoPool");
    const TomatoPoolContract = await upgrades.deployProxy(TomatoPool, [TomatoLPTContract.address, TomatoCoinContract.address]);
    await TomatoPoolContract.deployed();
    console.log("TomatoPoolContract deployed to:", TomatoPoolContract.address);

    const TomatoICO = await ethers.getContractFactory("TomatoICO");
    const TomatoICOContract = await upgrades.deployProxy(TomatoICO, [TomatoCoinContract.address, TomatoPoolContract.address]);
    await TomatoICOContract.deployed();
    console.log("TomatoICOContract deployed to:", TomatoICOContract.address);

    await TomatoCoinContract.setMinter(TomatoICOContract.address);

    await TomatoLPTContract.transferOwnership(TomatoPoolContract.address)

    const envVars = `NEXT_PUBLIC_COIN_ADDRESS=${TomatoCoinContract.address}
NEXT_PUBLIC_LPT_ADDRESS=${TomatoLPTContract.address}
NEXT_PUBLIC_POOL_ADDRESS=${TomatoPoolContract.address}
NEXT_PUBLIC_ICO_ADDRESS=${TomatoICOContract.address}`
    fs.writeFileSync('./frontend/.env.local', envVars, { flag: 'w' })
}

main();