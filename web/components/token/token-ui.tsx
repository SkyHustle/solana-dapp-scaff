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
import { useMintToken } from './token-data-access';

export function MintAuthorityTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const [showTokenMintModal, setShowTokenMintModal] = useState(false);
  const [selectedTokenDetails, setSelectedTokenDetails] = useState<
    | {
        mintPublicKey: PublicKey;
        tokenAccountPublicKey: PublicKey;
      }
    | undefined
  >(undefined);

  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();

  const items = useMemo(() => {
    const validItems =
      query.data?.map((item) => ({
        ...item,
        mintPublicKey: new PublicKey(item.account.data.parsed.info.mint),
        tokenAccountPublicKey: item.pubkey,
      })) ?? [];

    return showAll ? validItems : validItems.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <>
      {selectedTokenDetails && (
        <ModalTokenMint
          hide={() => setShowTokenMintModal(false)}
          show={showTokenMintModal}
          address={address}
          mintPublicKey={selectedTokenDetails.mintPublicKey}
          tokenAccountPublicKey={selectedTokenDetails.tokenAccountPublicKey}
        />
      )}

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
                  {items?.map(
                    ({
                      account,
                      pubkey,
                      mintPublicKey,
                      tokenAccountPublicKey,
                    }) => (
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
                              onClick={() => {
                                setSelectedTokenDetails({
                                  mintPublicKey,
                                  tokenAccountPublicKey,
                                });
                                setShowTokenMintModal(true);
                              }}
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
                    )
                  )}

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
        mutation.mutateAsync({ amount: parseFloat(amount) }).then(() => hide());
      }}
    >
      <input
        disabled={false}
        type="number"
        step="1"
        min="1"
        max="100"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}
