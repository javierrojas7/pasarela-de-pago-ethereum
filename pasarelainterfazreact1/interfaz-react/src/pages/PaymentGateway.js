"use client"

import Web3 from "web3"
import { useState, useEffect, useCallback } from "react"
import abi from "./contractAbi"
import "./styles.css"

// IMPORTAR SWEETALERT2
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
const MySwal = withReactContent(Swal)

// =========================================================
// === NUEVO: Mapeo de Estados de Pedido (Solidity Enum) ===
// =========================================================
const ORDER_STATUSES = {
  0: "PENDIENTE",
  1: "EN_PROCESO",
  2: "ENVIADO",
  3: "ENTREGADO",
}

// =========================================================
// === NUEVO: Función de ayuda para formatear el Timestamp ===
// =========================================================
function formatTimestamp(timestampInSeconds) {
  const numericTimestamp = Number(timestampInSeconds.toString())
  const date = new Date(numericTimestamp * 1000)

  if (isNaN(numericTimestamp) || numericTimestamp === 0) {
    return "Fecha no disponible o inválida"
  }

  return date.toLocaleString()
}

// =========================================================
// === NUEVO: Función de ayuda para convertir Wei a Ether ===
// =========================================================
function weiToEther(inWei) {
  const ether = Web3.utils.fromWei(inWei.toString(), "ether")
  return ether
}

// =========================================================
// === NUEVO: Función de ayuda para convertir Ether a Wei ===
// =========================================================
function etherToWei(inWei) {
  const ether = Web3.utils.toWei(inWei.toString(), "ether")
  return ether
}

