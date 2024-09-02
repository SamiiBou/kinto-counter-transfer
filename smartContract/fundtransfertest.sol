// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FundTransfer {
     function transferFunds(address payable recipient) external payable {
        require(msg.value > 0, "Must send some ether");
        recipient.transfer(msg.value);
    }

    // For receiving ether
    receive() external payable {}
}
