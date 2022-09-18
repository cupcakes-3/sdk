import { Button, Container } from '@mui/material';
import { ReactElement, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSigner } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';
import { SCW } from '@cupcakes-sdk/scw';

export const Demo = (): ReactElement => {
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_ALCHEMY_RPC
  );

  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (isConnected && signer != null) {
      SCW.getSCWForOwner(provider, signer)
        .then((scw: SCW) => {
          console.log(scw);
        })
        .catch((e) => console.log(e));
    }
  }, [isConnected, signer]);

  return (
    <Container>
      {isConnected ? <div>Connected to {address}</div> : null}
      {!isConnected ? (
        <Button variant="contained" onClick={() => connect()}>
          Connect Wallet
        </Button>
      ) : (
        <Button variant="contained" onClick={() => disconnect()}>
          Disconnect
        </Button>
      )}
    </Container>
  );
};
