🚀 Pasarela de Pago Ethereum (React + Truffle)
Este proyecto implementa una pasarela de pago descentralizada utilizando React para el frontend y contratos inteligentes de Solidity/Truffle para el backend en la blockchain de Ethereum.

⚙️ Prerrequisitos
Asegúrate de tener instalado lo siguiente en tu sistema:

Node.js y npm: Se recomienda usar la versión LTS (actualmente v20.x o v22.x).

nvm (Node Version Manager): Altamente recomendado para gestionar las versiones de Node.

Ganache: Necesario para correr la red blockchain local de Ethereum.

MetaMask: Extensión de navegador configurada para conectarse a localhost:8545.

🛠️ Configuración e Instalación
1. Preparar el Entorno Node.js
Asegúrate de usar una versión compatible y reinstala las herramientas esenciales (Truffle y Ganache) bajo esa versión.

Bash

# Cambiar a la versión LTS (se recomienda 20.x)
nvm use 20

# Instalar Truffle globalmente para la versión actual de Node
npm install -g truffle

# Instalar Ganache CLI globalmente para la versión actual de Node
npm install -g ganache
2. Instalación de Dependencias de React
Navega a la carpeta de tu frontend e instala todas las dependencias:

Bash

cd pasarela_interfaz_react/interfaz-react
npm install
▶️ Instrucciones para Correr el Proyecto
El proyecto requiere dos terminales activas simultáneamente para la Blockchain (Ganache) y el Frontend (React).

Paso 1: Levantar el Backend de Ethereum (Blockchain)
Abre la Terminal 1 y corre Ganache. Esto inicia la red de desarrollo local en el puerto 8545.

Bash

# Asegúrate de que no haya otro proceso usando el puerto 8545
# Si falla, puedes usar: ganache --port 7545
ganache
Paso 2: Compilar y Desplegar Contratos
Abre la Terminal 2 y navega a la carpeta del backend.

Bash

cd pasarela_backend_Ethereum
Compilar Contratos:

Bash

truffle compile
Desplegar Contratos (Migración): Esto despliega el PaymentContract a la red de Ganache (Terminal 1) y genera las direcciones y ABIs en build/contracts/.

Bash

truffle migrate
Nota: Si cambiaste el puerto de Ganache, asegúrate de actualizar el puerto en truffle-config.js antes de migrar.

Paso 3: Configurar MetaMask (Clave Privada)
Para poder firmar transacciones con fondos, debes importar la clave privada de la primera cuenta de Ganache (la que tiene 1000 ETH y desplegó los contratos) en tu MetaMask:

Copia la clave privada de la Cuenta (0) de la Terminal 1 (Ganache).

En MetaMask, selecciona tu Red Localhost:8545.

Haz clic en el ícono de perfil > Importar Cuenta y pega la clave privada.

Paso 4: Iniciar el Frontend de React
Abre la Terminal 3 y navega a la carpeta del frontend.

Bash

cd pasarela_interfaz_react/interfaz-react
npm start
El navegador se abrirá en http://localhost:3000/. Tu aplicación de React ahora puede conectarse a MetaMask y usar los artefactos de build/contracts para interactuar con los contratos desplegados en Ganache.




http://localhost:3000/?id=99&nombre=Suscripcion-Anual&monto=2.5