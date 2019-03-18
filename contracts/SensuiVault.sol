pragma solidity ^0.5.0;

contract SensuiVault {
  //Owner of the contract. 
  // - Can add operators  
  // - Can change Owner
  // - Can set sensuiFee
  address public owner;
  
  //Balances for the diferent users
  mapping(address => uint256) public balances;
  
  //Operators allowed to fund users
  mapping(address => bool) public operators;
  
  //Fee for the owner for every fund() operation
  uint256 public sensuiFee=0; 
  
  constructor() public {
    owner = msg.sender;
  }

  modifier _onlyOwner() {
    require(msg.sender == owner, "only owner allowed to execute");
    _;
  }

  modifier _onlyOperator() {
    require(operators[msg.sender], "only operators allowed to execute");
    _;
  }

  // -- Owner functions 
  function changeOwner(address _newOwner) _onlyOwner public {
      owner = _newOwner;
  }
  
  //Operators admin functions
  function addOperator(address _opeartor) _onlyOwner public {
      operators[_opeartor] = true;
  }
  function removeOperator(address _opeartor) _onlyOwner public {
      operators[_opeartor] = false;
  }

  //Fee functions
  function setSensuiFee(uint256 amount) _onlyOwner public {
      sensuiFee = amount;
  }
  
  // -- Operator functions
  // gasLimit: aprox 50000
  function fund(address payable receiver, address funder, uint256 amount) _onlyOperator public {
      //TODO: need a better txGas consumption logic
      uint256 operatorFee = tx.gasprice * 70000;
      
      uint totalAmount = amount + sensuiFee + operatorFee;
      require(balances[funder] >= totalAmount,"funder insufficient balance");
      balances[funder] -= totalAmount;
      receiver.transfer(amount);
      balances[owner] += sensuiFee;
      msg.sender.transfer(operatorFee);

      emit Funded(receiver,funder,amount);
  }
    
  event Funded(address indexed receiver, address indexed funder, uint256 amount);
    
  //-- Funders functions
  function deposit(address to) payable public{
    balances[to] += msg.value;
    
    emit Deposited(to,msg.value);
  }

  event Deposited(address indexed funder, uint256 amount);
  
  function withdraw(uint256 amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;
    msg.sender.transfer(amount);
    
    emit Withdrawed(msg.sender,amount);
  }

  event Withdrawed(address indexed funder, uint256 amount);

  
}
