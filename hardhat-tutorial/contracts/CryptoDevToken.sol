// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.10;
  //Importamos los archivos necesarios para la creacion del token
  import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./ICryptoDevs.sol";

  contract CryptoDevToken is ERC20, Ownable {
      
      // Precio que va a tener el token
      uint256 public constant tokenPrice = 0.001 ether;


      // Cada NFT que se posea dara a su propietario 10 tokens
      // Se representa como 10 * (10 ** 18)  debido a la no existencia de decimales en Solidity lo que hace que los tokens ERC20 se representen en la menor unidad posible
      // Que, por defecto, es 10^(-18). Por loq eu si posees una cantidad de (1)
      // es en realidad una cantidad igual a (10 ^ -18) tokens.
      // Poseer 1 token entero es igual a tener (10^18) tokens .
      // More information on this can be found in the Freshman Track Cryptocurrency tutorial.
      uint256 public constant tokensPerNFT = 10 * 10**18;
      
      
      // La cantidad maxima de tokens que pueden existir es de 10000
      uint256 public constant maxTotalSupply = 10000 * 10**18;


      // Instancia del contrato de los NFTs
      ICryptoDevs CryptoDevsNFT;
      
      // Mapeado que nos permite saber por ID del token, cuales han sido ya reclamados.
      mapping(uint256 => bool) public tokenIdsClaimed;


//Constructor del contrato que llama a su vez al constructor de ERC20, creando el token con el nombre especificado
      constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
          CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
      }

      /**
       * @dev Mints `amount` number of tokens
       * Requirements:
       * - `msg.value` should be equal or greater than the tokenPrice * amount
       */
      function mint(uint256 amount) public payable {
          // Cantidad de ether que es necesaria para que se pueda realizar minteo de los tokens
          uint256 _requiredAmount = tokenPrice * amount;
          require(msg.value >= _requiredAmount, "Ether sent is incorrect");
          // total tokens + amount <= 10000, para que no supere la cantidad máxima de tokens. Si lo supera, abortamos la transacción
          uint256 amountWithDecimals = amount * 10**18;
          require(
              (totalSupply() + amountWithDecimals) <= maxTotalSupply,
              "Exceeds the max total supply available."
          );
          // LLamada a la función interna del contrato ERC20 de Openzeppelin 
          _mint(msg.sender, amountWithDecimals);
      }

      /**
       * @dev Realiza el minteo de tokens en función a la cantidad de NFTs que se posean.
       * Requermientos:
       * Debes poseer algunos de los NFTs especificados
       * Los tokens correspondientes al NFT no deben de haber sido reclamados anteriormente.
       */
      function claim() public {
          address sender = msg.sender;
          // Obtiene la cantidad de NTFs que posee el la direccion del sender
          uint256 balance = CryptoDevsNFT.balanceOf(sender);
          // Si no tiene ninguno, revertimos la transaccion
          require(balance > 0, "You dont own any Crypto Dev NFT's");
          // Creamos variable encargada de llevar cuenta de los tokenIds que no han sido reclamados.
          uint256 amount = 0;
          // Segun la cnatidad de NFTs, buscamos sus IDs en el  `index` de la lista de tokens
          for (uint256 i = 0; i < balance; i++) {
              uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
              // Si  el token no se ha  reclamado aun, aumentamos la cantidad 
              if (!tokenIdsClaimed[tokenId]) {
                  amount += 1;
                  tokenIdsClaimed[tokenId] = true;
              }
          }
          // Si todos los tokens de los NFTs que posee el 'sender' ya han sido reclamados, revertimos la transaccion
          require(amount > 0, "You have already claimed all the tokens");
          // LLamada a la función interna del contrato ERC20 de Openzeppelin 
          // Minteamos la cantidad de  (amount * 10) tokens para cada NFT
          _mint(msg.sender, amount * tokensPerNFT);
      }

      /**
        * @dev Retira todo el ETH y tokens que han sido enviados al contrato
        * Requerimientos: 
        * La wallet conectada debe de ser la direccion del propietario del contrato
        */
      function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
      }

      // Function to receive Ether. msg.data must be empty
      receive() external payable {}

      // Fallback function is called when msg.data is not empty
      fallback() external payable {}
  }