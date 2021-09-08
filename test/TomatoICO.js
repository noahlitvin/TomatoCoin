const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TomatoICO contract", function () {
  before(async function () {
    this.TomatoICO = await ethers.getContractFactory('TomatoICO');
    this.TomatoCoin = await ethers.getContractFactory('TomatoCoin');
    this.TomatoTreasury = await ethers.getContractFactory('TomatoTreasury');
    this.TomatoLPT = await ethers.getContractFactory('TomatoLPT');
    this.TomatoPool = await ethers.getContractFactory('TomatoPool');
  });

  beforeEach(async function () {
    this.treasury = await upgrades.deployProxy(this.TomatoTreasury);
    await this.treasury.deployed();

    this.coin = await upgrades.deployProxy(this.TomatoCoin, [this.treasury.address]);
    await this.coin.deployed();

    this.lpt = await upgrades.deployProxy(this.TomatoLPT);
    await this.lpt.deployed();

    this.pool = await upgrades.deployProxy(this.TomatoPool, [this.lpt.address, this.coin.address]);
    await this.pool.deployed();

    this.ico = await upgrades.deployProxy(this.TomatoICO, [this.coin.address, this.pool.address]);
    await this.ico.deployed();

    await this.coin.setMinter(this.ico.address);
  });

  // Governance Tests

  it("should allow the owner to advance phases", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    expect(await this.ico.getCurrentPhase()).to.eq("seed");

    expect(this.ico.connect(contributor1).advancePhase()).to.be.reverted
    await this.ico.advancePhase();

    expect(await this.ico.getCurrentPhase()).to.eq("general");

    expect(this.ico.connect(contributor2).advancePhase()).to.be.reverted
    await this.ico.advancePhase();

    expect(await this.ico.getCurrentPhase()).to.eq("open");
  });

  it("should allow the owner to pause and unpause", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    expect(await this.ico.totalRaised()).to.eq(0)
    await this.ico.advancePhase();

    await this.ico.connect(contributor1).contribute({ value: ethers.utils.parseEther("1") })
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("1"))

    await expect(this.ico.connect(contributor1).pause()).to.be.reverted
    await this.ico.pause();

    expect(this.ico.connect(contributor2).contribute({ value: ethers.utils.parseEther("1") })).to.be.reverted
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("1"))

    await expect(this.ico.connect(contributor2).unpause()).to.be.reverted
    await this.ico.unpause();

    await this.ico.connect(contributor2).contribute({ value: ethers.utils.parseEther("1") })
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("2"))
  });

  // Deposit Tests

  it("should allow only private investors to deposit funds during the seed phase", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("0"))

    await expect(this.ico.connect(contributor1).contribute({ value: ethers.utils.parseEther("1") })).to.be.reverted
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("0"))

    await this.ico.addPrivateInvestor(contributor1.address);
    await this.ico.connect(contributor1).contribute({ value: ethers.utils.parseEther("1") })

    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("1"))
  });

  it("should allow anyone to invest after the seed phase", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("0"))

    await expect(this.ico.connect(contributor1).contribute({ value: ethers.utils.parseEther("1") })).to.be.reverted
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("0"))

    await this.ico.advancePhase();
    await this.ico.connect(contributor1).contribute({ value: ethers.utils.parseEther("1") })
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("1"))

    await this.ico.advancePhase();
    await this.ico.connect(contributor2).contribute({ value: ethers.utils.parseEther("1") })
    expect(await this.ico.totalRaised()).to.eq(ethers.utils.parseEther("2"))

  });

  it("should restrict deposit amounts appropriately based on phase", async function () {
    const [owner, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12] = await ethers.getSigners();

    // Limit to 1500 per individual
    // Limit to 15000 total
    await this.ico.addPrivateInvestor(c1.address);
    await expect(this.ico.connect(c1).contribute({ value: ethers.utils.parseEther("1501") })).to.be.reverted
    await this.ico.connect(c1).contribute({ value: ethers.utils.parseEther("1500") })
    await expect(this.ico.connect(c1).contribute({ value: ethers.utils.parseEther("1") })).to.be.reverted

    await this.ico.addPrivateInvestor(c2.address);
    await this.ico.connect(c2).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c3.address);
    await this.ico.connect(c3).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c4.address);
    await this.ico.connect(c4).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c5.address);
    await this.ico.connect(c5).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c6.address);
    await this.ico.connect(c6).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c7.address);
    await this.ico.connect(c7).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c8.address);
    await this.ico.connect(c8).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c9.address);
    await this.ico.connect(c9).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c10.address);
    await this.ico.connect(c10).contribute({ value: ethers.utils.parseEther("1500") })
    await this.ico.addPrivateInvestor(c11.address);
    await expect(this.ico.connect(c11).contribute({ value: ethers.utils.parseEther("1500") })).to.be.reverted

    await this.ico.advancePhase();

    // Limit to 1000 per individual
    await expect(this.ico.connect(c12).contribute({ value: ethers.utils.parseEther("1001") })).to.be.reverted
    await this.ico.connect(c12).contribute({ value: ethers.utils.parseEther("1000") })
    await expect(this.ico.connect(c12).contribute({ value: ethers.utils.parseEther("1") })).to.be.reverted

    await this.ico.advancePhase();

    // No individual limit
    // Limit to 30,000 total
    await this.ico.connect(c12).contribute({ value: ethers.utils.parseEther("4000") })
    await this.ico.connect(c11).contribute({ value: ethers.utils.parseEther("5000") })
    await expect(this.ico.connect(c10).contribute({ value: ethers.utils.parseEther("5001") })).to.be.reverted
    await this.ico.connect(c10).contribute({ value: ethers.utils.parseEther("5000") })
    await expect(this.ico.connect(c10).contribute({ value: ethers.utils.parseEther("1") })).to.be.reverted

  });

  // Redeem Tests
  it("should restrict redemption to the Open Phase and then provide the correct amount", async function () {
    const [owner, contributor1, contributor2] = await ethers.getSigners();

    await this.ico.addPrivateInvestor(contributor1.address);
    await this.ico.connect(contributor1).contribute({ value: 1 });
    await expect(this.ico.connect(contributor1).redeem()).to.be.reverted
    await this.ico.advancePhase();
    await expect(this.ico.connect(contributor1).redeem()).to.be.reverted
    await this.ico.advancePhase();
    await this.ico.connect(contributor1).redeem()

    expect(await this.coin.balanceOf(contributor1.address)).to.eq(5);
  });

});