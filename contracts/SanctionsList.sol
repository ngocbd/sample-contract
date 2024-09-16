// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

contract SanctionsList {
    mapping(address => bool) public sanctionsList;

    function isSanctioned(address addr) external view returns (bool) {
        return sanctionsList[addr];
    }

    // function isSanctioned(address /* addr */) external pure returns (bool) {
    //     return false;
    // }
}
