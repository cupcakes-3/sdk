import { Container, Typography } from '@mui/material'
import { ReactElement, useEffect, useState } from 'react'
import { useAccount, useDisconnect, useSigner, useProvider } from 'wagmi'
import { SCWProvider } from '@cupcakes-sdk/scw'
import { ConnectWallet } from '../connect-wallet'
import { WalletConnected } from '../wallet-connected'

export const Demo = (): ReactElement => {
  const { isConnected } = useAccount()
  const { data: signer } = useSigner()
  const [scwProvider, setSCWProvider] = useState<SCWProvider | null>(null)
  const provider = useProvider()

  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (isConnected && signer != null) {
      SCWProvider.getSCWForOwner(provider, signer)
        .then((scwProvider: SCWProvider) => {
          setSCWProvider(scwProvider)
        })
        .catch((e: Error) => console.log(e))
    }
  }, [isConnected, signer])

  const disconnectWalletAndDestructSCW = (): void => {
    disconnect()
    setSCWProvider(null)
  }

  return (
    <Container sx={{ pt: 6 }}>
      <Typography component="h4" variant="h4" sx={{ pb: 2 }}>
        SCW Demo
      </Typography>
      <Typography component="div" variant="body1" sx={{ pb: 4 }}>
        {!isConnected
          ? 'In this demo, we use your EOA as the owner of the SCW. Connect your wallet to get your SCW right now!'
          : 'Details of scw created for your EOA are listed below'}
      </Typography>
      {!isConnected ? <ConnectWallet /> : null}
      {isConnected ? (
        <WalletConnected scwProvider={scwProvider} disconnectWalletAndDestructSCW={disconnectWalletAndDestructSCW} />
      ) : null}
    </Container>
  )
}
