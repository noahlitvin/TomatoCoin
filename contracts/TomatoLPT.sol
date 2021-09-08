// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

/// @title Tomato Liquitiy Pool Token
/// @author Noah Litvin
/// @notice This is an ERC20 token that represents liquidity provided to the TOM/ETH pool. It is deployed/owned by the liquidity pool.
contract TomatoLPT is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable {

    address minter;
    /// @dev Upgradeable-compatible constructor
    function initialize() public initializer {
      __ERC20_init("TomatoLPT", "LPT");
      __ERC20Burnable_init();
      __Ownable_init();
    }
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burnFromAsOwner(address account, uint256 amount) public onlyOwner {
      _burn(account, amount);
    }
}
