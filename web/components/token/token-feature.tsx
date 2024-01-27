'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { useCreateMint } from './token-data-access';
import { MintAuthorityTokens } from './token-ui';

export default function TokenAccounts() {
  const { publicKey } = useWallet();

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
      <div className="space-y-2 pt-10">
        <div className="justify-between">
          <div className="space-x-2">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => createMint()}
            >
              Create New Token
            </button>
          </div>
        </div>
        <div></div>
      </div>
      <MintAuthorityTokens address={publicKey} />
    </>
  );
}
