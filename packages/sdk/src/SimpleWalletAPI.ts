import { BigNumber, BigNumberish } from 'ethers'
import {
  SimpleWallet,
  SimpleWallet__factory,
  SimpleWalletDeployer,
  SimpleWalletDeployer__factory,
} from '@account-abstraction/contracts'

import { arrayify, BytesLike, hexConcat } from 'ethers/lib/utils'
import { Signer } from '@ethersproject/abstract-signer'
import { BaseWalletAPI } from './BaseWalletAPI'
import { Provider, TransactionRequest } from '@ethersproject/providers'

/**
 * An implementation of the BaseWalletAPI using the SimpleWallet contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */
export class SimpleWalletAPI extends BaseWalletAPI {
  /**
   * base constructor.
   * subclass SHOULD add parameters that define the owner (signer) of this wallet
   * @param provider - read-only provider for view calls
   * @param entryPointAddress - the entryPoint to send requests through (used to calculate the request-id, and for gas estimations)
   * @param walletAddress optional wallet address, if connecting to an existing contract.
   * @param owner the signer object for the wallet owner
   * @param factoryAddress address of contract "factory" to deploy new contracts
   * @param index nonce value used when creating multiple wallets for the same owner
   */
  constructor(
    provider: Provider,
    entryPointAddress: string,
    walletAddress: string | undefined,
    readonly owner: Signer,
    readonly factoryAddress?: string,
    // index is "salt" used to distinguish multiple wallets of the same signer.
    readonly index = 0
  ) {
    super(provider, entryPointAddress, walletAddress)
  }

  /**
   * our wallet contract.
   * should support the "execFromSingleton" and "nonce" methods
   */
  walletContract?: SimpleWallet

  factory?: SimpleWalletDeployer

  async _getWalletContract(): Promise<SimpleWallet> {
    if (this.walletContract == null) {
      this.walletContract = SimpleWallet__factory.connect(await this.getWalletAddress(), this.provider)
    }
    return this.walletContract
  }

  async getBatchExecutionTransaction(txs: TransactionRequest[]): Promise<TransactionRequest> {
    const walletContract = await this._getWalletContract()

    const destinations: string[] = txs.map((tx) => tx.to ?? '')
    const callDatas: BytesLike[] = txs.map((tx) => tx.data ?? '')

    const finalCallData = walletContract.interface.encodeFunctionData('execBatch', [destinations, callDatas])
    const target = await this.getWalletAddress()

    return {
      to: target,
      data: finalCallData,
    }
  }

  /**
   * return the value to put into the "initCode" field, if the wallet is not yet deployed.
   * this value holds the "factory" address, followed by this wallet's information
   */
  async getWalletInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== '') {
        this.factory = SimpleWalletDeployer__factory.connect(this.factoryAddress, this.provider)
      } else {
        throw new Error('no factory to get initCode')
      }
    }
    return hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData('deployWallet', [
        this.entryPointAddress,
        await this.owner.getAddress(),
        this.index,
      ]),
    ])
  }

  async getNonce(): Promise<BigNumber> {
    if (await this.checkWalletPhantom()) {
      return BigNumber.from(0)
    }
    const walletContract = await this._getWalletContract()
    return await walletContract.nonce()
  }

  /**
   * encode a method call from entryPoint to our contract
   * @param target
   * @param value
   * @param data
   */
  async encodeExecute(target: string, value: BigNumberish, data: string): Promise<string> {
    const walletContract = await this._getWalletContract()
    return walletContract.interface.encodeFunctionData('execFromEntryPoint', [target, value, data])
  }

  async signRequestId(requestId: string): Promise<string> {
    return await this.owner.signMessage(arrayify(requestId))
  }
}
