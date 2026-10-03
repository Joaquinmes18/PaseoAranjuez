import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Contract, JsonRpcProvider, Wallet, formatUnits } from 'ethers';
import abi from '../contracts/PaseoTokenABI.json';
import { randomHex, sleep } from '../lib/utils';

/**
 * Web3 invisible: el centro comercial actúa como Relayer y patrocina el gas.
 * - Modo "onchain": si hay VITE_PASEO_TOKEN_ADDRESS + VITE_RELAYER_PRIVATE_KEY, se firma y envía a Polygon Amoy.
 * - Modo "simulated": se emulan tx locales (hash, latencia) para que la demo nunca falle.
 */

const AMOY_CHAIN_ID = 80002;
const RPC_URL = import.meta.env.VITE_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology/';
const TOKEN_ADDRESS = (import.meta.env.VITE_PASEO_TOKEN_ADDRESS as string | undefined) ?? '';
const RELAYER_PK = (import.meta.env.VITE_RELAYER_PRIVATE_KEY as string | undefined) ?? '';

const hasToken = /^0x[0-9a-fA-F]{40}$/.test(TOKEN_ADDRESS) && !/^0x0{40}$/.test(TOKEN_ADDRESS);
const hasRelayer = /^(0x)?[0-9a-fA-F]{64}$/.test(RELAYER_PK);

export type Web3Mode = 'onchain' | 'simulated';
export type NetworkStatus = 'checking' | 'online' | 'offline';

export interface RelayResult {
  txHash: string;
  onChain: boolean;
}

interface Web3ContextValue {
  mode: Web3Mode;
  networkStatus: NetworkStatus;
  blockNumber: number | null;
  tokenAddress: string | null;
  chainName: string;
  pendingTx: number;
  relayMint: (to: string, amount: number, reason: string) => Promise<RelayResult>;
  relayBurn: (from: string, amount: number, rewardId: string) => Promise<RelayResult>;
  readOnChainBalance: (address: string) => Promise<number | null>;
}

const Web3Context = createContext<Web3ContextValue | null>(null);

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('checking');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [pendingTx, setPendingTx] = useState(0);

  const provider = useMemo(() => new JsonRpcProvider(RPC_URL, AMOY_CHAIN_ID, { staticNetwork: true }), []);

  const contract = useMemo(() => {
    if (!hasToken) return null;
    const runner = hasRelayer ? new Wallet(RELAYER_PK, provider) : provider;
    return new Contract(TOKEN_ADDRESS, abi, runner);
  }, [provider]);

  const mode: Web3Mode = contract && hasRelayer && networkStatus !== 'offline' ? 'onchain' : 'simulated';

  // Heartbeat de red: muestra el bloque actual de Polygon Amoy si el RPC responde.
  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        const bn = await withTimeout(provider.getBlockNumber(), 6000);
        if (!alive) return;
        setBlockNumber(bn);
        setNetworkStatus('online');
      } catch {
        if (alive) setNetworkStatus('offline');
      }
    };
    ping();
    const id = setInterval(ping, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [provider]);

  const simulate = useCallback(async (): Promise<RelayResult> => {
    await sleep(700 + Math.random() * 600);
    return { txHash: randomHex(32), onChain: false };
  }, []);

  const send = useCallback(
    async (method: 'awardPoints' | 'redeemReward', addr: string, amount: number, memo: string) => {
      setPendingTx((n) => n + 1);
      try {
        if (mode === 'onchain' && contract) {
          try {
            const tx = await withTimeout<{ hash: string; wait: (c?: number) => Promise<unknown> }>(
              contract[method](addr, amount, memo),
              20000,
            );
            // No bloqueamos la UI esperando confirmación; el hash ya es verificable en Polygonscan.
            tx.wait(1).catch((e) => console.warn('[Relayer] confirmación fallida', e));
            return { txHash: tx.hash, onChain: true };
          } catch (e) {
            console.warn('[Relayer] fallback a simulación:', e);
          }
        }
        return await simulate();
      } finally {
        setPendingTx((n) => n - 1);
      }
    },
    [mode, contract, simulate],
  );

  const relayMint = useCallback(
    (to: string, amount: number, reason: string) => send('awardPoints', to, amount, reason),
    [send],
  );
  const relayBurn = useCallback(
    (from: string, amount: number, rewardId: string) => send('redeemReward', from, amount, rewardId),
    [send],
  );

  const readOnChainBalance = useCallback(
    async (address: string) => {
      if (!contract) return null;
      try {
        const raw: bigint = await withTimeout(contract.balanceOf(address), 6000);
        return Number(formatUnits(raw, 18));
      } catch {
        return null;
      }
    },
    [contract],
  );

  const value: Web3ContextValue = {
    mode,
    networkStatus,
    blockNumber,
    tokenAddress: hasToken ? TOKEN_ADDRESS : null,
    chainName: 'Polygon Amoy',
    pendingTx,
    relayMint,
    relayBurn,
    readOnChainBalance,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 debe usarse dentro de <Web3Provider>');
  return ctx;
}
