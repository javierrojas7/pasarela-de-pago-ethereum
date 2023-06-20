

import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import abi from './contractAbi';
import logo from './../logo_ethereum.jpg'
import './styles.css';

const PaymentGateway = () => {
    //cuenta que se conecta a react
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('');
    //billetera conectada
    const [active, setActive] = useState(false);
    //contrato para pagos
    const [contract, setContract] = useState(null);
    //precio para pagar y producto a comprar
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [productName, setProductName] = useState('');
    //dir y numero para saber que compro
    const [inaddress, setAddress] = useState('');
    //funcion traer producto comprado
    const [owner, setOwner] = useState('');
    //obtener fondos del contrato
    const [balanceContract, setBalanceContract] = useState('');
    // transferir dinero a 
    const [addressTo, setAddressTo] = useState('');
    const [amount, setAmount] = useState('');

    const web3Contract = new Web3('http://localhost:8545');
    //funcion para conectar la billetera
    const handleConnect = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Wallet = new Web3(window.ethereum);
                const accounts = await web3Wallet.eth.getAccounts();
                const currentAccount = accounts[0];
                setAccount(currentAccount);
                const currentBalance = await web3Wallet.eth.getBalance(currentAccount);
                const value = Web3.utils.fromWei(currentBalance.toString(), 'ether');
                setBalance(value);
                setActive(true)
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error('Web3 provider not found');
        }
    };

    // Función para cargar el contrato y los datos
    const loadContractData = async () => {
        try {
            // Obtener una instancia de contrato ya existente
            const contractInstance = new web3Contract.eth.Contract(abi, '0x8eA3E09D483241e43efa5273aeA1ccC17d7E57aa');
            setContract(contractInstance);
            const contractOwner = await contractInstance.methods.owner().call();
            setOwner(contractOwner)
        } catch (error) {
            console.error(error);
        }
    };

    // Función para procesar el pago
    const processPayment = async () => {
        if (paymentAmount > 0) {
            try {
                const paymentValue = Web3.utils.toWei(paymentAmount.toString(), 'ether');
                // Llamar a la función pay del contrato
                await contract.methods.pay(1, productName).send({
                    from: account,
                    value: paymentValue,
                    gas: 500000
                });
                const delayedFunction = setTimeout(() => {
                    // Aquí puedes colocar el código de la función que deseas ejecutar después de 5 segundos
                    const web3Wallet = new Web3(window.ethereum);
                    web3Wallet.eth.getBalance(account)
                        .then(updatedBalance => {
                            console.log(weiToEther(updatedBalance));
                            setBalance(weiToEther(updatedBalance));
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }, 3000);

                getContractBalanceMain()
                console.log("pago exitoso")
            } catch (error) {
                console.error(error);
            }
        }
    };

    // traer dir que compro algun producto por numero en el array
    const getAllAddress = async () => {
        try {
            let shouldBreak = false;
            // Bucle for con break
            let i = 0;
            while (true) {
                const address = await contract.methods.getAddress(i).call();
                // Comprobar si se debe salir del bucle
                if (shouldBreak) {
                    break;
                }
                // Condición para salir del bucle
                if (address === '0x0000000000000000000000000000000000000000') {
                    shouldBreak = true;
                } else {
                    console.log(address)
                }
                i++;
            }
        } catch (error) {
            console.error(error);
        }
    };

    // traer dir que compro algun producto por numero en el array
    const addressListProduct = async () => {
        let i = 0;
        while (true) {
            try {
                // Bucle for con break
                const userProducts = await contract.methods.productsByAddress(inaddress, i).call();
                console.log(userProducts)
            } catch (error) {
                break;
            }
            i++;
        }
    };

    // Cargar los datos del contrato al conectar la billetera MetaMask
    useEffect(() => {
        if (active) {
            console.log("load contract")
            loadContractData();
        }
    }, [active]);

    // Cargar los datos del contrato al conectar la billetera MetaMask
    useEffect(() => {
        getContractBalanceMain()
    }, [owner]);

    const getContractBalanceMain = async () => {
        if (owner === account) {
            try {
                // Cargar el balance del usuario
                if (contract != null) {
                    const contractBalance = await contract.methods.getContractBalance().call({ from: account });
                    setBalanceContract(contractBalance)
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    const trasnferAllMoneyToOwner = async () => {
        if (owner === account) {
            try {
                // Cargar el balance del usuario
                if (contract != null && balanceContract > 0) {
                    console.log(contract)
                    console.log(account)
                    const transfer = await contract.methods.transferFundsToOwner().send({ from: account });
                    console.log("transfer Money", transfer)
                    getContractBalanceMain()
                    if (owner === account) {
                        const delayedFunction = setTimeout(() => {
                            // Aquí puedes colocar el código de la función que deseas ejecutar después de 5 segundos
                            const web3Wallet = new Web3(window.ethereum);
                            web3Wallet.eth.getBalance(account)
                                .then(updatedBalance => {
                                    console.log(weiToEther(updatedBalance));
                                    setBalance(weiToEther(updatedBalance));
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                        }, 3000);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    // Función para procesar el pago
    const transferTo = async () => {
        try {
            // Obtener la instancia del contrato
            let stringAmount = etherToWei(amount)
            await contract.methods.transferTo(stringAmount, addressTo).send({ from: account, gas: 500000 });
            // Aquí puedes realizar acciones adicionales después de transferir los fondos
            getContractBalanceMain()
            console.log('Funds transferred successfully');
        } catch (error) {
            console.error('Error transferring funds:', error);
        }
    };

    function etherToWei(inWei) {
        const ether = Web3.utils.toWei(inWei.toString(), 'ether');
        return ether;
    }

    function weiToEther(inWei) {
        const ether = Web3.utils.fromWei(inWei.toString(), 'ether');
        return ether;

    }

    function Admin() {
        if (owner === account && active) {
            return (
                <div>
                    <div className="section">
                        <div className="balance-info">
                            <h2 className="info-title">Balance del contrato</h2>
                            <div className="info-value">{weiToEther(balanceContract)} ETH</div>
                        </div>
                        <div className="section-get-address">
                            <button onClick={getAllAddress}>Obtener todas las direcciones</button>
                            <div className="input-container">
                                <label>Dirección:</label>
                                <input type="text" value={inaddress} onChange={(e) => setAddress(e.target.value)} />
                            </div>
                            <button onClick={addressListProduct}>Obtener lista de compras por dirección</button>
                        </div>
                        <h2 className="info-title">tranferir fondos</h2>
                        <div className='section-transfer-to'>
                            <div className="input-container">
                                <label>Enviar a la dirección:</label>
                                <input type="text" value={addressTo} onChange={(e) => setAddressTo(e.target.value)} />
                                <label>Cantidad a transferir (ETH):</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            <button onClick={transferTo}>Transferir fondos</button>
                        </div>
                        <div className='section-transfer-all'>
                            <button onClick={trasnferAllMoneyToOwner}>Transferir todo el dinero</button>
                        </div>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    function Payment() {
        if (active) {
            return (
                <div className="section">
                    <h2>Realizar un pago</h2>
                    <div className="section-payment">
                        <div className="input-container">
                            <label>Nombre del producto:</label>
                            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} />
                        </div>
                        <div className="input-container">
                            <label>Cantidad a pagar (ETH):</label>
                            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        </div>
                        <button onClick={processPayment}>Pagar</button>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    return (
        <div>
            <div>
                <h1>ETHEREUM</h1>
                <div className="section">
                    <div className="logo-container">
                        <img src={logo} alt="Ethereum Logo" className="ethereum-logo" />
                    </div>
                </div>
                <div className="section-balance-account">
                    <p>Cuenta: {account}</p>
                    <p>Balance: {balance}</p>
                    <button onClick={handleConnect}>Conectar</button>
                </div>
                {Payment()}
                {Admin()}
            </div>
        </div>
    );
};

export default PaymentGateway;