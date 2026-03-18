# Ethereum Payment Gateway (Pasarela de Pago)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=flat&logo=ethereum&logoColor=white)](https://ethereum.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

Una solución profesional y descentralizada para el procesamiento de pagos utilizando la red Ethereum. Este proyecto integra un contrato inteligente robusto en Solidity con una interfaz moderna en React para facilitar transacciones seguras y transparentes.

## 🚀 Características Principales

### Smart Contract (Backend)
- **Procesamiento de Pagos:** Permite a los usuarios pagar por productos específicos enviando Ether al contrato.
- **Gestión de Inventario Digital:** Registra cada compra con un ID de producto y nombre vinculados a la dirección del comprador.
- **Control de Acceso:** Funciones administrativas protegidas por el modificador `isOwner` para una gestión segura.
- **Gestión de Fondos:** El propietario puede retirar el balance total del contrato o transferir montos específicos a otras billeteras.
- **Transparencia:** Emisión de eventos `PaymentReceived` para un seguimiento en tiempo real en la blockchain.

### Interfaz de Usuario (Frontend)
- **Conexión con MetaMask:** Integración fluida con proveedores Web3 para la gestión de cuentas.
- **Panel de Usuario:** Formulario intuitivo para realizar pagos ingresando el nombre del producto y el monto en ETH.
- **Panel de Administración:** Vista exclusiva para el propietario del contrato que permite visualizar el balance del contrato y gestionar transferencias.
- **Historial de Compras:** Consulta de productos adquiridos por direcciones específicas.

## 🛠️ Tecnologías Utilizadas

- **Blockchain:** Solidity (Smart Contracts), Truffle Suite, Web3.js.
- **Frontend:** React.js, Vite.
- **Billetera:** MetaMask.
- **Lenguaje:** JavaScript (ES6+), Solidity (0.8.x).

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/) (v14 o superior)
- [Truffle](https://www.trufflesuite.com/truffle)
- [Ganache](https://www.trufflesuite.com/ganache) o una red de prueba de Ethereum.
- Extensión de [MetaMask](https://metamask.io/) en el navegador.

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/javierrojas7/pasarela-de-pago-ethereum.git
cd pasarela-de-pago-ethereum
```

### 2. Configuración del Smart Contract
Navega al directorio del backend e instala las dependencias (si las hay) o compila los contratos:
```bash
cd pasarela_backend_Ethereum
truffle compile
truffle migrate --reset
```
*Nota: Asegúrate de tener Ganache o tu red local corriendo en el puerto configurado en `truffle-config.js`.*

### 3. Configuración del Frontend
Instala las dependencias de la interfaz de React:
```bash
cd ../pasarela_interfaz_react/interfaz-react
npm install
```

### 4. Vincular el Contrato con el Frontend
Actualiza la dirección del contrato desplegado en el archivo `src/pages/PaymentGateway.js`:
```javascript
const contractInstance = new web3Contract.eth.Contract(abi, 'TU_DIRECCION_DE_CONTRATO_AQUI');
```

## 🏃 Ejecución

Para iniciar la aplicación de React:
```bash
npm start
```
La aplicación estará disponible en `http://localhost:3000`.

## 📂 Estructura del Proyecto

```text
.
├── pasarela_backend_Ethereum/    # Contratos inteligentes y configuración de Truffle
│   ├── contracts/                # Archivos .sol (PaymentContract, Airline, Migrations)
│   ├── migrations/               # Scripts de despliegue
│   └── truffle-config.js         # Configuración de la red Ethereum
└── pasarela_interfaz_react/      # Aplicación frontend en React
    └── interfaz-react/
        ├── src/
        │   ├── pages/            # Componentes principales (PaymentGateway.js)
        │   └── contractAbi.js    # ABI del contrato inteligente
        └── package.json          # Dependencias y scripts
```

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Javier Rojas**
- GitHub: [@javierrojas7](https://github.com/javierrojas7)

---
*Desarrollado con ❤️ para la comunidad de Ethereum.*
