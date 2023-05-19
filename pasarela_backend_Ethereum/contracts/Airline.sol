    // SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Airline {

  address public owner;
  uint256 public count;

  struct Customer {
      uint loyaltyPoints;
  }

  struct Flight {
      string name;
      uint256 price;
  }

  uint etherPerPoint = 0.5 ether;

  Flight[] public flights;

  mapping(uint256 => address) public getAddress;
  mapping(address => Customer) public customers;
  mapping(address => Flight[]) public customerFlights;
  mapping(address => uint) public customerTotalFlights;

  event FlightPurchased(address indexed customer, uint price, string flight);
  event FlightPriceUpdated(string flight, uint newPrice);

    constructor() {
      owner = msg.sender;
      flights.push(Flight('Tokio', 4 ether));
      flights.push(Flight('Germany', 3 ether));
      flights.push(Flight('Madrid', 3 ether));
      count = 0;
    }

    function buyFlight(uint flightIndex) public payable {
        Flight storage flight = flights[flightIndex];
        require(msg.value == flight.price);

        Customer storage customer = customers[msg.sender];
        customer.loyaltyPoints += 5;
        customerFlights[msg.sender].push(flight);
        customerTotalFlights[msg.sender] ++;
        getAddress[count] = msg.sender;
        count ++;

        emit FlightPurchased(msg.sender, flight.price, flight.name);
    }

    function totalFlights() public view returns (uint) {
        return flights.length;
    }

    function redeemLoyaltyPoints() public {
        Customer storage customer = customers[msg.sender];
        uint etherToRefund = etherPerPoint * customer.loyaltyPoints;

        address payable passenger = payable(msg.sender);
        passenger.transfer(etherToRefund);
        customer.loyaltyPoints = 0;
    }

    function getRefundableEther() public view returns (uint) {
        return etherPerPoint * customers[msg.sender].loyaltyPoints;
    }

    function getAirlineBalance() public isOwner view returns (uint) {
        address airlineAddress = address(this);
        return airlineAddress.balance;
    }

    function transferFundsToOwner() public isOwner {
        address payable ownerWallet = payable(owner);
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract has no balance to transfer");

        ownerWallet.transfer(contractBalance);
    }

    function updateFlightPrice(uint flightIndex, uint newPrice) public isOwner {
        require(flightIndex < flights.length, "Flight index out of range");
        Flight storage flight = flights[flightIndex];
        flight.price = newPrice;
        emit FlightPriceUpdated(flight.name, newPrice);
    }

    function addFlight(string memory name, uint256 price) public isOwner {
        flights.push(Flight(name, price));
    }

    function removeFlight(uint256 flightIndex) public isOwner {
        require(flightIndex < flights.length, "Flight index out of bounds");
        for (uint256 i = flightIndex; i < flights.length - 1; i++) {
            flights[i] = flights[i+1];
        }
        flights.pop();
    }

    function deleteCustomerFlights(address customerAddress) public isOwner {
        delete customerFlights[customerAddress];
    }

    function deleteCustomerTotalFlights(address customerAddress) public isOwner {
        delete customerTotalFlights[customerAddress];
    }


    function transferMoney(uint amount) public isOwner {
        require(address(this).balance >= amount);
        payable(owner).transfer(amount);
    }


    function transferTo(uint amount, address to) public isOwner {
        require(address(this).balance >= amount);
        require(to != address(0));
        payable(to).transfer(amount);
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }
}
