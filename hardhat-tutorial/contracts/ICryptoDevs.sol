// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

//Interfaz del token

interface ICryptoDevs {
    /**
     * @dev Devuelve la ID de un token perteneciente a `owner` en un  `index` dado dentro de la lista de tokens.
     * Use along with {balanceOf} to enumerate all of ``owner``'s tokens.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256 tokenId);

    /**
     * @dev Devuelve la cantidad de tokens que hay en la cuenta de ``owner``.
     */
    function balanceOf(address owner) external view returns (uint256 balance);
}
