import { SCWProvider } from '@cupcakes-sdk/scw'
import { BigNumber, providers } from 'ethers'
import { useEffect, useState } from 'react'
import { usePrepareSendTransaction, useSendTransaction, useWaitForTransaction } from 'wagmi'

export enum usePrefundStates {
  nullState = 'nullState',
  isSendingTransaction = 'isSendingTransaction',
  isWaitingForTransaction = 'isWaitingForTransaction',
  transactionProcessed = 'transactionProcessed',
}

export interface usePrefundResolver {
  data: providers.TransactionReceipt | undefined
  state: usePrefundStates
  isError: boolean
  sendTransaction: () => void
}

export interface usePrefundParams {
  preFund: BigNumber
  scwProvider: SCWProvider
}

export const usePrefund = ({ preFund, scwProvider }: usePrefundParams): usePrefundResolver => {
  const [scwAddress, setScwAddress] = useState<string>('')
  const [state, setState] = useState<usePrefundStates>(usePrefundStates.nullState)

  useEffect(() => {
    const getTableDetails = async (): Promise<void> => {
      const scwSigner = scwProvider.getSigner()
      const scwAddress = await scwSigner.getAddress()
      setScwAddress(scwAddress)
    }
    if (scwProvider != null) {
      getTableDetails().catch((e: Error) => console.log(e))
    }
  }, [])

  const { config } = usePrepareSendTransaction({
    request: {
      to: scwAddress,
      value: preFund,
    },
  })

  const { data, isError: sendTransactionError, sendTransaction: sendPrefundTransaction } = useSendTransaction(config)

  const {
    data: receipt,
    isLoading: waitingForTxn,
    isError: waitForTransactionError,
    isSuccess,
  } = useWaitForTransaction({
    hash: data?.hash,
  })

  useEffect(() => {
    if (waitingForTxn && state !== usePrefundStates.isWaitingForTransaction) {
      setState(usePrefundStates.isWaitingForTransaction)
    }
    if (isSuccess && state !== usePrefundStates.transactionProcessed) {
      setState(usePrefundStates.transactionProcessed)
    }
  }, [waitingForTxn, isSuccess])

  const sendTransaction = (): void => {
    sendPrefundTransaction?.()
    setState(usePrefundStates.isSendingTransaction)
  }

  return { data: receipt, isError: sendTransactionError || waitForTransactionError, state, sendTransaction }
}
