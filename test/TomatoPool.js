const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TomatoPool contract", function () {
  before(async function () {
    this.TomatoICO = await ethers.getContractFactory('TomatoICO');
    this.TomatoCoin = await ethers.getContractFactory('TomatoCoin');
    this.TomatoTreasury = await ethers.getContractFactory('TomatoTreasury');
    this.TomatoLPT = await ethers.getContractFactory('TomatoLPT');
    this.TomatoPool = await ethers.getContractFactory('TomatoPool');
  });

  beforeEach(async function () {
    const [owner, contributor1] = await ethers.getSigners();

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

    await this.lpt.transferOwnership(this.pool.address)

    // Advance to the general phase
    await this.ico.advancePhase();
    await this.ico.advancePhase();

    // Get 500 TOM
    await this.ico.contribute({ value: ethers.utils.parseEther("100") })
    await this.ico.redeem()
    await this.ico.connect(contributor1).contribute({ value: ethers.utils.parseEther("100") })
    await this.ico.connect(contributor1).redeem()
  });

  // Can add to an empty pool
  it("should allow pooling liquidity", async function () {
    const [owner, contributor1] = await ethers.getSigners();

    // Require ETH and TOM to populate the pool
    await expect(this.pool.stake()).to.be.reverted;
    await expect(this.pool.stake({ value: ethers.utils.parseEther("1") })).to.be.reverted;

    await this.coin.approve(this.pool.address, ethers.utils.parseEther("1"))
    await this.pool.stake({ value: ethers.utils.parseEther("0.5") })

    expect(await this.coin.balanceOf(this.pool.address)).to.eq(ethers.utils.parseEther("1"));
    expect(await this.pool.tomBalance()).to.eq(ethers.utils.parseEther("1"));
    expect(await this.pool.ethBalance()).to.eq(ethers.utils.parseEther("0.5"));

    // Require at least enough TOM approved for transfer to maintain the proportion of the current pool
    await this.coin.connect(contributor1).approve(this.pool.address, ethers.utils.parseEther("0.9"))
    await expect(this.pool.connect(contributor1).stake({ value: ethers.utils.parseEther("0.5") })).to.be.reverted;

    await this.coin.connect(contributor1).approve(this.pool.address, ethers.utils.parseEther("1.1"))
    await this.pool.connect(contributor1).stake({ value: ethers.utils.parseEther("0.5") })

    expect(await this.coin.balanceOf(this.pool.address)).to.eq(ethers.utils.parseEther("2"));
    expect(await this.pool.tomBalance()).to.eq(ethers.utils.parseEther("2"));
    expect(await this.pool.ethBalance()).to.eq(ethers.utils.parseEther("1"));

    expect(await this.lpt.balanceOf(owner.address)).to.eq(await this.lpt.balanceOf(contributor1.address));
  });

  // Can swap ETH for TOM
  it("should allow swapping ETH for TOM", async function () {
    const [owner, contributor1] = await ethers.getSigners();

    await this.coin.approve(this.pool.address, ethers.utils.parseEther("1"))
    await this.pool.stake({ value: ethers.utils.parseEther("5") })

    const initialContributorTomBalance = await this.coin.balanceOf(contributor1.address);
    const initialPoolTomBalance = await this.coin.balanceOf(this.pool.address);
    const initialContributorEthBalance = await ethers.provider.getBalance(contributor1.address);
    const initialPoolEthBalance = await ethers.provider.getBalance(this.pool.address);

    await expect(this.pool.connect(contributor1).exchangeForTom({ value: 0 })).to.be.reverted; // Require eth to be sent
    await expect(this.pool.connect(contributor1).exchangeForTom({ value: ethers.utils.parseEther("1") })).to.be.reverted; // Prevent 10% slippage

    const estimate = (await this.pool.estimateTom(ethers.utils.parseEther("0.5"))).add(await this.coin.balanceOf(contributor1.address))
    await this.pool.connect(contributor1).exchangeForTom({ value: ethers.utils.parseEther("0.5") });

    await expect(estimate).to.eq(await this.coin.balanceOf(contributor1.address))
    expect(await this.coin.balanceOf(contributor1.address)).to.gt(initialContributorTomBalance)
    expect(await this.coin.balanceOf(this.pool.address)).to.lt(initialPoolTomBalance)
    expect(await ethers.provider.getBalance(contributor1.address)).to.lt(initialContributorEthBalance)
    expect(await ethers.provider.getBalance(this.pool.address)).to.gt(initialPoolEthBalance)
  });

  // Can swap TOM for ETH
  it("should allow swapping TOM for ETH", async function () {
    const [owner, contributor1] = await ethers.getSigners();

    await this.coin.approve(this.pool.address, ethers.utils.parseEther("5"))
    await this.pool.stake({ value: ethers.utils.parseEther("5") })

    const initialContributorTomBalance = await this.coin.balanceOf(contributor1.address);
    const initialPoolTomBalance = await this.coin.balanceOf(this.pool.address);
    const initialContributorEthBalance = await ethers.provider.getBalance(contributor1.address);
    const initialPoolEthBalance = await ethers.provider.getBalance(this.pool.address);

    await this.coin.connect(contributor1).approve(this.pool.address, ethers.utils.parseEther("0.5"))
    await expect(this.pool.connect(contributor1).exchangeForEth(ethers.utils.parseEther("1"))).to.be.reverted; // Require more TOM to be approved

    const estimate = await this.pool.estimateEth(ethers.utils.parseEther("0.5"))
    await this.coin.connect(contributor1).approve(this.pool.address, ethers.utils.parseEther("0.5"))
    await expect(() => this.pool.connect(contributor1).exchangeForEth(ethers.utils.parseEther("0.5")))
      .to.changeEtherBalance(contributor1, estimate);

    expect(await this.coin.balanceOf(contributor1.address)).to.lt(initialContributorTomBalance)
    expect(await this.coin.balanceOf(this.pool.address)).to.gt(initialPoolTomBalance)
    expect(await ethers.provider.getBalance(contributor1.address)).to.gt(initialContributorEthBalance)
    expect(await ethers.provider.getBalance(this.pool.address)).to.lt(initialPoolEthBalance)
  });

  // Can withdraw from pool
  it("should allow withdrawing with yield", async function () {
    const [owner, contributor1] = await ethers.getSigners();

    // Add Liquidity
    await this.coin.approve(this.pool.address, ethers.utils.parseEther("500"))
    await this.pool.stake({ value: ethers.utils.parseEther("500") })

    const preExchangeTomBalance = await this.coin.balanceOf(this.pool.address)
    const preExchangeEthBalance = await ethers.provider.getBalance(this.pool.address)

    // contributor1 exchanges back and forth
    await this.coin.connect(contributor1).approve(this.pool.address, ethers.utils.parseEther("1"))
    await this.pool.connect(contributor1).exchangeForEth(ethers.utils.parseEther("1"))
    await this.pool.connect(contributor1).exchangeForTom({ value: ethers.utils.parseEther("1") })

    const postExchangeTomBalance = await this.coin.balanceOf(this.pool.address)
    const postExchangeEthBalance = await ethers.provider.getBalance(this.pool.address)
    expect(postExchangeEthBalance).to.gt(preExchangeEthBalance)
    expect(postExchangeTomBalance).to.gt(preExchangeTomBalance)

    const preWithdrawTomBalance = await this.coin.balanceOf(owner.address);

    await expect(() => this.pool.withdraw())
      .to.changeEtherBalance(owner, postExchangeEthBalance);

    expect(await this.coin.balanceOf(owner.address)).to.eq(preWithdrawTomBalance.add(postExchangeTomBalance));
  });

});