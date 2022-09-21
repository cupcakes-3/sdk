import { Button, Dialog, DialogActions, DialogContent, DialogTitle, styled, Typography } from '@mui/material'
import { Fragment, ReactElement, useEffect, useMemo, useState } from 'react'
import { BigNumber, ethers } from 'ethers'
import { SCWProvider } from '@cupcakes-sdk/scw'

import GreeterArtifact from '../../assets/artifacts/Greeter.json'
// import { usePrepareSendTransaction, useSendTransaction } from 'wagmi'
import { GREETER_ADDR } from '../constants'
import { usePrefund, usePrefundStates } from '../../hooks/prefund'
import { LoadingButton } from '@mui/lab'

export interface TestTransactionProps {
  scwProvider: SCWProvider
  buttonLabel: string
  transaction: any
  transactionExecutioner: (scwProvider: SCWProvider) => Promise<void>
}

const BoldTypography = styled(Typography)`
  font-weight: 600;
`

export const singleTransaction = {
  to: GREETER_ADDR,
  value: '0.0001 ETH',
  data: 'Function Call addGreet',
}

export const batchTransaction = [
  {
    to: GREETER_ADDR,
    value: '0 ETH',
    data: 'Function Call addGreet',
  },
  {
    to: GREETER_ADDR,
    value: '0 ETH',
    data: 'Function Call addGreet',
  },
]

export const singleTransactionExecution = async (scwProvider: SCWProvider): Promise<void> => {
  const scwSigner = scwProvider.getSigner()
  const greeter = new ethers.Contract(GREETER_ADDR, GreeterArtifact.abi, scwSigner)

  const tx = await greeter.addGreet({
    value: ethers.utils.parseEther('0.0001'),
  })
  console.log(tx)
}

export const bundleTransactionsExecution = async (scwProvider: SCWProvider): Promise<void> => {
  const scwSigner = scwProvider.getSigner()
  const greeter = new ethers.Contract(GREETER_ADDR, GreeterArtifact.abi, scwSigner)

  const transactionData = greeter.interface.encodeFunctionData('addGreet')

  const tx = await scwProvider.sendTransactions([
    {
      to: GREETER_ADDR,
      data: transactionData,
    },
    {
      to: GREETER_ADDR,
      data: transactionData,
    },
  ])
  console.log(tx)
}

export const TestTransaction = ({
  scwProvider,
  buttonLabel,
  transaction,
  transactionExecutioner,
}: TestTransactionProps): ReactElement => {
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [sendingTestTransaction, setSendingTestTransaction] = useState<boolean>(false)
  const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0))
  const [deployed, setDeployed] = useState<boolean>(true)
  const [minFundsEstimate, setMinFundsEstimate] = useState<BigNumber>(BigNumber.from(0))

  const preFund = useMemo(() => {
    const preFund = minFundsEstimate.sub(balance)
    return preFund.gte(0) ? preFund : BigNumber.from(0)
  }, [minFundsEstimate, balance])

  const { data, isError, state, sendTransaction } = usePrefund({ preFund, scwProvider })

  //   console.log(data)

  useEffect(() => {
    const getTableDetails = async (): Promise<void> => {
      const scwSigner = scwProvider.getSigner()
      const greeter = new ethers.Contract(GREETER_ADDR, GreeterArtifact.abi, scwSigner)
      const feedData = await scwProvider.getFeeData()
      const gasPrice = feedData.maxFeePerGas // take gas price deviations in mind

      const estimate = await greeter.estimateGas.addGreet()

      const balance = await scwSigner.getBalance()
      const deployed = await scwProvider.isSCWDeployed()

      setBalance(balance)
      setDeployed(deployed)
      setMinFundsEstimate(estimate.mul(gasPrice ?? 1).add(ethers.utils.parseEther('0.0001')))

      setLoading(false)
    }

    if (scwProvider != null) {
      getTableDetails().catch((e: Error) => console.log(e))
    }
  }, [scwProvider])

  const sendTestTransaction = async (): Promise<void> => {
    setSendingTestTransaction(true)
    await transactionExecutioner(scwProvider)
    setSendingTestTransaction(false)
  }

  if (data !== undefined && state === usePrefundStates.transactionProcessed) {
    sendTestTransaction().catch((e) => console.log(e))
  }

  const prefundOrSendTestTransaction = (): void => {
    if (preFund.gt(0)) {
      sendTransaction()
    } else {
      sendTestTransaction().catch((e) => console.log(e))
    }
  }

  if (isError) {
    return (
      <Fragment>
        {/*
              // @ts-expect-error */}
        <BoldTypography variant="body1" component={'span'} sx={{ color: 'red' }}>
          Error occured, please refresh page
        </BoldTypography>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <Button variant="outlined" onClick={() => setShowDialog(true)}>
        {buttonLabel}
      </Button>
      <Dialog disableEscapeKeyDown={false} fullWidth={true} maxWidth={'lg'} open={showDialog}>
        <DialogTitle>Test Transaction</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>We will be sending the following test transaction to Greeter contract:</Typography>
          {transaction != null ? <pre>{JSON.stringify(transaction, null, 2)}</pre> : null}

          <Typography sx={{ mt: 2 }} variant={'body1'}>
            Balance of SCW:{' '}
            {/*
              // @ts-expect-error */}
            <BoldTypography variant="body1" component={'span'}>
              {loading ? 'loading...' : `${ethers.utils.formatEther(balance)} ETH`}
            </BoldTypography>
          </Typography>
          <Typography variant={'body1'}>
            Deployment status of SCW:{' '}
            {/*
              // @ts-expect-error */}
            <BoldTypography variant="body1" component={'span'}>
              {loading ? 'loading...' : deployed ? 'Deployed' : 'Not Deployed'}
            </BoldTypography>
          </Typography>
          {!loading && preFund.gt(0) ? (
            <Typography variant="subtitle1" sx={{ mt: 2, color: 'red' }}>
              You need funds to perform the test transaction!
            </Typography>
          ) : null}

          {!loading && preFund.gt(0) ? (
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Minimum funds requirement for test transaction ={' '}
              {/*
              // @ts-expect-error */}
              <BoldTypography component="span">{ethers.utils.formatEther(minFundsEstimate)} ETH</BoldTypography>
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>cancel</Button>
          <LoadingButton
            loading={loading || sendingTestTransaction}
            disabled={loading || sendingTestTransaction}
            variant="contained"
            autoFocus
            onClick={() => prefundOrSendTestTransaction()}
          >
            {loading
              ? 'Loading...'
              : state === usePrefundStates.nullState && !sendingTestTransaction
              ? 'Execute Transaction'
              : 'Processing Transaction'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}
