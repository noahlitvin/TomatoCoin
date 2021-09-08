const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TomatoCoin contract", function () {
  before(async function () {
    this.TomatoCoin = await ethers.getContractFactory('TomatoCoin');
    this.TomatoTreasury = await ethers.getContractFactory('TomatoTreasury');
  });

  beforeEach(async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    this.treasury = await upgrades.deployProxy(this.TomatoTreasury);
    await this.treasury.deployed();

    this.coin = await upgrades.deployProxy(this.TomatoCoin, [this.treasury.address]);
    await this.coin.deployed();
  });

  it("should only allow the owner to toggle taxes", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    await expect(this.coin.connect(contributor1).enableTax()).to.be.reverted
    await this.coin.enableTax();

    await expect(this.coin.connect(contributor2).disableTax()).to.be.reverted
    await this.coin.disableTax();
  });

  it("should apply taxes appropriately", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    await this.coin.mint(owner.address, 100);
    await this.coin.transfer(contributor1.address, 100);

    expect(await this.coin.balanceOf(owner.address)).to.eq(0);
    expect(await this.coin.balanceOf(contributor1.address)).to.eq(100);
    expect(await this.coin.balanceOf(this.treasury.address)).to.eq("50000000000000000000000");

    await this.coin.enableTax();
    await this.coin.connect(contributor1).transfer(owner.address, 100);

    expect(await this.coin.balanceOf(owner.address)).to.eq(98);
    expect(await this.coin.balanceOf(contributor1.address)).to.eq(0);
    expect(await this.coin.balanceOf(this.treasury.address)).to.eq("50000000000000000000002");
  });

  it("should be capped at 50k coins", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();
    await this.coin.mint(owner.address, "450000000000000000000000");
    expect(await this.coin.totalSupply()).to.eq("500000000000000000000000")
    await expect(this.coin.mint(owner.address, 1)).to.be.reverted;
  });

  it("should only allow the owner to set the minter", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    await expect(this.coin.connect(contributor1.address).setMinter(contributor1.address)).to.be.reverted;
    await expect(this.coin.connect(contributor2.address).setMinter(contributor1.address)).to.be.reverted;

    await this.coin.setMinter(contributor1.address)
  })

  it("should only allow the minter to mint", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    await this.coin.mint(owner.address, "1");
    await expect(this.coin.connect(contributor1).mint(owner.address, 1)).to.be.reverted;

    await this.coin.setMinter(contributor1.address)

    await this.coin.connect(contributor1).mint(owner.address, "1");
    await expect(this.coin.mint(owner.address, 1)).to.be.reverted;
  })

});