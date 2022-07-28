const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  // Direccion del contrato de NFT que vamos a utilizar
  const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;

  /*
    Una ContractFactory en ethers.js es una abstracción utilizada para el despliegue de nuevos smart contrtacts,
    asi que  cryptoDevsTokenContract es una fabrica de instancias del contrato de CryptoDevToken.
    */
  const cryptoDevsTokenContract = await ethers.getContractFactory(
    "CryptoDevToken"
  );

  // Desplegamos el contrato
  const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(
    cryptoDevsNFTContract
  );

  // Imprimimos en la terminal la direccion del contrato
  console.log(
    "Crypto Devs Token Contract Address:",
    deployedCryptoDevsTokenContract.address
  );
}

// LLamamos la funcion main, comprobando si se produce algun error.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });