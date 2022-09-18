import { ethers } from 'ethers';

export class SCW {
  constructor(
    provider: ethers.providers.Provider,
    entryPointAddress: string,
    walletAddress: string | undefined,
    readonly owner: ethers.Signer,
    readonly factoryAddress?: string,
    // index is "salt" used to distinguish multiple wallets of the same signer.
    readonly index = 0
  ) {}

  static async getSCWForOwner(
    originalProvider: ethers.providers.JsonRpcProvider,
    owner: ethers.Signer
  ): Promise<SCW> {
    const network = await originalProvider.send('eth_chainId', []);
    const entryPointAddress = '';
    const walletAddress = '';
    console.log(network, entryPointAddress);

    // const providerConfig: ClientConfig = {
    //   entryPointAddress,
    //   bundlerUrl: '',
    //   chainId: 1,
    // };

    // const provider = await newProvider(originalProvider, providerConfig, owner);
    return new SCW(originalProvider, entryPointAddress, walletAddress, owner);
  }
}
