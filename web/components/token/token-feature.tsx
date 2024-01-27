'use client';
import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  TransactionSignature,
} from '@solana/web3.js';
import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AppModal } from '../ui/ui-layout';
import { WalletButton } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
} from '@solana/spl-token';
import toast from 'react-hot-toast';

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

function useCreateMint({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const { publicKey, sendTransaction } = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'create-token-mint',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async () => {
      let signature: TransactionSignature = '';
      try {
        // Token Mints are accounts which hold data ABOUT a specific token.
        // Token Mints DO NOT hold tokens themselves.
        const tokenMint = Keypair.generate();
        // amount of SOL required for the account to not be deallocated
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        // `token.createMint` function creates a transaction with the following two instruction: `createAccount` and `createInitializeMintInstruction`.
        const transaction = new Transaction().add(
          // creates a new account
          SystemProgram.createAccount({
            fromPubkey: publicKey!,
            newAccountPubkey: tokenMint.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
          // initializes the new account as a Token Mint account
          createInitializeMintInstruction(
            tokenMint.publicKey,
            0,
            publicKey!,
            TOKEN_PROGRAM_ID
          )
        );

        // prompts the user to sign the transaction and submit it to the network
        signature = await sendTransaction(transaction, connection, {
          signers: [tokenMint],
        });

        console.log(signature);
        return signature;
      } catch (err) {
        toast.error('Error creating Token Mint');
        console.log('error', err);
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-token-account-balance',
            { endpoint: connection.rpcEndpoint, account: address!.toString() },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
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
