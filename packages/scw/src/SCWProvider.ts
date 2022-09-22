import { ethers } from 'ethers'
import { ClientConfig, ERC4337EthersProvider, PaymasterAPI, SimpleWalletAPI } from '@cupcakes-sdk/sdk'
import { EntryPoint, EntryPoint__factory, SimpleWalletDeployer__factory } from '@account-abstraction/contracts'
import { HttpRpcClient } from '@cupcakes-sdk/sdk/dist/src/HttpRpcClient'
import { Signer } from '@ethersproject/abstract-signer'
import { BaseProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { Deferrable } from '@ethersproject/properties'

export interface BundlerChainMap {
  [chainId: number]: string
}

export interface SCWProviderConfig {
  entryPointAddress?: string
  walletDeployer?: string
  bundlerUrlMapping?: BundlerChainMap
  scwIndex?: number
}

export const defaultSCWProviderConfig: SCWProviderConfig = {
  entryPointAddress: '0x2167fA17BA3c80Adee05D98F0B55b666Be6829d6',
  walletDeployer: '0x568181CaB8a5EBDEeaD289ae745C3166bbEAfF3a',
  bundlerUrlMapping: {
    // goerli bundler address
    5: 'https://eip4337-bundler-goerli.protonapp.io/rpc',
  },
  scwIndex: 0,
}

// TODO: Add support for multiple SCW implementations
export class SCWProvider extends ERC4337EthersProvider {
  constructor(
    readonly config: ClientConfig,
    readonly originalSigner: Signer,
    readonly originalProvider: BaseProvider,
    readonly httpRpcClient: HttpRpcClient,
    readonly entryPoint: EntryPoint,
    readonly smartWalletAPI: SimpleWalletAPI
  ) {
    super(config, originalSigner, originalProvider, httpRpcClient, entryPoint, smartWalletAPI)
  }

  getSCWOwner = (): Signer => {
    return this.originalSigner
  }

  sendTransactions = async (transactions: Array<Deferrable<TransactionRequest>>): Promise<TransactionResponse> => {
    const txs: TransactionRequest[] = await Promise.all(
      transactions.map(async (tx) => await this.signer.populateTransaction(tx))
    )
    await Promise.all(txs.map(async (tx) => await this.signer.verifyAllNecessaryFields(tx)))

    return await this.signer.sendTransaction(await this.smartWalletAPI.getBatchExecutionTransaction(txs))
  }

  connectPaymaster = (paymasterAPI: PaymasterAPI): void => {
    this.smartWalletAPI.connectPaymaster(paymasterAPI)
  }

  disconnectPaymaster = (): void => {
    this.smartWalletAPI.disconnectPaymaster()
  }

  isSCWDeployed = async (): Promise<boolean> => {
    const code = await this.originalProvider.getCode(this.getSenderWalletAddress())
    return code !== '0x'
  }

  static async getSCWForOwner(
    originalProvider: ethers.providers.BaseProvider,
    owner: ethers.Signer,
    config: SCWProviderConfig = defaultSCWProviderConfig
  ): Promise<SCWProvider> {
    config.bundlerUrlMapping = config.bundlerUrlMapping ?? defaultSCWProviderConfig.bundlerUrlMapping ?? ''
    config.entryPointAddress = config.entryPointAddress ?? defaultSCWProviderConfig.entryPointAddress ?? ''
    config.scwIndex = config.scwIndex ?? defaultSCWProviderConfig.scwIndex ?? 0
    config.walletDeployer = config.walletDeployer ?? defaultSCWProviderConfig.walletDeployer ?? ''

    const network = await originalProvider.getNetwork()
    const entryPointAddress = config.entryPointAddress

    const providerConfig: ClientConfig = {
      entryPointAddress,
      bundlerUrl: config.bundlerUrlMapping[network.chainId],
      chainId: network.chainId,
    }

    const factoryAddress = config.walletDeployer

    const entryPoint = EntryPoint__factory.connect(providerConfig.entryPointAddress, originalProvider)

    // Initial SimpleWallet instance is not deployed and exists just for the interface

    const factory = SimpleWalletDeployer__factory.connect(factoryAddress, originalProvider)

    const ownerAddress = await owner.getAddress()

    const addr = await factory.getDeploymentAddress(entryPointAddress, ownerAddress, config.scwIndex)

    const walletAddress = addr

    const smartWalletAPI = new SimpleWalletAPI(
      originalProvider,
      entryPoint.address,
      walletAddress,
      owner,
      factoryAddress,
      config.scwIndex
    )

    const httpRpcClient = new HttpRpcClient(
      providerConfig.bundlerUrl,
      providerConfig.entryPointAddress,
      network.chainId
    )

    return await new SCWProvider(
      providerConfig,
      owner,
      originalProvider,
      httpRpcClient,
      entryPoint,
      smartWalletAPI
    ).init()
  }
}
