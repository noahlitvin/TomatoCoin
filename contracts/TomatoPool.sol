// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface IERC20Extended is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFromAsOwner(address account, uint256 amount) external;
}

/// @title Tomato Pool
/// @author Noah Litvin
/// @notice This contract is an AMM for TOM + ETH.
contract TomatoPool is Initializable, OwnableUpgradeable  {

    uint public ethBalance;
    uint public tomBalance;
    IERC20 tomatoCoin;
    IERC20Extended tomatoLPT;

    uint constant MINIMUM_LIQUIDITY = 1000; // https://docs.uniswap.org/protocol/V2/concepts/protocol-overview/smart-contracts#minimum-liquidity

    /// @dev Upgradeable-compatible constructor
    function initialize(address _tomatoLPT,address _tomatoCoin) public initializer {
        require(_tomatoLPT != address(0), "You must provide an address for Tomato LPT");
        require(_tomatoCoin != address(0), "You must provide an address for Tomato Coin");
        __Ownable_init();
        tomatoLPT = IERC20Extended(_tomatoLPT);
        tomatoCoin = IERC20(_tomatoCoin);
    }

    function stake() external payable {
        require(msg.value > 0, "You must submit ETH to stake.");
        if(ethBalance == 0 && tomBalance == 0){
            _setupPool();
        }else{
            _growPool();
        }
    }

    function _setupPool() internal {
        uint tomAmount = tomatoCoin.allowance(msg.sender, address(this));
        require(tomAmount > 0, "You must approve TOM to be transfered to the pool.");

        require(_sqrt(msg.value * tomAmount) > MINIMUM_LIQUIDITY, "You must provide more liquidity to set up this pool.");
        uint lpAmount = _sqrt(msg.value * tomAmount) - MINIMUM_LIQUIDITY;

        ethBalance = msg.value;
        tomBalance = tomAmount;

        tomatoCoin.transferFrom(msg.sender, address(this), tomAmount);
        tomatoLPT.mint(msg.sender, lpAmount);
    }

    function _growPool() internal {
        uint stakeableTom = msg.value * tomBalance / ethBalance;
        require(tomatoCoin.allowance(msg.sender, address(this)) >= stakeableTom, "You must allow this contract to transfer additional TOM");

        uint lpAmount = Math.min(
            msg.value * tomatoLPT.totalSupply() / ethBalance,
            stakeableTom * tomatoLPT.totalSupply() / tomBalance
        );

        ethBalance += msg.value;
        tomBalance += stakeableTom;

        tomatoCoin.transferFrom(msg.sender, address(this), stakeableTom);
        tomatoLPT.mint(msg.sender, lpAmount);
    }

    function exchangeForTom() external payable {
        uint ethAmount = msg.value;
        require(ethAmount > 0, "You must provide ETH to exchange");

        uint k = ethBalance * tomBalance;
        uint x = ethBalance + ethAmount;
        uint y = k / x;

        require(tomBalance > y, "There is not enough liquidity in the pool for this exchange.");
        uint tomAmount = tomBalance - y;

        uint expectedTomAmount = ethAmount * tomBalance / ethBalance;
        _checkSlippage(expectedTomAmount, tomAmount);

        // Apply 1% fee
        uint fee = tomAmount / 100;

        // Update balances in state
        ethBalance += ethAmount;
        tomBalance -= (tomAmount - fee);

        tomatoCoin.transfer(msg.sender, tomAmount - fee);
    }

    function estimateTom(uint ethAmount) external view returns (uint) {
        require(ethAmount > 0, "You must provide ETH to exchange");

        uint k = ethBalance * tomBalance;
        uint x = ethBalance + ethAmount;
        uint y = k / x;

        require(tomBalance > y, "There is not enough liquidity in the pool for this exchange.");
        uint tomAmount = tomBalance - y;

        uint expectedTomAmount = ethAmount * tomBalance / ethBalance;
        _checkSlippage(expectedTomAmount, tomAmount);

        // Apply 1% fee
        uint fee = tomAmount / 100;

        return tomAmount - fee;
    }

    function exchangeForEth(uint tomAmount) external {
        require(tomAmount >= tomatoCoin.allowance(msg.sender, address(this)), "You must approve more TOM to be transfered to the pool.");

        uint k = tomBalance * ethBalance;
        uint x = tomBalance + tomAmount;
        uint y = k / x;

        require(ethBalance > y, "There is not enough liquidity in the pool for this exchange.");
        uint ethAmount = ethBalance - y;

        uint expectedEthAmount = tomAmount * ethBalance / tomBalance;
        _checkSlippage(expectedEthAmount, ethAmount);

        // Apply 1% fee
        uint fee = ethAmount / 100;

        // Update balances in state
        tomBalance += tomAmount;
        ethBalance -= (ethAmount - fee);

        tomatoCoin.transferFrom(msg.sender, address(this), tomAmount);
        (bool sent,) = msg.sender.call{value: ethAmount - fee}("");
        require(sent, "Failed to send Ether");
    }

    function estimateEth(uint tomAmount) external view returns (uint) {
        uint k = tomBalance * ethBalance;
        uint x = tomBalance + tomAmount;
        uint y = k / x;

        require(ethBalance > y, "There is not enough liquidity in the pool for this exchange.");
        uint ethAmount = ethBalance - y;

        uint expectedEthAmount = tomAmount * ethBalance / tomBalance;
        _checkSlippage(expectedEthAmount, ethAmount);

        // Apply 1% fee
        uint fee = ethAmount / 100;

        return ethAmount - fee;
    }

    function withdraw() external {
        uint withdrawableTokens = tomatoLPT.balanceOf(msg.sender);
        uint ethAmount = ethBalance * withdrawableTokens / tomatoLPT.totalSupply();
        uint tomAmount = tomBalance * withdrawableTokens / tomatoLPT.totalSupply();

        ethBalance -= ethAmount;
        tomBalance -= tomAmount;

        tomatoLPT.burnFromAsOwner(msg.sender, withdrawableTokens);
        tomatoCoin.transfer(msg.sender, tomAmount);
        (bool sent,) = msg.sender.call{value: ethAmount}("");
        require(sent, "Failed to send Ether");
    }

    receive() external payable {
        revert("Call stake() to add funds to the liquidity pool.");
    }

    function _checkSlippage(uint expected, uint actual) pure internal {
        require(10*(expected-actual)/expected < 1, "Slippage may not exceed 10%. Try exchanging a smaller amount.");
    }

    function _sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
