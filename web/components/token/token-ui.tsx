'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { createMintToCheckedInstruction } from '@solana/spl-token';
import { IconRefresh } from '@tabler/icons-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AppModal, ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import { useGetTokenAccounts } from '../account/account-data-access';
import { AccountTokenBalance } from '../account/account-ui';
import { useTransactionToast } from '../ui/ui-layout';
import toast from 'react-hot-toast';

export function MintAuthorityTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const [showTokenMintModal, setShowTokenMintModal] = useState(false);
  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <>
      <ModalTokenMint
        hide={() => setShowTokenMintModal(false)}
        show={showTokenMintModal}
        address={address}
        mintPublicKey={
          new PublicKey('Hi3hMa6hpZ1bxX69ubDVYYQvNPnRh2ek5F6cW3a7PhE4')
        }
        tokenAccountPublicKey={
          new PublicKey('8vJv26uFB6GCXF7NnttWmtFTCwLT1B6HMdo3mGdJMhaY')
        }
      />

      <div className="space-y-2">
        <div className="justify-between">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">
              Mint Authority Token Accounts
            </h2>
            <div className="space-x-2">
              {query.isLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={async () => {
                    await query.refetch();
                    await client.invalidateQueries({
                      queryKey: ['getTokenAccountBalance'],
                    });
                  }}
                >
                  <IconRefresh size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        {query.isError && (
          <pre className="alert alert-error">
            Error: {query.error?.message.toString()}
          </pre>
        )}
        {query.isSuccess && (
          <div>
            {query.data.length === 0 ? (
              <div>No token accounts found.</div>
            ) : (
              <table className="table border-4 rounded-lg border-separate border-base-300">
                <thead>
                  <tr>
                    <th>Public Key</th>
                    <th>Mint</th>
                    <th>Mint New Tokens</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map(({ account, pubkey }) => (
                    <tr key={pubkey.toString()}>
                      <td>
                        <div className="flex space-x-2">
                          <span className="font-mono">
                            <ExplorerLink
                              label={ellipsify(pubkey.toString())}
                              path={`account/${pubkey.toString()}`}
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <span className="font-mono">
                            <ExplorerLink
                              label={ellipsify(account.data.parsed.info.mint)}
                              path={`account/${account.data.parsed.info.mint.toString()}`}
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono">
                          <button
                            className="btn btn-xs lg:btn-md btn-outline"
                            onClick={() => setShowTokenMintModal(true)}
                          >
                            Mint Tokens
                          </button>
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono">
                          <AccountTokenBalance address={pubkey} />
                        </span>
                      </td>
                    </tr>
                  ))}

                  {(query.data?.length ?? 0) > 5 && (
                    <tr>
                      <td colSpan={4} className="text-center">
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => setShowAll(!showAll)}
                        >
                          {showAll ? 'Show Less' : 'Show All'}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ModalTokenMint({
  hide,
  show,
  address,
  mintPublicKey,
  tokenAccountPublicKey,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
  mintPublicKey: PublicKey;
  tokenAccountPublicKey: PublicKey;
}) {
  const wallet = useWallet();
  const mutation = useMintToken({
    address,
    mintPublicKey,
    tokenAccountPublicKey,
  });
  const [amount, setAmount] = useState('1');

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>;
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Mint Tokens"
      submitDisabled={false}
      submitLabel="Mint Tokens"
      submit={() => {
        mutation.mutateAsync();
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
    mutationFn: async () => {
      let signature: TransactionSignature = '';
      try {
        const transaction = new Transaction().add(
          createMintToCheckedInstruction(
            mintPublicKey, // mint
            tokenAccountPublicKey, // receiver (should be a token account)
            address, // mint authority
            1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
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
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
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
