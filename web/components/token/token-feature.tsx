'use client';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AppModal } from '../ui/ui-layout';
import { WalletButton } from '../solana/solana-provider';
import { useCreateMint } from './token-data-access';

export default function TokenAccounts() {
  const { publicKey } = useWallet();
  const [showSendModal, setShowSendModal] = useState(false);
  const mutation = useCreateMint({ address: publicKey });

  if (!publicKey) {
    return (
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  function createMint() {
    mutation.mutateAsync();
  }

  return (
    <>
      <ModalTokenMint
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
                onClick={() => createMint()}
              >
                Create New Token
              </button>
            </div>
          </div>
        </div>
        <div>
          No Tokens Created Yet
          <button
            className="btn btn-xs lg:btn-md btn-outline"
            onClick={() => setShowSendModal(true)}
          >
            Mint Tokens
          </button>
        </div>
      </div>
    </>
  );
}

function ModalTokenMint({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const wallet = useWallet();
  const [amount, setAmount] = useState('1');

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
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}
