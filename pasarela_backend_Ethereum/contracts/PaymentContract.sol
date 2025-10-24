// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract PaymentContract {
    address public owner;
    uint256 public count;

    // RESTAURADO: El mapping para el balance total gastado por cada dirección
    mapping(address => uint256) private balances;

    // ELIMINADO: Se elimina 'mapping(uint256 => uint256) public productPrices;'
    // ELIMINADO: Se elimina la función 'setProductPrice'

    enum Status {
        PENDIENTE,  // 0: Pago recibido, esperando procesamiento
        EN_PROCESO, // 1: Preparación del pedido
        ENVIADO,    // 2: Producto enviado al cliente
        ENTREGADO   // 3: Cliente ha confirmado recepción
    }

    struct Product {
        uint256 id;
        string name;
        uint256 price;
        uint256 timestamp;
        Status orderStatus;
    }

    // Las direcciones que van comprando en orden
    mapping(uint256 => address) public getAddress;
    // Los productos comprados por cada dirección
    mapping(address => Product[]) public productsByAddress;

    constructor() {
        owner = msg.sender;
        count = 0;
    }

    event PaymentReceived(address indexed sender, uint256 amount, uint256 idProduct, string name);
    event OrderStatusUpdated(address indexed customer, uint256 productIndex, Status newStatus);

    // RESTAURADO: Función 'pay' sin verificación de precio estricta.
    // MEJORA: Se usa 'calldata' y se mantiene el chequeo básico de valor > 0.
    function pay(uint256 idProduct, string calldata name) public payable {
        // Mantiene el chequeo básico: el cliente debe enviar algo.
        require(msg.value > 0, "Payment amount must be greater than zero");

        // RESTAURADO: Acumula el balance total gastado por el cliente
        balances[msg.sender] += msg.value;

        if (productsByAddress[msg.sender].length == 0) {
            getAddress[count] = msg.sender;
            count++;
        }

        Product memory productIn = Product(
            idProduct,
            name,
            msg.value, // El precio es el valor enviado por el cliente (msg.value)
            block.timestamp,
            Status.PENDIENTE
        );
        productsByAddress[msg.sender].push(productIn);

        emit PaymentReceived(msg.sender, msg.value, idProduct, name);
    }

    // 4. FUNCIÓN DE ADMINISTRACIÓN DE PEDIDOS (se mantiene la mejora de flujo)
    function updateOrderStatus(
        address customerAddress,
        uint256 productIndex,
        Status newStatus
    ) public isOwner {
        require(productIndex < productsByAddress[customerAddress].length, "Indice de producto invalido");
        // Mantiene la mejora: asegura que el estado solo pueda avanzar (o ser igual).
        require(newStatus >= productsByAddress[customerAddress][productIndex].orderStatus, "El nuevo estado no puede ser anterior al actual");

        productsByAddress[customerAddress][productIndex].orderStatus = newStatus;

        emit OrderStatusUpdated(customerAddress, productIndex, newStatus);
    }

    // Obtener el balance total del contrato
    function getContractBalance() public isOwner view returns (uint) {
        return address(this).balance;
    }

    // RESTAURADO: El balance que ha gastado cada billetera
    function getBalanceEachAddress(address account) public view isOwner returns (uint256) {
        return balances[account];
    }
    
    // MEJORA DE SEGURIDAD MANTENIDA: Uso de 'call' con verificación de éxito (anti-reentrancy)
    function transferFundsToOwner() public isOwner {
        address payable ownerWallet = payable(owner);
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract has no balance to transfer");

        // Se usa .call con value para una transferencia segura
        (bool success, ) = ownerWallet.call{value: contractBalance}("");
        require(success, "Transferencia al owner fallida");
    }

    // MEJORA DE SEGURIDAD MANTENIDA: Uso de 'call' con verificación de éxito (anti-reentrancy)
    function transferTo(uint amount, address to) public isOwner {
        require(address(this).balance >= amount);
        require(to != address(0), "Direccion no valida");
        // Se usa .call con value para una transferencia segura
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transferencia fallida");
    }

    // El propietario
    modifier isOwner() {
        require(msg.sender == owner, "Solo el propietario puede llamar esta funcion");
        _;
    }
}
