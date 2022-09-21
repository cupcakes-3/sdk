import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'

import fs from 'fs'

import { HardhatUserConfig } from 'hardhat/config'
import { NetworkUserConfig } from 'hardhat/src/types/config'

const mnemonicFileName = process.env.MNEMONIC_FILE
let mnemonic = 'test '.repeat(11) + 'junk'
if (mnemonicFileName != null && fs.existsSync(mnemonicFileName)) {
  console.warn('Hardhat does not seem to ')
  mnemonic = fs.readFileSync(mnemonicFileName, 'ascii').replace(/(\r\n|\n|\r)/gm, '')
}

const config: HardhatUserConfig = {
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545/',
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLI_RPC,
      accounts: [mnemonic],
    },
  },
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: { enabled: true },
    },
  },
}

export default config
