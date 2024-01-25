'use client';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AppModal } from '../ui/ui-layout';
import { WalletButton } from '../solana/solana-provider';

export default function TokenAccounts() {
  const { publicKey } = useWallet();
  const [showSendModal, setShowSendModal] = useState(false);

  if (!publicKey) {
    return (
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <ModalTokenCreate
        address={publicKey}
        show={showSendModal}
        hide={() => setShowSendModal(false)}
      />
      <div className="space-y-2 pt-10">
        <div className="justify-between">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">Token Mint Address</h2>
            <div className="space-x-2">
              <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={() => setShowSendModal(true)}
              >
                Create New Token
              </button>
            </div>
          </div>
        </div>
        <div>No Tokens Created Yet</div>
      </div>
    </>
  );
}

function ModalTokenCreate({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const wallet = useWallet();
  const [mintAuthority, setmintAuthority] = useState('');

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>;
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Create Token"
      submitDisabled={false}
      submitLabel="Create Token"
      submit={() => {
        console.log('Submiting');
      }}
    >
      <input
        disabled={false}
        type="text"
        placeholder="mintAuthority public address"
        className="input input-bordered w-full"
        value={mintAuthority}
        onChange={(e) => setmintAuthority(e.target.value)}
      />
    </AppModal>
  );
}
