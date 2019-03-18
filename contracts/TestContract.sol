pragma solidity ^0.5.0;

contract TestContract {
    int256 public number;
    
    function setNumber(int256 newNumber) public {
        number = newNumber;
    }
}