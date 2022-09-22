import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import { ethers, BigNumber, BigNumberish, Signer } from 'ethers'
import asyncHandler from 'express-async-handler'
import { EntryPoint__factory, VerifyingPaymaster__factory } from '@account-abstraction/contracts'
// import SimpleWalletArtifact from './abi/SimpleWallet.json'
// import EntryPointArtifact from './abi/EntryPoint.json'
// import PaymasterArtifact from './abi/VerifyingPaymaster.json'
import { hexConcat } from 'ethers/lib/utils'
import { BytesLike } from '@ethersproject/bytes'

import cors from 'cors'

export type address = string
export type uint256 = BigNumberish
export type uint = BigNumberish
export type uint64 = BigNumberish
export type bytes = BytesLike
export type bytes32 = BytesLike
export type uint112 = BigNumber
export type uint32 = BigNumberish

dotenv.config()

const app: Express = express()
const port = process.env.PORT ?? 8080

const ENTRY_POINT_CONTRACT = process.env.ENTRYPOINT_ADDR ?? ''

app.use(cors())
app.use(express.json())

interface UserOperation {
  sender: address
  nonce: uint256
  initCode: bytes
  callData: bytes
  callGasLimit: uint256
  verificationGasLimit: uint256
  preVerificationGas: uint256
  maxFeePerGas: uint256
  maxPriorityFeePerGas: uint256
  paymasterAndData: bytes
  signature: bytes
}

interface DepositInfo {
  deposit: uint112
  staked: boolean
  stake: uint112
  unstakeDelaySec: uint32
  withdrawTime: uint64
}

const getHash = async (
  paymasterAddr: string,
  entryPointAddr: string,
  signer: Signer,
  userOp: UserOperation
): Promise<string> => {
  const Paymaster = VerifyingPaymaster__factory.connect(paymasterAddr, signer)

  const EntryPoint = EntryPoint__factory.connect(entryPointAddr, signer)

  const depositInfo: DepositInfo = await EntryPoint.getDepositInfo(paymasterAddr)
  console.log('depositInfo', depositInfo)

  console.log(await signer.getAddress())
  if (!depositInfo.staked) {
    console.log('we are not staked, adding stake')
    const tx = await Paymaster.addStake(100, {
      value: ethers.utils.parseEther('1'),
    })
    await tx.wait()
  }

  //   if (depositInfo.deposit.lt(ethers.utils.parseEther('0.1'))) {
  // const tx = await Paymaster.deposit({
  //   value: ethers.utils.parseEther('0.1'),
  // })
  // await tx.wait()
  // console.log(tx)
  //   }

  const UserOp = [
    'sender',
    'nonce',
    'initCode',
    'callData',
    'callGasLimit',
    'verificationGasLimit',
    'preVerificationGas',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
    'paymasterAndData',
    'signature',
  ]

  userOp = {
    sender: userOp?.sender ?? '0x',
    nonce: ethers.BigNumber.from(userOp?.nonce ?? '0x'),
    initCode: userOp?.initCode ?? '0x',
    callData: userOp?.callData ?? '0x',
    callGasLimit: ethers.BigNumber.from(userOp?.callGasLimit ?? '0x'),
    verificationGasLimit: ethers.BigNumber.from(userOp?.verificationGasLimit ?? '0x'),
    preVerificationGas: ethers.BigNumber.from(userOp?.preVerificationGas ?? '0x'),
    maxFeePerGas: ethers.BigNumber.from(userOp?.maxFeePerGas ?? '0x'),
    maxPriorityFeePerGas: ethers.BigNumber.from(userOp?.maxPriorityFeePerGas ?? '0x'),
    paymasterAndData: userOp?.paymasterAndData ?? '0x',
    signature: userOp?.signature ?? '0x',
  }

  UserOp.forEach((key) => {
    userOp[key] = userOp[key] ?? '0x'
  })

  return await Paymaster.getHash(userOp)
}

const supportedKeys = process.env.SUPORTED_KEYS.split(' ')
const paymasters = process.env.PAYMASTERS.split(' ')

const keyWebhookMap = supportedKeys.reduce((result, key, index) => {
  return {
    ...result,
    [key]: paymasters[index],
  }
}, {})

app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 200,
  })
})

app.post(
  '/signPaymaster',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userOp, apiKey } = req.body

    if (!supportedKeys.includes(apiKey) || keyWebhookMap[apiKey] !== '0x14d239e4f31eeFBbB5B91F0Cee5F82dc639BD7d4') {
      res.json({
        paymasterAndData: `0x`,
      })
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider)
    const hash = await getHash(keyWebhookMap[apiKey], ENTRY_POINT_CONTRACT, wallet, userOp)
    const paymasterAndData = hexConcat([keyWebhookMap[apiKey], await wallet.signMessage(ethers.utils.arrayify(hash))])
    res.json({ paymasterAndData })
  })
)

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
})
