# Introduction

Cupcakes allow DAPPs developers access to Smart Contract Wallets. These wallets can be DAPPs specific or User specific. You must read about [Wallets section](./wallets.md) before using the SDK.

:::caution

**This SDK is a work in progress**,
in the meantime, feel free the to read the docs and give us your feedback on [Telegram](https://t.me/cupcakesFeedback)! 💬

:::

## Getting Started

A guide for adding a Cupcakes SDK to your application & start bundling transactions. There are two parts of the documentation, [**bundling transaction**](./bundle-transactions.md) and [**sponsoring gas**](./gassless-experience/).

For both of them you would need to install our SDK. For sponsoring gas, you will have to first create a paymaster contract. To know more about how to create a paymaster contract, read [here](./gassless-experience.md).

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 16.14 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.

## Installing SDK

Our SDK is currently under development, we will be hosting it on NPM soon. The Client SDK will be available in JavaScript with full TypeScript support.

:::caution

`PackageName` is still TBD and will be added here on release.

:::

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="npm" label="npm" default>
```

```bash
npm install @cupcakes-sdk/scw
```

```mdx-code-block
</TabItem>
<TabItem value="yarn" label="yarn" default>
```

```bash
yarn add @cupcakes-sdk/scw
```

```mdx-code-block
</TabItem>
</Tabs>
```

# Wallets

Smart Contract Wallets (SCW) allows DAPP developer to bundle multiple transaction & pay gas fees for their users. You must create a SCW using our SDK for every user. The final bundled call will initiate from user's SCW. If you want to transfer the final assets to the user's current EOA, then you MUST send the transaction to transfer the assets from SCW to EOA separately.

To know how to create a SCW for a user see [Dapp specific wallets](./wallets.md#dapp-specific-wallets).

<!-- Now there are two ways to solve for this problem, first that you use our [User Specific Wallet](/docs/wallets/overview#user-specific-wallet), second that you create a [Dapp Specific Wallet](/docs/wallets/overview#dapp-specific-wallets) for every one of your users. -->

---

## Dapp specific wallets

Install our SDK using instructions [here](/docs/intro#installing-sdk).

### Initiate a wallet

Create a Smart Contract Wallet for a user. You MUST pass a signer while creating the SCW. The signer will have the custody of the SCW.

```typescript
import { Signer } from 'ethers'
import { SCWProvider } from '@cupcakes-sdk/scw'

/**
 * You can get signer using either the private key
 * const signer: Signer = new ether.Wallet(privateKey);
 * You can get signer if user has an EOA using wagmi.sh
 * const { data: signer } = useSigner();
 */

/* Once you have signer & provider, create user's SCW */

/**
 * @param provder - any BaseProvider from ethers (JSONRpcProvider | window.ethereum | etc)
 * @param signer - this will be the owner of the SCW that will be deployed.
 */
const scwProvider: SCWProvider = await SCWProvider.getSCWForOwner(provider, signer)
```

Once the SCW has been initiated, you can use it as a normal signer with ethers/web3/etc to connect & send bundled transactions.

### Executing transactions

You can get `Signer` from the `SCWProvider` we created above & start using it normally as you would use an EOA.

```typescript
const scwSigner = scwProvider.getSigner()
const greeter = new ethers.Contract(GREETER_ADDR, GreeterArtifact.abi, scwSigner)

const tx = await greeter.addGreet({
  value: ethers.utils.parseEther('0.0001'),
})
console.log(tx)
```

### Bundling transactions

You can also send multiple transactions within a single transaction using SCW. Think of approvide `ERC20` tokens & `deposit` them in a single transaction with a single signature from the users.

Read more about how [here](./bundle-transactions.md).

:::danger

The transactions sent using ethers/web3/etc won't be by default bundled or sponsored. Use `sendTransactions` instead to bundle transactions, see [Bundle Transactions](./bundle-transactions.md). If you want to sponer, make sure you connect a `paymaster`, see [Gassless Experience](./gassless-experience.md)

:::

:::info

**Wallet is not deployed instantly**, it will only be deployed once you do the first transaction, resulting in a higher gas fees in the first transaction.
Though the scw address is **deterministic** and funds can be sent to the address.

:::

<!-- ---

## User Specific Wallet

:::caution

**🚧 Upcoming**

This section is under development, DAPP developers are adviced to use DAPP Specific Wallet.

::: -->

<!-- Every user that interacts with your app will have a Cupcakes Wallet. They may create it by coming to our app, or vising a dapp that creates a user's cupcakes wallet. In this wallet, the user holds the custody -->

# Bundle Transactions

Bundling transactions opens up a plathora of possibilities. We have listed a few of them as example:

1. Users won't have to do two transactions for approving an ERC20 token & then depositing it.
2. You can easily support depositing of any ERC20 in your app. Just add a transaction to swap user's token to your preffered token using any Dex.
3. Modular Contract designs, deploy only specific contract modules and then join them off-chain using a bundler transactions.

## Single chain bundling

You must have initialised iSDK & created a `SCWProvider`. We have exposed a function in a `SCWSigner` called `sendTransactions` using which you can send multiple transactions.

```typescript
const scwSigner = scwProvider.getSigner()
const greeter = new ethers.Contract(GREETER_ADDR, GreeterArtifact.abi, scwSigner)

const transactionData = greeter.interface.encodeFunctionData('addGreet')

const tx = await scwProvider.sendTransactions([
  {
    to: GREETER_ADDR,
    value: ethers.utils.parseEther('0.0001'),
    data: transactionData,
  },
  {
    to: GREETER_ADDR,
    value: ethers.utils.parseEther('0.0002'),
    data: transactionData,
  },
])
console.log(tx)
```

```typescript title="Getting approval for ERC20 token & depositing together"
await scwProvider.sendTransactions([
  {
    to: ERC20_TOKEN_ADDR,
    value: ethers.utils.parseEther('0.1'),
    data: TOKEN.interface.encodeFunctionData('approve', [
      spenderAddress,
      ethers.utils.parseEther(amount * 10), // getting approval from 10 times the amount to be spent
    ]),
  },
  {
    to: myContract.address,
    value: ethers.utils.parseEther('0.1'),
    data: myContract.interface.encodeFunctionData('stake', [ERC20_TOKEN_ADDR, ethers.utils.parseEther(amount)]),
  },
])
```

## Cross chain bundling

:::info

**Cross-chain Bundling** will be coming soon, which will enable you to add bridging transactions to your transactions as well.

:::

# Gassless Experience

Cupkaes SDK will enable conditional gassless experience, which includes partial gas-sponsoring. This enables you to have complex integrations like: sponsoring of gas on ethereum upto $5 and 100% on L2/sidechain.

Before you can start sponsoring gas, you must [deploy](./gassless-experience#deploy-a-paymaster) a paymaster contract. The paymaster _MUST_ be staked & should have enough deposit to sponsor for gas. If the deposited amount becomes lesser than the gas required then your transactions will start failing.

---

## Paymaster

Paymaster is a contract that sponsors gas fees on behalf of users. To know more about how it works, read in the [architecture section](./architecture/overview).

To enable gas sponsoring these are the steps you must do:

1. [Deploy a paymaster](./gassless-experience#deploy-a-paymaster)
2. [Stake paymaster](./gassless-experience#stake--deposit-funds)
3. [Register a webhook](./gassless-experience#register-webhook)
4. [Integrate with frontend](./gassless-experience#integrate-with-frontend)

### Deploy a paymaster

Head to our website [https://comingsoon@cupcakes](https://bit.ly/gas_less) and follow the steps shown in the video below to deploy your first paymaster.

```mdx-code-block
<iframe width="720" height="406" src="https://www.youtube-nocookie.com/embed/jreqzJMzR5s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

### Stake & deposit funds

Once you have created your paymaster, you will have to stake your funds. The Minimum stake as of now is `x MATIC` with a lock-in of `7 days`. The stake is to make sure no fraudulant activity can be performed by the paymaster. The staked funds will be deductded if any such fraudulant activity is found.

:::caution
You must have enough deposit left to cover for 100% of the gas fees even if you only want to sponsor a portion of it. If desposit is not enough, the transaction will be reverted.
:::

Learn more about how your stake can be slashed more in detail [here](./architecture/overview).

### Register webhook

You will have to register a webhook, where we will be sending the a `POST` request to verify the sponsoring of the gas.

The requst will have the following body:

```json
{
  "auth_code": "b110a339-ff6c-4456-8adb-b236a3da11d3",
  "timestamp": 1662805504483,
  "userOperation": {
    "sender": "0xadb2...asd4", // Sender's address of the SCW
    "maxGasCost": 123, // you can use this as the total of all the above gas breakup & use this to make decision of sponsoring
    "paymasterDeposit": 123, // the amount of deposit left in your paymaster contract, you can send refill transactions using this if you want to
    "paymasterAddress": "0x23rr...", // your paymaster contract address, you should send money to this address if paymasterDeposit is approaching zero
    "transactions": [
      // this is the array of transactions that your frontend SDK included for bundling
      {
        "to": "0x123..",
        "value": 4, // value in ethers
        "data": "0xadsf..." // call data your SDK passed
      }
    ],
    // The following fields are part of the UserOperation that will be used to generate signature, you can ignore these if you are using our paymaster SDK
    "nonce": 123,
    "initCode": "0xAxvd3r....adfsg4r", //init code, if not empty means that this wallet doesn't exist and will be deployed in this transaction along with executing the required transaction
    "callData": "0xsdfdasf...000", // call data of the execution
    "callGas": 123, // the amount of gas the main execution of transaction will take
    "verificationGas": 123, //the constant amount of gas which is required to verify sender's ownership
    "preVerificationGas": 123, // the constant amount of gas which is required by the bundler for processing the transaction
    "maxFeePerGas": 123, // the maximum gas price, this depends on how busy the network is
    "maxPriorityFeePerGas": 123 // the fee that will be used to tip the miner
  }
}
```

You must verify `auth_code` to check if the call is from our service or not. You will see the `auth_code` once you register a success webhook.

You must return with a `200` code if you agree to sponsor the transaction. If you choose not to sponsor, you must return with a `403 - Forbidden` status code response.

### Integrate with frontend

You will have to connect your paymaster with the SCW you created in [Wallets section](./wallets#initiate-a-wallet).

```typescript
import { PaymasterAPI } from '@cupcakes-sdk/scw'

// You can get the your API KEY when you create a paymaster, every paymaster has a different API KEY

/* Connect to us to get Paymaster URL & Paymaster API KEY */
const paymasterAPI = new PaymasterAPI(process.env.REACT_APP_PAYMASTER_URL, process.env.REACT_APP_PAYMASTER_API_KEY)

/* Connect your paymaster to the provider */
scwProvider.connectPaymaster(paymasterAPI)

/* Do transaction as normal */
const scwSigner = scwProvider.getSigner()
const greeter = new ethers.Contract(GREETER_ADDR, GreeterArtifact.abi, scwSigner)

const tx = await greeter.addGreet({
  value: ethers.utils.parseEther('0.0001'),
})
console.log(tx)

/* Disconnect if you don't want to sponsor amny further */
scwProvider.disconnectPaymaster()
```

# Overview

## Smart Contract Wallet (SCW)

Each SCW has a signer assiciated with it,

![SCW Architecture Basic](https://github.com/cupcakes-3/sdk/blob/main/packages/scw/assets/architecture-basic.svg?raw=true)

## Bundling

![SCW Architecture Bundled](https://github.com/cupcakes-3/sdk/blob/main/packages/scw/assets/architecture-bundling.svg?raw=true)

## Gassless Experience

![SCW Architecture Paymaster](https://github.com/cupcakes-3/sdk/blob/main/packages/scw/assets/architecture-paymaster.svg?raw=true)
