var PaymentContract = artifacts.require("./PaymentContract.sol");

module.exports = function(deployer) {
  deployer.deploy(PaymentContract);
};