const PaymentGateway = () => {
  //cuenta que se conecta a react
  const [account, setAccount] = useState("")
  const [balance, setBalance] = useState("")
  //billetera conectada
  const [active, setActive] = useState(false)
  //contrato para pagos
  const [contract, setContract] = useState(null)
  //precio para pagar y producto a comprar
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [productName, setProductName] = useState("")
  //dir y numero para saber que compro
  const [inaddress, setAddress] = useState("")
  //funcion traer producto comprado
  const [owner, setOwner] = useState("")
  //obtener fondos del contrato
  const [balanceContract, setBalanceContract] = useState("")
  // transferir dinero a
  const [addressTo, setAddressTo] = useState("")
  const [amount, setAmount] = useState("")

  // CAMBIO 1: Nuevo estado para almacenar el ID del producto de la URL
  const [productId, setProductId] = useState(1)

  const [configProductId, setConfigProductId] = useState(1);
  const [configPriceEth, setConfigPriceEth] = useState(0.5);

  const web3Contract = new Web3("http://localhost:8545")

  // --- NUEVA FUNCIÓN PARA MOSTRAR ALERTA DE ÉXITO ---
  const showSuccessAlert = (title, htmlContent) => {
    MySwal.fire({
      icon: "success",
      title: title,
      html: htmlContent,
      showConfirmButton: false,
      timer: 4000,
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        htmlContainer: "my-swal-html",
      },
      background: "#fff",
    })
  }

  // --- NUEVA FUNCIÓN PARA MOSTRAR ALERTA DE ERROR ---
  const showErrorAlert = (title, text) => {
    MySwal.fire({
      icon: "error",
      title: title,
      text: text,
      customClass: {
        popup: "my-swal-error-popup",
      },
    })
  }

  //funcion para conectar la billetera
  const handleConnect = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        const web3Wallet = new Web3(window.ethereum)
        const accounts = await web3Wallet.eth.getAccounts()
        const currentAccount = accounts[0]
        setAccount(currentAccount)
        const currentBalance = await web3Wallet.eth.getBalance(currentAccount)
        const value = weiToEther(currentBalance.toString())
        setBalance(value)
        setActive(true)

        // 🎯 CAMBIO CLAVE: AGREGAR SWEETALERT DE ÉXITO AQUÍ
        showSuccessAlert(
          "¡Conexión Exitosa!",
          `<p>Billetera conectada: <strong>${currentAccount.substring()}</strong></p>
           <p>Balance actual: <strong>${value} ETH</strong></p>`
        );

      } catch (error) {
        showErrorAlert("Conexión Fallida", "Asegúrate de que MetaMask esté instalado y conectado a la red local.")
        console.error(error)
      }
    } else {
      showErrorAlert("Error", "Web3 provider (MetaMask) no encontrado.")
      console.error("Web3 provider not found")
    }
  }

  const handleDisconnect = () => {
    setAccount('');
    setBalance('');
    setActive(false);
    showSuccessAlert("Desconectado", "Tu billetera se ha desconectado correctamente.");
    // No necesitamos resetear 'contract' ni 'owner' para evitar errores de re-renderizado
  };

  // Función para cargar el contrato y los datos
  const loadContractData = async () => {
    try {
      const contractInstance = new web3Contract.eth.Contract(abi, "0xea363A6c4e1a98Cbad8c565d73b30E7B1d237cFd")
      setContract(contractInstance)
      const contractOwner = await contractInstance.methods.owner().call()
      setOwner(contractOwner)
    } catch (error) {
      console.error(error)
    }
  }

  // Función para procesar el pago
  const processPayment = async () => {
    if (paymentAmount <= 0 || !productName) {
      return showErrorAlert("Datos incompletos", "Debes ingresar un nombre de producto y una cantidad mayor a 0.")
    }

    try {
      const paymentValue = etherToWei(paymentAmount.toString())
      await contract.methods.pay(productId, productName).send({
        from: account,
        value: paymentValue,
        gas: 500000,
      })

      showSuccessAlert(
        "¡Pago Exitoso!",
        "<p><strong>Producto:</strong> " +
        productName +
        "</p><p><strong>Monto Pagado:</strong> " +
        paymentAmount +
        " ETH</p>",
      )

      setTimeout(() => {
        const web3Wallet = new Web3(window.ethereum)
        web3Wallet.eth
          .getBalance(account)
          .then((updatedBalance) => {
            console.log(weiToEther(updatedBalance))
            setBalance(weiToEther(updatedBalance))
          })
          .catch((error) => {
            console.error(error)
            console.error("Error al recargar balance:", error)
          })
      }, 3000)

      getContractBalanceMain()
      console.log("pago exitoso")
    } catch (error) {
      const userDenied = error.message.includes("User denied transaction signature")
      showErrorAlert(
        "Transacción Fallida",
        userDenied ? "Has rechazado la transacción en MetaMask." : "Ocurrió un error en el pago.",
      )
      console.error(error)
    }
  }

  // traer dir que compro algun producto por numero en el array
  const getAllAddress = async () => {
    let i = 0
    let addressesFound = false
    let htmlOutput = "<ul>"

    try {
      while (true) {
        const address = await contract.methods.getAddress(i).call()

        if (address === "0x0000000000000000000000000000000000000000") {
          break
        } else {
          htmlOutput += "<li>" + address + "</li>"
          addressesFound = true
          console.log("Dirección " + (i + 1) + ": " + address)
        }
        i++
      }

      htmlOutput += "</ul>"

      if (addressesFound) {
        showSuccessAlert("Direcciones Registradas", "Se encontraron " + i + " direcciones. <br/> " + htmlOutput)
      } else {
        showErrorAlert("No se encontraron direcciones", "El contador de compras es cero o no hay registros.")
      }
    } catch (error) {
      showErrorAlert("Error de Consulta", "No se pudo obtener la lista de direcciones.")
      console.error(error)
    }
  }

  const addressListProduct = useCallback(async () => {
    let i = 0
    let productsFound = false
    let htmlOutput = ""

    try {
      if (!inaddress) {
        return showErrorAlert("Dirección requerida", "Por favor, ingresa una dirección para buscar compras.")
      }

      while (true) {
        try {
          const userProducts = await contract.methods.productsByAddress(inaddress, i).call()
          const purchaseDate = formatTimestamp(userProducts.timestamp)
          const priceInWeiBN = userProducts.price
          const priceInEther = weiToEther(priceInWeiBN)
          const currentStatus = Number(userProducts.orderStatus.toString())
          const statusText = ORDER_STATUSES[currentStatus] || "Desconocido"
          const statusColor = currentStatus < 3 ? "orange" : "green"

          htmlOutput +=
            '<div style="text-align: left; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">'
          htmlOutput += "<p><strong>Producto #" + (i + 1) + " (ID: " + userProducts.id.toString() + ")</strong></p>"
          htmlOutput += "<p><strong>Nombre:</strong> " + userProducts.name + "</p>"
          htmlOutput += "<p><strong>Precio:</strong> " + priceInEther + " ETH</p>"
          htmlOutput += "<p><strong>Fecha:</strong> " + purchaseDate + "</p>"
          htmlOutput +=
            '<p><strong>Estado:</strong> <span style="font-weight: bold; color: ' +
            statusColor +
            ';">' +
            statusText +
            "</span></p>"
          htmlOutput += "</div>"

          productsFound = true
        } catch (error) {
          break
        }
        i++
      }

      if (productsFound) {
        const result = await MySwal.fire({
          title: "Compras de " + inaddress.substring(0, 8) + "...",
          html:
            "Se encontraron " +
            i +
            ' productos. <div style="max-height: 300px; overflow-y: auto;">' +
            htmlOutput +
            "</div>",
          showCancelButton: true,
          confirmButtonText: "Actualizar Estado de un Pedido",
          cancelButtonText: "Cerrar",
          customClass: {
            popup: "my-swal-popup",
            title: "my-swal-title",
            htmlContainer: "my-swal-html",
          },
        })

        if (result.isConfirmed) {
          const inputResult = await MySwal.fire({
            title: "Actualizar Estado",
            input: "number",
            inputLabel: "Ingresa el número de producto (1-" + i + ")",
            inputPlaceholder: "1",
            showCancelButton: true,
            inputValidator: (value) => {
              const num = Number.parseInt(value)
              if (!value || num < 1 || num > i) {
                return "Debes ingresar un número entre 1 y " + i
              }
            },
          })

          if (inputResult.value) {
            const index = Number.parseInt(inputResult.value) - 1
            const userProducts = await contract.methods.productsByAddress(inaddress, index).call()
            await showUpdateStatusPrompt(inaddress, index, userProducts.name)
          }
        }
      } else {
        showErrorAlert("No se encontraron productos", "La dirección " + inaddress + " no tiene compras registradas.")
      }
    } catch (error) {
      showErrorAlert("Error de Consulta", "Verifica la dirección y la conexión del contrato.")
      console.error(error)
    }
  }, [contract, inaddress])

  const updateOrderStatus = useCallback(
    async (customerAddress, productIndex, newStatusEnum) => {
      try {
        await contract.methods
          .updateOrderStatus(customerAddress, productIndex, newStatusEnum)
          .send({ from: account, gas: 500000 })

        showSuccessAlert(
          "Estado Actualizado",
          "<p>El pedido #" +
          (productIndex + 1) +
          " del cliente <strong>" +
          customerAddress.substring(0, 8) +
          "...</strong> ha sido actualizado a <strong>" +
          ORDER_STATUSES[newStatusEnum] +
          "</strong>.</p>",
        )

        addressListProduct()
      } catch (error) {
        showErrorAlert("Error al Actualizar", "Verifica que eres el Owner y que la red esté activa.")
        console.error(error)
      }
    },
    [contract, account, addressListProduct],
  )

  const viewCustomerOrders = useCallback(async () => {
    const customerAddress = account
    let i = 0
    let productsFound = false
    let htmlOutput = ""

    if (!customerAddress || !contract) {
      return showErrorAlert("Conexión requerida", "Por favor, conecta tu billetera MetaMask.")
    }

    try {
      while (true) {
        try {
          const userProducts = await contract.methods.productsByAddress(customerAddress, i).call()
          const purchaseDate = formatTimestamp(userProducts.timestamp)
          const priceInEther = weiToEther(userProducts.price)
          const currentStatus = Number(userProducts.orderStatus.toString())
          const statusText = ORDER_STATUSES[currentStatus] || "Desconocido"
          const statusColor = currentStatus < 3 ? "orange" : "green"

          htmlOutput +=
            '<div style="text-align: left; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">'
          htmlOutput += "<p><strong>Producto #" + (i + 1) + " (ID: " + userProducts.id.toString() + ")</strong></p>"
          htmlOutput += "<p><strong>Nombre:</strong> " + userProducts.name + "</p>"
          htmlOutput += "<p><strong>Precio:</strong> " + priceInEther + " ETH</p>"
          htmlOutput += "<p><strong>Fecha:</strong> " + purchaseDate + "</p>"
          htmlOutput +=
            '<p><strong>Estado:</strong> <span style="font-weight: bold; color: ' +
            statusColor +
            ';">' +
            statusText +
            "</span></p>"
          htmlOutput += "</div>"

          productsFound = true
        } catch (error) {
          break
        }
        i++
      }

      if (productsFound) {
        // === CAMBIO CLAVE: Usar MySwal.fire() directamente sin timer ===
        MySwal.fire({
          icon: "success", // Puedes mantener el icono de éxito
          title: "Tu Historial de Compras",
          html:
            "Se encontraron " +
            i +
            ' productos. <div style="max-height: 300px; overflow-y: auto;">' +
            htmlOutput +
            "</div>",

          // Propiedades para mantener la ventana abierta
          showConfirmButton: true,
          confirmButtonText: "Entendido",
          timer: undefined, // Eliminar el temporizador

          // Reutilizar tus clases de estilo de lujo
          customClass: {
            popup: "my-swal-popup",
            title: "my-swal-title",
            htmlContainer: "my-swal-html",
            confirmButton: "my-swal-confirm-button",
          },
        })
      } else {
        showErrorAlert("No tienes compras", "Esta billetera no tiene compras registradas en el contrato.")
      }
    } catch (error) {
      showErrorAlert("Error de Consulta", "Verifica la conexión del contrato y tu billetera.")
      console.error(error)
    }
  }, [account, contract])

  const showUpdateStatusPrompt = useCallback(
    async (customerAddress, productIndex, productName) => {
      const result = await MySwal.fire({
        title: "Actualizar Pedido #" + (productIndex + 1) + ": " + productName,
        input: "select",
        inputOptions: ORDER_STATUSES,
        inputPlaceholder: "Selecciona el nuevo estado",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value) {
            return "¡Debes seleccionar un estado!"
          }
        },
      })

      if (result.value) {
        const newStatusEnum = Number.parseInt(result.value)
        updateOrderStatus(customerAddress, productIndex, newStatusEnum)
      }
    },
    [updateOrderStatus],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlId = params.get("id")
    const urlName = params.get("nombre")
    const urlAmount = params.get("monto")

    if (urlName) {
      setProductName(urlName)
    }

    if (urlAmount && !isNaN(Number.parseFloat(urlAmount))) {
      setPaymentAmount(Number.parseFloat(urlAmount))
    }

    if (urlId && !isNaN(Number.parseInt(urlId))) {
      setProductId(Number.parseInt(urlId))
    }
  }, [])

  useEffect(() => {
    if (active) {
      console.log("load contract")
      loadContractData()
    }
  }, [active])

  useEffect(() => {
    getContractBalanceMain()
  }, [owner])

  const getContractBalanceMain = async () => {
    if (owner === account) {
      try {
        if (contract != null) {
          const contractBalance = await contract.methods.getContractBalance().call({ from: account })
          setBalanceContract(contractBalance)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  const trasnferAllMoneyToOwner = async () => {
    if (owner === account) {
      try {
        if (contract != null && balanceContract > 0) {
          await contract.methods.transferFundsToOwner().send({ from: account })

          showSuccessAlert(
            "Transferencia Total Éxitosa",
            "<p>Se transfirieron " + weiToEther(balanceContract) + " ETH a tu billetera.</p>",
          )

          getContractBalanceMain()

          if (owner === account) {
            setTimeout(() => {
              const web3Wallet = new Web3(window.ethereum)
              web3Wallet.eth
                .getBalance(account)
                .then((updatedBalance) => setBalance(weiToEther(updatedBalance)))
                .catch((error) => console.error(error))
            }, 3000)
          }
        } else {
          showErrorAlert("Sin Fondos", "El contrato no tiene balance para transferir.")
        }
      } catch (error) {
        showErrorAlert("Error de Transferencia", "Verifica la consola para detalles del fallo.")
        console.error(error)
      }
    }
  }

  const transferTo = async () => {
    if (!amount || !addressTo || amount <= 0) {
      return showErrorAlert("Datos incompletos", "Ingresa una cantidad válida y una dirección de destino.")
    }

    try {
      const stringAmount = etherToWei(amount)
      await contract.methods.transferTo(stringAmount, addressTo).send({ from: account, gas: 500000 })

      showSuccessAlert(
        "Transferencia a Tercero Exitosa",
        "<p>Se enviaron " + amount + " ETH a <strong>" + addressTo.substring(0, 8) + "...</strong></p>",
      )

      getContractBalanceMain()
    } catch (error) {
      showErrorAlert("Error de Transferencia", "Verifica que el contrato tenga suficientes fondos.")
      console.error("Error transferring funds:", error)
    }
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

            <h2 className="info-title" style={{ marginTop: '20px' }}>Configuración de Precios</h2>
            <div className="section-transfer-to">
              <div className="input-container">
                {/* Input para ID del Producto */}
                <label>ID del Producto:</label>
                <input
                  type="number"
                  value={configProductId}
                  onChange={(e) => setConfigProductId(Number(e.target.value))}
                  min="1"
                />
                {/* Input para Precio en ETH */}
                <label>Precio del Producto (ETH):</label>
                <input
                  type="number"
                  value={configPriceEth}
                  onChange={(e) => setConfigPriceEth(Number(e.target.value))}
                  min="0.01"
                  step="any"
                />
              </div>
              <button onClick={setProductPriceOnContract}>
                Establecer Precio en Contrato
              </button>
            </div>


            <h2 className="info-title">tranferir fondos</h2>
            <div className="section-transfer-to">
              <div className="input-container">
                <label>Enviar a la dirección:</label>
                <input type="text" value={addressTo} onChange={(e) => setAddressTo(e.target.value)} />
                <label>Cantidad a transferir (ETH):</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <button onClick={transferTo}>Transferir fondos</button>
            </div>
            <div className="section-transfer-all">
              <button onClick={trasnferAllMoneyToOwner}>Transferir todo el dinero</button>
            </div>

          </div>
        </div>
      )
    } else {
      return null
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
                {/* <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} /> */}
                <input
                  type="text"
                  value={productName}
                  // 🎯 CAMBIO 1: Deshabilitar la edición del Nombre
                  disabled
                  readOnly
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div className="input-container">
                <label>Cantidad a pagar (ETH):</label>
                {/* <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /> */}
                <input
                  type="number"
                  value={paymentAmount}
                  // 🎯 CAMBIO 2: Deshabilitar la edición del Monto
                  disabled
                  readOnly
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <button onClick={processPayment}>Pagar</button>
            </div>
          </div>

          <div className="section">
            <h2>Consultar Historial de Compras</h2>
            <div className="section-payment">
              <p>Consulta el estado actual de los pedidos realizados con tu billetera </p>
              <button onClick={viewCustomerOrders} className="history-button">
                Ver Mis Compras
              </button>
            </div>
          </div>
        </>
      )
    } else {
      return null
    }
  }

  // Función para establecer el precio de un producto (Solo Owner)
  const setProductPriceOnContract = async () => {
    // 🎯 CAMBIO: Usar los estados conectados a los inputs
    const productIdToSet = configProductId;
    const amountInEther = configPriceEth;

    if (owner !== account) {
      return showErrorAlert("Acceso Denegado", "Solo el propietario del contrato puede establecer precios.");
    }
    // Añadida validación de ID para asegurarnos de que es un número positivo
    if (productIdToSet <= 0 || isNaN(Number(productIdToSet))) {
      return showErrorAlert("ID Inválido", "El ID del producto debe ser un número positivo.");
    }
    if (amountInEther <= 0 || isNaN(Number(amountInEther))) {
      return showErrorAlert("Monto Inválido", "El precio debe ser mayor a cero.");
    }

    try {
      const priceInWei = etherToWei(amountInEther.toString());

      await contract.methods.setProductPrice(productIdToSet, priceInWei).send({
        from: account,
        gas: 300000,
      });

      showSuccessAlert(
        "Precio Establecido",
        `<p>El Producto ID <strong>${productIdToSet}</strong> se ha configurado a <strong>${amountInEther} ETH</strong>.</p>`
      );

    } catch (error) {
      showErrorAlert("Fallo en Configuración", "Error al enviar la transacción. Asegúrate de que el precio no sea cero.");
      console.error("Error setting product price:", error);
    }
  };

  return (
    <div>
      <div>
        <h1>ETHEREUM</h1>
        <div className="section">
          <div className="logo-container">
            <img
              src={"/logo512.png"} // Apunta directamente al archivo en /public
              alt="Ethereum Logo"
              className="ethereum-logo"
            />
          </div>
        </div>
        <div className="section-balance-account">
          <p>Cuenta: {account}</p>
          <p>Balance: {balance}</p>
          <div className="section-balance-account">
            <p>Cuenta: {account || 'No conectado'}</p>
            <p>Balance: {balance || '0.00'} ETH</p>

            {/* 🎯 BOTÓN DINÁMICO */}
            <button
              onClick={active ? handleDisconnect : handleConnect}
              // Usamos una clase diferente para el botón de desconectar
              className={active ? 'disconnect-button' : ''}
            >
              {active ? 'Desconectar' : 'Conectar'}
            </button>
          </div>
        </div>
        {Payment()}
        {Admin()}
      </div>
    </div>
  )
}

export default PaymentGateway
