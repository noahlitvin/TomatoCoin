// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title Tomato Coin
/// @author Noah Litvin
/// @notice This is an ERC20 token for tomato lovers.
contract TomatoCoin is Initializable, ERC20Upgradeable, OwnableUpgradeable {

    address treasury;
    address minter;
    bool taxEnabled;

    /// @dev Upgradeable-compatible constructor
    function initialize(address _treasury) public initializer {
      require(_treasury != address(0));
      __ERC20_init("TomatoCoin", "TOM");
      __Ownable_init();
      minter = msg.sender;
      treasury = _treasury;
      _mint(treasury, 50000 * 10**decimals());
    }

    /// @notice Transfers coins between accounts, sending a 2% tax to the treasury if taxEnabled is true
    /// @dev This overrides the _transfer function provided by ERC20Upgradeable
    /// @param from Address to transfer the coins from
    /// @param to Address to transfer the coins to
    /// @param value Amount of coins to transfer
    function _transfer(address from, address to, uint256 value) internal override {
        if(taxEnabled){
            uint tax = value / 50; // tax 2%
            value -= tax;
            super._transfer(from, treasury, tax);
        }
        super._transfer(from, to, value);
    }

    /// @notice Allows the owner to set an account that is allowed to mint coins
    /// @param _minter Address of the new minter
    function setMinter(address _minter) onlyOwner public {
        minter = _minter;
    }

    /// @notice Allows the minter to mint additional coins
    /// @param _to Address to receive the newly minted coins
    /// @param _amount Amount of coins to mint
    function mint(address _to, uint256 _amount) external {
        require(msg.sender == minter);
        _mint(_to, _amount);
    }

    /// @notice Mints new coins, wil a cap of 50,000 coins (denominated with the decimal function)
    /// @dev This overrides the _mint function provided by ERC20Upgradeable
    /// @param account Address to receive the minted coins
    /// @param amount Amount of coins to mint
    function _mint(address account, uint256 amount) internal virtual override {
        uint cap = 500000 * 10**decimals();
        require(ERC20Upgradeable.totalSupply() + amount <= cap, "ERC20Capped: cap exceeded");
        super._mint(account, amount);
    }

    /// @notice Allows the owner to enable the 2% tax to the treasury on transfers
    function enableTax() external onlyOwner {
        require(!taxEnabled, "Tax is already enabled");
        taxEnabled = true;
    }
    
    /// @notice Allows the owner to disable the 2% tax to the treasury on transfers    }
    function disableTax() external onlyOwner {
        require(taxEnabled, "Tax is already disabled");
        taxEnabled = false;
    }
}
