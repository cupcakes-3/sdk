import { ReactElement } from 'react';
import './App.css';
import { Header } from './components/header';
import { Demo } from './components/demo';

import { WagmiConfig, createClient } from 'wagmi';
import { getDefaultProvider } from 'ethers';

const client = createClient({
  autoConnect: true,
  provider: getDefaultProvider(),
});

export default function App(): ReactElement {
  return (
    <WagmiConfig client={client}>
      <Header></Header>
      <Demo></Demo>
    </WagmiConfig>
  );
}
