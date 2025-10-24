// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract PaymentContract {
    address public owner;
    uint256 public count;

    // 🎯 MEJORA DE SEGURIDAD: Mapeo de precios para validación.
    // Solo los productos con un precio definido aquí se pueden comprar.
    mapping(uint256 => uint256) public productPrices;

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

    // Eliminamos 'mapping(address => uint256) private balances' por ser redundante y usar gas.

    constructor() {
        owner = msg.sender;
        count = 0;
        // Opcional: Establecer precios iniciales si lo necesitas.
        // productPrices[99] = 2 ether;
    }

    // 🎯 NUEVA FUNCIÓN: Solo el owner puede establecer o actualizar precios.
    function setProductPrice(uint256 idProduct, uint256 priceInWei) public isOwner {
        require(idProduct > 0, "ID invalido");
        require(priceInWei > 0, "El precio debe ser mayor a cero");
        productPrices[idProduct] = priceInWei;
    }

    event PaymentReceived(address indexed sender, uint256 amount, uint256 idProduct, string name);
    event OrderStatusUpdated(address indexed customer, uint256 productIndex, Status newStatus);


    // 🎯 CAMBIO CRÍTICO: Valida msg.value contra el precio fijo del producto.
    // 🎯 MEJORA: 'name' usa 'calldata' para ahorrar gas.
    function pay(uint256 idProduct, string calldata name) public payable {
        // 1. CHEQUEO CRÍTICO DE SEGURIDAD: Verifica si el precio está configurado.
        uint256 requiredPrice = productPrices[idProduct];
        require(requiredPrice > 0, "El ID del producto no existe o no tiene precio asignado.");

        // 2. CHEQUEO CRÍTICO DE SEGURIDAD: Verifica que el monto pagado sea igual al precio requerido.
        require(msg.value == requiredPrice, "Monto incorrecto. Pagar el precio exacto.");

        // El resto de la lógica de pago es segura y se mantiene
        if (productsByAddress[msg.sender].length == 0) {
            getAddress[count] = msg.sender;
            count++;
        }

        Product memory productIn = Product(
            idProduct,
            name,
            msg.value, // El precio pagado (que ya sabemos que es el correcto)
            block.timestamp,
            Status.PENDIENTE
        );
        productsByAddress[msg.sender].push(productIn);

        emit PaymentReceived(msg.sender, msg.value, idProduct, name);
    }

    // 4. NUEVA FUNCIÓN: Permite al owner actualizar el estado de un pedido específico
    // 🎯 MEJORA: 'name' usa 'calldata' para ahorrar gas.
    function updateOrderStatus(
        address customerAddress,
        uint256 productIndex,
        Status newStatus
    ) public isOwner {
        // Verifica que el índice del producto exista en el array de la dirección
        require(productIndex < productsByAddress[customerAddress].length, "Indice de producto invalido");

        // 🎯 MEJORA DE FLUJO: Asegura que el estado solo pueda avanzar (o ser igual).
        // Si quieres permitir que un estado retroceda, puedes eliminar este require.
        require(newStatus >= productsByAddress[customerAddress][productIndex].orderStatus, "El nuevo estado no puede ser anterior al actual");

        // Actualiza el estado del pedido específico
        productsByAddress[customerAddress][productIndex].orderStatus = newStatus;

        emit OrderStatusUpdated(customerAddress, productIndex, newStatus);
    }

    // Obtener el balance total del contrato
    function getContractBalance() public isOwner view returns (uint) {
        return address(this).balance;
    }

    // 🎯 CAMBIO CRÍTICO DE SEGURIDAD: Uso de 'call' con verificación de éxito para evitar re-entrancy
    function transferFundsToOwner() public isOwner {
        address payable ownerWallet = payable(owner);
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract has no balance to transfer");

        // Usamos .call con value para enviar Ether.
        // Este es el método preferido en Solidity moderno para transferir Ether,
        // ya que permite una gestión de errores más clara.
        (bool success, ) = ownerWallet.call{value: contractBalance}("");
        require(success, "Transferencia al owner fallida");
    }

    // Se elimina la función getBalanceEachAddress ya que el mapeo 'balances' fue eliminado.
    // El balance total de gasto de un cliente se puede calcular sumando los precios
    // de su array 'productsByAddress' en la aplicación de React.

    // Transferir del contrato a otra billetera
    function transferTo(uint amount, address to) public isOwner {
        require(address(this).balance >= amount);
        require(to != address(0), "Direccion no valida");
        // Usamos .call con value en lugar de .transfer() para consistencia y seguridad moderna.
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transferencia fallida");
    }

    // El propietario
    modifier isOwner() {
        require(msg.sender == owner, "Solo el propietario puede llamar esta funcion");
        _;
    }
}
