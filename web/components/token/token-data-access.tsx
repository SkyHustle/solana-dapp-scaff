'use client';
import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  TransactionSignature,
} from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useTransactionToast } from '../ui/ui-layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToCheckedInstruction,
} from '@solana/spl-token';
import toast from 'react-hot-toast';

export function useCreateMint({ address }: { address: PublicKey | null }) {
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

        const associatedToken = await getAssociatedTokenAddress(
          tokenMint.publicKey,
          publicKey!,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey!,
            associatedToken,
            publicKey!,
            tokenMint.publicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        // prompts the user to sign the transaction and submit it to the network
        signature = await sendTransaction(transaction, connection, {
          signers: [tokenMint],
        });
        console.log('Token Mint Tx Sig ', signature);

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

export function useMintToken({
  address,
  mintPublicKey,
  tokenAccountPublicKey,
}: {
  address: PublicKey;
  mintPublicKey: PublicKey;
  tokenAccountPublicKey: PublicKey;
}) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['mint-token', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (input: { amount: number }) => {
      let signature: TransactionSignature = '';
      try {
        const transaction = new Transaction().add(
          createMintToCheckedInstruction(
            mintPublicKey, // mint
            tokenAccountPublicKey, // receiver (should be a token account)
            address, // mint authority
            input.amount, // amount of tokens to mint
            0 // decimals
          )
        );

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log('error', `Transaction failed! ${error}`, signature);

        return;
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
            {
              endpoint: connection.rpcEndpoint,
              account: tokenAccountPublicKey.toString(),
            },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}
