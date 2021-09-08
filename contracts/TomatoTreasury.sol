// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title Tomato Treasury
/// @author Noah Litvin
/// @notice This contract manages the Tomato Treasury.
/// @dev This will be upgraded to contain additional functionality in the future.
contract TomatoTreasury is Initializable, OwnableUpgradeable  {

    /// @dev Upgradeable-compatible constructor
    function initialize() public initializer {
        __Ownable_init();
    }

    receive() external payable {}
}
