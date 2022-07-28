import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Un BigNumber con valor '0'
  const zero = BigNumber.from(0);

  // Permite llevar la cuenta de si la wallet del usuario esta conectada o no.
  const [walletConnected, setWalletConnected] = useState(false);

  // loading es verdadero cuando esperamos a que la transaccion sea minada.
  const [loading, setLoading] = useState(false);

  // tokensToBeClaimed lleva la cuenta de la cantidad de tokens que pueden ser reclamados
  // basada en la cantidad de NFT que el usuario posea de los cuales no se hayan reclamado aun sus tokens. 
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  // balanceOfCryptoDevTokens permite llevar la cuenta de la cantidad de tokens que posea una direccion.
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(
    zero
  );

  // Cantidad de tokens que el usuario quiere mintear
  const [tokenAmount, setTokenAmount] = useState(zero);

  // tokensMinted es la cantidad total de tokens que han sido minteados hasta el momento del abasteciminto total de los tokens.
  const [tokensMinted, setTokensMinted] = useState(zero);

  // isOwner obtiene el propietario del contrato a traves de la direccion.
  const [isOwner, setIsOwner] = useState(false);
  
  // Referencia a Web3 Modal utilizada para conectarse a Metamask, que se mantiene mientras la página esé abierta.
  const web3ModalRef = useRef();

  /**
   * getTokensToBeClaimed: Comprueba la cantidad de tokens que pueden ser reclamados por el usuario.
   */
  const getTokensToBeClaimed = async () => {
    try {
      // Obtenemos el proveedor de web3Modal, que en este caso es MetaMask.
      // Como solo leemos el estado de la blockchain, no hace falta un Signer.
      const provider = await getProviderOrSigner();
      // Creamos una instancia del contrato del NFT.
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // Creamos una instancia del contrato del token
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Obtenemos el signer para extraer la direccion de la cuenta que esta actualmente conectada con MetaMask.
      const signer = await getProviderOrSigner(true);
      // Obtiene la direccion del signer conectado con MetaMask.
      const address = await signer.getAddress();
      // LLamada a balanceOf para obtener la cantidad de NFTs que posee el usuario.
      const balance = await nftContract.balanceOf(address);
      // Como balance es un Big number, lo comparamos con el Big number `zero`
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        // amount lleva la cuenta de los tokens que no han sido reclamados.
        var amount = 0;
        // Comprobamos si el NFT ya ha sido reclamado
        // Solo aumentando la cantidad si no ha sido reclamado
        // Bucle segun cada NFT que se posee.
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        //Como tokensToBeClaimed es un Big Number, convertiemos el amount a este tipo y lo seteamos a este valor.
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };

  /**
   * getBalanceOfCryptoDevTokens: Comprueba la cantidad de Crypto Dev Tokens's que posee una direccion
   */
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      // Obtenemos el proveedor de web3Modal, que en este caso es MetaMask.
      // Como solo leemos el estado de la blockchain, no hace falta un Signer.
      const provider = await getProviderOrSigner();
       // Creamos una instancia del contrato del token.
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
       // Obtenemos el signer para extraer la direccion de la cuenta que esta actualmente conectada con MetaMask.
      const signer = await getProviderOrSigner(true);
      // Obtiene la direccion del signer conectado con MetaMask.
      const address = await signer.getAddress();
      // LLamada a balanceOf para obtener la cantidad de NFTs que posee el usuario.
      const balance = await tokenContract.balanceOf(address);


      // Como balance ya es un Big Number, no hace que lo convirtamos a este tipo antes de settear el valor.
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  /**
   * mintCryptoDevToken: Mintea una `amount` de tokens para una direccion determinada.
   */
  const mintCryptoDevToken = async (amount) => {
    try {
      // Al ser una transaccion de escritura a la blockchain, necesitamos un Signer.
      const signer = await getProviderOrSigner(true);

      // Creamos una instancia del  tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // Como el valor del token es `0.001 ether`. Tenemos que enviar el valor `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value es el coste de un token, el cual es "0.001" eth.
        // Parseamos el string `0.001` a ethers haciendo uso de la libreria utils que se encuentra en ethers.js
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      // Esperamos a que la trasaccion sea minada.
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * claimCryptoDevTokens: Ayuda a que el usuario reclame los Tokens
   */
  const claimCryptoDevTokens = async () => {
    try {
      // Al ser una transaccion de escritura a la blockchain, necesitamos un Signer.
      
      const signer = await getProviderOrSigner(true);
      // Creamos una instancia del  tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      // Esperamos a que se mine la transaccion
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getTotalTokensMinted: Devuelve cuantos tokens han sido minteados hasta el momento how many del total
   * 
   */
  const getTotalTokensMinted = async () => {
    try {
      // Obtenemos el proveedor de web3Modal, que en este caso es MetaMask.
      // Como solo leemos el estado de la blockchain, no hace falta un Signer.
      const provider = await getProviderOrSigner();
      //Creamos una instancia del contrato
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Obtenemos los tokens que han sido minteados.
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getOwner: Obtiene el propietario del contrato
   */
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      // Llama a la funcion owner del contrato. 
      const _owner = await tokenContract.owner();
      // Obtenemos el signer para extraer la direccion de la cuenta en uso de Metamask. 
      const signer = await getProviderOrSigner(true);
      // Obtiene la direccion asociada al signer que esta conectada a Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * withdrawCoins: Retira los tokens y el ether que reside en el contrato
   * usando la funcion withdraw del contrato
   */
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Devuelve un objeto Provider o Signer representando el Ethereum RPC con o sin la capacidad
   * de firmar de MetaMask
   *
   * Un`Provider` es necesario para poder interactuar con la blockchain, como para leer transacciones, balances, estados, entre otras cosas.
   *
   * Un `Signer` es un tipo especial de Provider utilizado en el caso en el que tenemos que hacer una transaccion de escritura en la blockchain la cual involucre a la cuenta concectada actualmente
   * que necesite hacer una firma digital autorizando el envio de la transaccion. Metamask ofrece una Signer API que permite a la pagina web 
   * pedir firmas al usuario mediante las funciones Signer.
   *
   * @param {*} needSigner - True si se necesita un Signer, false si no.
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Nos conectamos a Metamask
    // Ya que guardamos`web3Modal` como una referencia, necesitamos acceso al valor actual `current` para poder obtener acceso al objeto.
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // Si el usuario no se encuentra en la red Rinkeby lanzar un error con su mensaje correspondiente.
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /*
        connectWallet: Conecta la wallet de MetaMask
      */
  const connectWallet = async () => {
    try {
      // Obtenemos el proveedor de web3Modal, que en este caso es MetaMask.
      // Si es la primera vez, le pedira al usuario que se conecte.
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // useEffects son utilizados para reaccionar a cambios de estado dentro de la pagina web sin necesidad de recargar la pagina.
  // El array al final de la funcion representa que cambios de estado haran que se produzca estos cambios
  // En este caso, cada vez que el valor de `walletConnected` cambie se produciran los cambios
  useEffect(() => {
    // Si la wallet no esta conectada creamos una instancia de Web3Modal y conectamos la wallet de Metamask
    if (!walletConnected) {
      // Asignamos la clase de Web3Modal a la referencia del objeto asignando su valor `current`
      // El valor `current` se mantiene mientras la pagina este abierta.
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  /*
        renderButton: Devuelve un boton segun el estado de la dapp.
      */
  const renderButton = () => {
    // Si estamos esperando algo, devovlemos el boton de cargando.
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // Si el propietario esta conectado, llamamos a withdrawCoins().
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }
    // Si la cnatidad de tokens que pueden ser reclamados es mayor a 0, devolvemos el boton 'Claim'
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // Si no se pueden reclamar tokens se muestra el boton mint.
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from convierte el `e.target.value` a un BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
