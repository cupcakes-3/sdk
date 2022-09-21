import { ReactElement } from 'react'
import './App.css'
import { Header } from './components/header'
import { Demo } from './components/demo'

import { WagmiConfig, createClient, chain, configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'

const { provider } = configureChains([chain.goerli], [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_KEY })])

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
