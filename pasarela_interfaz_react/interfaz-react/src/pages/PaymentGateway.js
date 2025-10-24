import Web3 from 'web3';
import React, { useState, useEffect, useCallback } from 'react';
import abi from './contractAbi';
import logo from './../logo_ethereum.jpg'
import './styles.css';

// IMPORTAR SWEETALERT2
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

// =========================================================
// === NUEVO: Mapeo de Estados de Pedido (Solidity Enum) ===
// =========================================================
const ORDER_STATUSES = {
    0: "PENDIENTE",
    1: "EN_PROCESO",
    2: "ENVIADO",
    3: "ENTREGADO",
};
// =========================================================
// === NUEVO: Función de ayuda para formatear el Timestamp ===
// =========================================================
const formatTimestamp = (timestampInSeconds) => {
    // 🛑 CAMBIO CLAVE: Se convierte el BigNumber (BN) a String, y luego a Number.
    const numericTimestamp = Number(timestampInSeconds.toString());

    // Crear la fecha (multiplicando por 1000 porque Ethereum usa segundos)
    const date = new Date(numericTimestamp * 1000);

    // Si la conversión falla, devolvemos un mensaje.
    if (isNaN(numericTimestamp) || numericTimestamp === 0) {
        return "Fecha no disponible o inválida";
    }

    // Devuelve el formato de fecha y hora local
    return date.toLocaleString();
};


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

    // CAMBIO 1: Nuevo estado para almacenar el ID del producto de la URL
    const [productId, setProductId] = useState(1);

    const web3Contract = new Web3('http://localhost:8545');

    // --- NUEVA FUNCIÓN PARA MOSTRAR ALERTA DE ÉXITO ---
    const showSuccessAlert = (title, htmlContent) => {
        MySwal.fire({
            icon: 'success',
            title: title,
            html: htmlContent,
            showConfirmButton: false,
            timer: 4000,
            customClass: {
                popup: 'my-swal-popup',
                title: 'my-swal-title',
                htmlContainer: 'my-swal-html',
            },
            background: '#fff',
        });
    };

    // --- NUEVA FUNCIÓN PARA MOSTRAR ALERTA DE ERROR ---
    const showErrorAlert = (title, text) => {
        MySwal.fire({
            icon: 'error',
            title: title,
            text: text,
            customClass: {
                popup: 'my-swal-error-popup',
            },
        });
    };

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
                showErrorAlert("Conexión Fallida", "Asegúrate de que MetaMask esté instalado y conectado a la red local.");
                console.error(error);
            }
        } else {
            showErrorAlert("Error", "Web3 provider (MetaMask) no encontrado.");
            console.error('Web3 provider not found');
        }
    };

    // Función para cargar el contrato y los datos
    const loadContractData = async () => {
        try {
            // **CAMBIO NECESARIO 1:** Usando la nueva dirección de contrato
            const contractInstance = new web3Contract.eth.Contract(abi, '0x94139589BDe99c435C490d5304Bb170459DBaD72');
            setContract(contractInstance);
            const contractOwner = await contractInstance.methods.owner().call();
            setOwner(contractOwner)
        } catch (error) {
            console.error(error);
        }
    };

    // Función para procesar el pago
    const processPayment = async () => {
        if (paymentAmount <= 0 || !productName) {
            return showErrorAlert("Datos incompletos", "Debes ingresar un nombre de producto y una cantidad mayor a 0.");
        }

        try {
            const paymentValue = Web3.utils.toWei(paymentAmount.toString(), 'ether');
            // Llamar a la función pay del contrato
            // CAMBIO 2: Usar productId del estado en lugar del '1' fijo
            await contract.methods.pay(productId, productName).send({
                from: account,
                value: paymentValue,
                gas: 500000
            });

            // 2. MOSTRAR ALERTA DE ÉXITO
            showSuccessAlert(
                "¡Pago Exitoso!",
                `<p><strong>Producto:</strong> ${productName}</p>
                 <p><strong>Monto Pagado:</strong> ${paymentAmount} ETH</p>`
            );

            // 3. RECARGAR BALANCE DEL USUARIO CON RETRASO
            setTimeout(() => {
                const web3Wallet = new Web3(window.ethereum);
                web3Wallet.eth.getBalance(account)
                    .then(updatedBalance => {
                        console.log(weiToEther(updatedBalance));
                        setBalance(weiToEther(updatedBalance));
                    })
                    .catch(error => {
                        console.error(error);
                        console.error("Error al recargar balance:", error);
                    });
            }, 3000);

            getContractBalanceMain();
            console.log("pago exitoso")
        } catch (error) {
            // 4. MANEJO DE ERRORES DE METAMASK
            const userDenied = error.message.includes('User denied transaction signature');
            showErrorAlert(
                "Transacción Fallida",
                userDenied ? "Has rechazado la transacción en MetaMask." : "Ocurrió un error en la red. Intenta de nuevo."
            );
            console.error(error);
        }
    };

    // traer dir que compro algun producto por numero en el array
    const getAllAddress = async () => {
        let i = 0;
        let addressesFound = false;
        let htmlOutput = "<ul>"; // Inicia la lista HTML para el SweetAlert

        try {
            while (true) {
                const address = await contract.methods.getAddress(i).call();

                // Condición para salir del bucle (dirección cero)
                if (address === '0x0000000000000000000000000000000000000000') {
                    break;
                } else {
                    // Acumula la dirección en el output HTML
                    htmlOutput += `<li>${address}</li>`;
                    addressesFound = true;
                    console.log(`Dirección ${i + 1}: ${address}`); // Mantiene la impresión en consola
                }
                i++;
            }

            htmlOutput += "</ul>"; // Cierra la lista HTML

            if (addressesFound) {
                showSuccessAlert(
                    "Direcciones Registradas",
                    `Se encontraron ${i} direcciones. <br/> ${htmlOutput}`
                );
            } else {
                showErrorAlert("No se encontraron direcciones", "El contador de compras es cero o no hay registros.");
            }

        } catch (error) {
            showErrorAlert("Error de Consulta", "No se pudo obtener la lista de direcciones.");
            console.error(error);
        }
    }

    // traer dir que compro algun producto por numero en el array
    // traer dir que compro algun producto por numero en el array
    // Función addressListProduct con useCallback (Asegura estabilidad)
    // Las dependencias indican a React que solo recree la función si cambian.
    const addressListProduct = useCallback(async () => {
        let i = 0;
        let productsFound = false;
        let htmlOutput = ""; // Acumulador de productos para el SweetAlert

        try {
            if (!inaddress) {
                return showErrorAlert("Dirección requerida", "Por favor, ingresa una dirección para buscar compras.");
            }

            while (true) {
                try {
                    const userProducts = await contract.methods.productsByAddress(inaddress, i).call();

                    // Conversión del timestamp (ya arreglada y verificada)
                    const purchaseDate = formatTimestamp(userProducts.timestamp);

                    // Conversión del precio de Wei (BN) a Ether
                    const priceInWeiBN = userProducts.price;
                    const priceInEther = weiToEther(priceInWeiBN);

                    // NUEVO: Obtener el estado del pedido y el texto
                    const currentStatus = Number(userProducts.orderStatus.toString());
                    const statusText = ORDER_STATUSES[currentStatus] || "Desconocido";

                    // Acumular la información para el SweetAlert (MOSTRANDO ESTADO)
                    htmlOutput += `
                <div style="text-align: left; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <p><strong>Producto #${i + 1} (ID: ${userProducts.id.toString()})</strong></p>
                    <p><strong>Nombre:</strong> ${userProducts.name}</p>
                    <p><strong>Precio:</strong> ${priceInEther} ETH</p>
                    <p><strong>Fecha:</strong> ${purchaseDate}</p>
                    <p><strong>Estado:</strong> <span style="font-weight: bold; color: ${currentStatus < 3 ? 'orange' : 'green'};">${statusText}</span></p>
                    <button onclick="window.updateStatusPrompt('${inaddress}', ${i}, '${userProducts.name}')" style="background-color: #3f51b5; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Actualizar Estado</button>
                </div>
            `;

                    productsFound = true;
                } catch (error) {
                    // Rompe el bucle cuando se llega al final del array (error de revert)
                    break;
                }
                i++;
            }

            if (productsFound) {
                showSuccessAlert(
                    `Compras de ${inaddress.substring(0, 8)}...`,
                    `Se encontraron ${i} productos. <div style="max-height: 300px; overflow-y: auto;">${htmlOutput}</div>`
                );
            } else {
                showErrorAlert("No se encontraron productos", `La dirección ${inaddress} no tiene compras registradas.`);
            }

        } catch (error) {
            showErrorAlert("Error de Consulta", "Verifica la dirección y la conexión del contrato.");
            console.error(error);
        }
    }, [contract, inaddress, showSuccessAlert, showErrorAlert, formatTimestamp, weiToEther]);

    // =========================================================
    // === NUEVO: Lógica para actualizar el estado del pedido ===
    // =========================================================
    // =========================================================
    // === GESTIÓN DE ESTADOS DEL PEDIDO (Owner) - CON STABILIDAD ===
    // =========================================================

    // Llama al contrato para actualizar el estado (usa useCallback para estabilidad)
    // Dependencias: contract, account (para enviar la TX), y las funciones de alerta/consulta
    const updateOrderStatus = useCallback(async (customerAddress, productIndex, newStatusEnum) => {
        try {
            await contract.methods.updateOrderStatus(customerAddress, productIndex, newStatusEnum).send({ from: account, gas: 500000 });

            showSuccessAlert(
                "Estado Actualizado",
                `<p>El pedido #${productIndex + 1} del cliente <strong>${customerAddress.substring(0, 8)}...</strong> ha sido actualizado a <strong>${ORDER_STATUSES[newStatusEnum]}</strong>.</p>`
            );

            // Vuelve a consultar la lista para refrescar la vista
            addressListProduct();

        } catch (error) {
            showErrorAlert("Error al Actualizar", "Verifica que eres el Owner y que la red esté activa.");
            console.error(error);
        }
    }, [contract, account, showSuccessAlert, showErrorAlert, addressListProduct]);


    // Función para que el cliente vea sus propias compras
    const viewCustomerOrders = useCallback(async () => {
        // Usamos la cuenta conectada como la dirección de consulta
        const customerAddress = account;
        let i = 0;
        let productsFound = false;
        let htmlOutput = "";

        if (!customerAddress || !contract) {
            return showErrorAlert("Conexión requerida", "Por favor, conecta tu billetera MetaMask.");
        }

        try {
            while (true) {
                try {
                    // Usamos la cuenta conectada en lugar de 'inaddress'
                    const userProducts = await contract.methods.productsByAddress(customerAddress, i).call();

                    const purchaseDate = formatTimestamp(userProducts.timestamp);
                    const priceInEther = weiToEther(userProducts.price);
                    const currentStatus = Number(userProducts.orderStatus.toString());
                    const statusText = ORDER_STATUSES[currentStatus] || "Desconocido";

                    // El cliente solo necesita ver su estado, no el botón de actualización
                    htmlOutput += `
                <div style="text-align: left; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <p><strong>Producto #${i + 1} (ID: ${userProducts.id.toString()})</strong></p>
                    <p><strong>Nombre:</strong> ${userProducts.name}</p>
                    <p><strong>Precio:</strong> ${priceInEther} ETH</p>
                    <p><strong>Fecha:</strong> ${purchaseDate}</p>
                    <p><strong>Estado:</strong> <span style="font-weight: bold; color: ${currentStatus < 3 ? 'orange' : 'green'};">${statusText}</span></p>
                </div>
            `;

                    productsFound = true;
                } catch (error) {
                    // Rompe el bucle cuando se llega al final del array
                    break;
                }
                i++;
            }

            if (productsFound) {
                showSuccessAlert(
                    `Tu Historial de Compras`,
                    `Se encontraron ${i} productos. <div style="max-height: 300px; overflow-y: auto;">${htmlOutput}</div>`
                );
            } else {
                showErrorAlert("No tienes compras", "Esta billetera no tiene compras registradas en el contrato.");
            }

        } catch (error) {
            showErrorAlert("Error de Consulta", "Verifica la conexión del contrato y tu billetera.");
            console.error(error);
        }
    }, [account, contract, showSuccessAlert, showErrorAlert, formatTimestamp, weiToEther]);

    // Muestra el prompt de selección de estado (usa useCallback para estabilidad)
    const showUpdateStatusPrompt = useCallback(async (customerAddress, productIndex, productName) => {
        const { value: statusSelection } = await MySwal.fire({
            title: `Actualizar Pedido #${productIndex + 1}: ${productName}`,
            input: 'select',
            inputOptions: ORDER_STATUSES,
            inputPlaceholder: 'Selecciona el nuevo estado',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debes seleccionar un estado!';
                }
            }
        });

        if (statusSelection) {
            const newStatusEnum = parseInt(statusSelection);
            // Llama a la versión estable de updateOrderStatus
            updateOrderStatus(customerAddress, productIndex, newStatusEnum);
        }
    }, [updateOrderStatus]);

    // Conexión al ámbito global (window) y limpieza
    // Esto debe estar después de la definición de showUpdateStatusPrompt
    useEffect(() => {
        if (contract) {
            // Adjuntamos la función para que el botón 'onclick' en el SweetAlert la encuentre
            window.updateStatusPrompt = showUpdateStatusPrompt;

            // Cleanup: Si el componente se desmonta, removemos la función del window
            return () => {
                delete window.updateStatusPrompt;
            };
        }
    }, [contract, showUpdateStatusPrompt]);

    // CAMBIO 3: Nuevo useEffect para leer la URL y prellenar los campos
    useEffect(() => {
        // 1. Obtener los parámetros de la URL
        const params = new URLSearchParams(window.location.search);

        const urlId = params.get('id');
        const urlName = params.get('nombre');
        const urlAmount = params.get('monto');

        // 2. Prellenar los estados de los inputs
        if (urlName) {
            setProductName(urlName);
        }

        // Asegurarse de que el monto sea un número válido antes de establecerlo
        if (urlAmount && !isNaN(parseFloat(urlAmount))) {
            setPaymentAmount(parseFloat(urlAmount));
        }

        // Establecer el ID del producto
        if (urlId && !isNaN(parseInt(urlId))) {
            setProductId(parseInt(urlId));
        }

    }, []); // Se ejecuta solo una vez al cargar

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
                    await contract.methods.transferFundsToOwner().send({ from: account });

                    showSuccessAlert(
                        "Transferencia Total Éxitosa",
                        `<p>Se transfirieron ${weiToEther(balanceContract)} ETH a tu billetera.</p>`
                    );

                    getContractBalanceMain();

                    // Recargar balance del Owner
                    if (owner === account) {
                        setTimeout(() => {
                            const web3Wallet = new Web3(window.ethereum);
                            web3Wallet.eth.getBalance(account)
                                .then(updatedBalance => setBalance(weiToEther(updatedBalance)))
                                .catch(error => console.error(error));
                        }, 3000);
                    }
                } else {
                    showErrorAlert("Sin Fondos", "El contrato no tiene balance para transferir.");
                }
            } catch (error) {
                showErrorAlert("Error de Transferencia", "Verifica la consola para detalles del fallo.");
                console.error(error);
            }
        }
    }

    // Función para procesar el pago
    const transferTo = async () => {
        if (!amount || !addressTo || amount <= 0) {
            return showErrorAlert("Datos incompletos", "Ingresa una cantidad válida y una dirección de destino.");
        }

        try {
            // Obtener la instancia del contrato
            let stringAmount = etherToWei(amount);
            await contract.methods.transferTo(stringAmount, addressTo).send({ from: account, gas: 500000 });

            showSuccessAlert(
                "Transferencia a Tercero Exitosa",
                `<p>Se enviaron ${amount} ETH a <strong>${addressTo.substring(0, 8)}...</strong></p>`
            );

            getContractBalanceMain();
        } catch (error) {
            showErrorAlert("Error de Transferencia", "Verifica que el contrato tenga suficientes fondos.");
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
                <>
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

                    <div className="section">
                        <h2>Consultar Historial de Compras</h2>
                        <div className="section-payment">
                            <p>Consulta el estado actual de los pedidos realizados con tu billetera </p>
                            {/* Botón para que el cliente vea sus propias compras */}
                            <button onClick={viewCustomerOrders} className="history-button">
                                Ver Mis Compras
                            </button>
                        </div>
                    </div>
                </>
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