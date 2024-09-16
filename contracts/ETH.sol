// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ETH is ERC20 {
    constructor() ERC20("ETH", "ETH") {
        _mint(msg.sender, 1000000000e18);
    }

    function mint(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }
}
