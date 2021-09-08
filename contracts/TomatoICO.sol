// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Tomato ICO
/// @author Noah Litvin
/// @notice This is contract manages the ICO for Tomato Coin and interacts with the front-end dapp.
interface IERC20Extended is IERC20 {
    function mint(address _to, uint256 _amount) external;
}
interface ITomatoPool {
    function stake() external payable;
}

contract TomatoICO is Initializable, OwnableUpgradeable, PausableUpgradeable  {

    mapping(address => uint256) public balances;
    uint256 public totalRaised;
    Phase currentPhase;
    address[] privateInvestors;
    IERC20Extended private tomatoCoin;
    ITomatoPool private tomatoPool;

    enum Phase {
        Seed,
        General,
        Open
    }

    event Contribution(address indexed sender, uint indexed amount);
    event Redemption(address indexed sender, uint indexed amount);
    
    /// @dev Upgradeable-compatible constructor
    function initialize(address _coin, address _pool) public initializer {
      require(_coin != address(0), "You must specific a coin address");
      __Ownable_init();
      tomatoCoin = IERC20Extended(_coin);
      tomatoPool = ITomatoPool(_coin);
    }

    /// @notice Contribute to the ICO, following the specified requirements
    /// @dev The contract owner can pause this functionality
    function contribute() payable external whenNotPaused {
        // Enforce investor whitelisting
        if(currentPhase == Phase.Seed){
            bool isWhitelisted;
            for(uint i; i < privateInvestors.length; i++){
                if(privateInvestors[i] == msg.sender){
                    isWhitelisted = true;
                }
            }
            require(isWhitelisted,"You have not been whitelisted as a private investor for the seed phase.");
        }

        // Enforce maximum total investment requirements
        if(currentPhase == Phase.Seed && totalRaised + msg.value > 15000 ether){
            revert("You may not exceed the maximum total private contribution limit of 15,000 Ether");
        }else if(totalRaised + msg.value > 30000 ether){
            revert("You may not exceed the maximum total contribution limit of 30,000 Ether");
        }

        // Enforce individual total investment requirements
        if(currentPhase == Phase.Seed && balances[msg.sender] + msg.value > 1500 ether){
            revert("You may not exceed the individual contribution limit of 1,500 Ether");
        }else if(currentPhase == Phase.General && balances[msg.sender] + msg.value > 1000 ether){
            revert("You may not exceed the individual contribution limit of 1,000 Ether");
        }

        // Enforce a non-zero amount of ETH contribution
        require(msg.value > 0, "You must transfer some ETH to contribute.");

        balances[msg.sender] += msg.value;
        totalRaised += msg.value;
        emit Contribution(msg.sender, msg.value);
    }

    /// @notice Allow contribitors to redeem Tomato Coins
    /// @dev The contract owner can pause this functionality
    function redeem() external whenNotPaused {
        require(currentPhase == Phase.Open, "You may not redeem your Tomato Coins until the open phase.");
        require(balances[msg.sender] > 0, "You have no coins to redeem.");

        uint coins = balances[msg.sender] * 5; // We offer tokens at a ratio of 1 ETH to 5 TOM. The decimal representation of ETH and TOM are equivalent.
        balances[msg.sender] = 0;

        tomatoCoin.mint(msg.sender, coins);
        emit Redemption(msg.sender, coins);
    }

    /// @notice Allows the owner to advance the phase from Seed to General and General to Open
    function advancePhase() external onlyOwner {
        require(currentPhase != Phase.Open, "Cannot advance phase");
        if(currentPhase == Phase.General){
            currentPhase = Phase.Open;
        }
        if(currentPhase == Phase.Seed){
            currentPhase = Phase.General;
        }
    }

    /// @notice Get the current phase of the ICO in a human-readable format
    /// @return The phase in lower case
    function getCurrentPhase() external view returns (string memory) {
        if(currentPhase == Phase.Seed){
            return "seed";
        }
        if(currentPhase == Phase.General){
            return "general";
        }
        if(currentPhase == Phase.Open){
            return "open";
        }
    }

    // @notice Set up the liquidity pool with funds acquired from the ICO.
    function withdraw() external onlyOwner {
        require(currentPhase == Phase.Open, "The ICO must be in the general phase.");
        require(address(this).balance > 30000 ether, "The ICO must have raised 30k ETH.");
        require(address(tomatoPool) != address(0), "This contract doesn't have a pool address");

        tomatoCoin.mint(address(this), 150000 ether);
        tomatoCoin.approve(address(tomatoPool), 150000 ether);
        tomatoPool.stake{value: 30000 ether}();
    }

    /// @notice Allows the owner to add an address as a private investor, eligible to contribute during the seed phase
    function addPrivateInvestor(address _privateInvestor) external onlyOwner {
        privateInvestors.push(_privateInvestor);
    }

    /// @notice Allows the owner to pause contributions and redemptions
    /// @dev This calls the pause functionality inherited by PausableUpgradeable
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Allows the owner to unpause contributions and redemptions
    /// @dev This calls the pause functionality inherited by PausableUpgradeable
    function unpause() public onlyOwner {
        _unpause();
    }

    receive() external payable {
        revert("Call contribute() to participate in this ICO.");
    }

}
