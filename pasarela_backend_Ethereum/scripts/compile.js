const path = require('path');
const fs = require('fs')
const solc = require('solc');

const contractPath = path.resolve(__dirname, "../contracts", "PaymentContract.sol")
const source = fs.readFileSync(contractPath, 'utf8');
console.log(source);

var input = {
    language: 'Solidity',
    sources: {
        'PaymentContract.sol': {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

var output = JSON.parse(solc.compile(JSON.stringify(input)));
var interface = output.contracts['PaymentContract.sol']['PaymentContract'].abi;
var bytecode = output.contracts['PaymentContract.sol']['PaymentContract'].evm.bytecode.object;
console.log("----------------------------------------------------------")
console.log(interface);
console.log("----------------------------------------------------------")
console.log(bytecode);
console.log("----------------------------------------------------------")
exports.interface = output.contracts['PaymentContract.sol']['PaymentContract'].abi;
exports.bytecode = output.contracts['PaymentContract.sol']['PaymentContract'].evm.bytecode.object;