// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract PaymentContract {
    address public owner;
    uint256 public count;

    struct Product {
      uint256 id;
      string name;
      uint256 price;
    }

    // Las direcciones que van comprando en orden
    mapping(uint256 => address) public getAddress;
    // el balance que cada dir gasta pagando en el contrato, se va sumando por compra
    mapping(address => uint256) private balances;
    // Los productos comprados por cada dirección
    mapping(address => Product[]) public productsByAddress;
    //Un arreglo de productos con la estructura de Product

    constructor() {
      owner = msg.sender;
      count = 0;
    }

    event PaymentReceived(address indexed sender,uint256 amount,uint256 idProduct,string name);
    // pagar al contrato el valor
    function pay(uint256 idProduct, string memory name) public payable {
        require(msg.value > 0, "Payment amount must be greater than zero");
        balances[msg.sender] += msg.value / 1e18;
        getAddress[count] = msg.sender;
        count++;

        Product memory productIn = Product(idProduct, name, msg.value);
        productsByAddress[msg.sender].push(productIn);

        emit PaymentReceived(msg.sender, msg.value, idProduct, name);
        }
    // obtener el balance total del contrato
    function getContractBalance() public isOwner view returns (uint) {
        address ownerContractAddress = address(this);
        return ownerContractAddress.balance;
    }
    // transferir del contrato todo a la billetera del owner
    function transferFundsToOwner() public isOwner {
        address payable ownerWallet = payable(owner);
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract has no balance to transfer");
        ownerWallet.transfer(contractBalance);
    }
    // el balance que ha gastado cada billetera
    function getBalanceEachAddress(address account) public view isOwner returns (uint256) {
        return balances[account];
    }
    // transferir del contrato a otra billetera
    function transferTo(uint amount, address to) public isOwner {
        require(address(this).balance >= amount);
        require(to != address(0));
        payable(to).transfer(amount);
    }
    //el propietario
    modifier isOwner() {
      require(msg.sender == owner);
      _;
    }
}
