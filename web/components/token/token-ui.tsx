'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconRefresh } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AppModal, ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import { useGetTokenAccounts } from '../account/account-data-access';
import { AccountTokenBalance } from '../account/account-ui';

export function MintAuthorityTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <>
      <ModalTokenMint
        address={address}
        show={showSendModal}
        hide={() => setShowSendModal(false)}
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
                            onClick={() => setShowSendModal(true)}
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
