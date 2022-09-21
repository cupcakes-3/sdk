import { ClientConfig, ERC4337EthersProvider, ERC4337EthersSigner } from '@account-abstraction/sdk'
import { BaseWalletAPI } from '@account-abstraction/sdk/dist/src/BaseWalletAPI'
import { HttpRpcClient } from '@account-abstraction/sdk/dist/src/HttpRpcClient'
import { Signer } from 'ethers'

export class SCWSigner extends ERC4337EthersSigner {
  constructor(
    readonly config: ClientConfig,
    readonly originalSigner: Signer,
    readonly erc4337provider: ERC4337EthersProvider,
    readonly httpRpcClient: HttpRpcClient,
    readonly smartWalletAPI: BaseWalletAPI
  ) {
    super(config, originalSigner, erc4337provider, httpRpcClient, smartWalletAPI)
  }
}
