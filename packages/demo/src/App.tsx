import { ReactElement } from 'react'
import './App.css'
import { Header } from './components/header'
import { Demo } from './components/demo'

import { WagmiConfig, createClient, chain, configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'

// TODO: move api key to config
const { provider } = configureChains([chain.goerli], [alchemyProvider({ apiKey: 'WHpxlQrzQIGs_uJRT9LIlR6K1M9khXmX' })])

const client = createClient({
  autoConnect: true,
  provider,
})

export default function App(): ReactElement {
  return (
    <WagmiConfig client={client}>
      <Header></Header>
      <Demo></Demo>
    </WagmiConfig>
  )
}
