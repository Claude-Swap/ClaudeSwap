import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import './WalletButton.css'

interface WalletButtonProps {
  onConnect?: (address: string) => void
}

const WalletButton = ({ onConnect: _onConnect }: WalletButtonProps) => {
  return (
    <div className="wallet-button-wrapper">
      <WalletMultiButton className="wallet-adapter-button-trigger" />
    </div>
  )
}

export default WalletButton

