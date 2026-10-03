// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PaseoToken — Paseo Points (PASEO) del ecosistema Paseo Aranjuez
/// @notice El centro comercial actúa como relayer y patrocina el gas: el cliente nunca firma.
contract PaseoToken is ERC20, Ownable {
    mapping(address => bool) public isAuthorizedRelayer;

    event PointsMinted(address indexed to, uint256 amount, string reason);
    event PointsBurned(address indexed from, uint256 amount, string rewardId);

    constructor() ERC20("Paseo Points", "PASEO") Ownable(msg.sender) {
        isAuthorizedRelayer[msg.sender] = true;
    }

    modifier onlyRelayer() {
        require(isAuthorizedRelayer[msg.sender] || owner() == msg.sender, "No autorizado");
        _;
    }

    function setRelayer(address relayer, bool authorized) external onlyOwner {
        isAuthorizedRelayer[relayer] = authorized;
    }

    function awardPoints(address to, uint256 amount, string calldata reason) external onlyRelayer {
        _mint(to, amount * 10 ** decimals());
        emit PointsMinted(to, amount, reason);
    }

    function redeemReward(address from, uint256 amount, string calldata rewardId) external onlyRelayer {
        _burn(from, amount * 10 ** decimals());
        emit PointsBurned(from, amount, rewardId);
    }
}
