import { ReactElement } from 'react'
import { useConnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import SendIcon from '@mui/icons-material/Send'
import LoadingButton from '@mui/lab/LoadingButton'

export const ConnectWallet = (): ReactElement => {
  const { connect, isLoading } = useConnect({
    connector: new InjectedConnector(),
  })

  return (
    <LoadingButton
      loading={isLoading}
      loadingPosition="end"
      endIcon={<SendIcon />}
      variant="contained"
      onClick={() => connect()}
    >
      Connect Wallet
    </LoadingButton>
  )
}
