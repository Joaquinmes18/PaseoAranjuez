import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatBs = (n: number) => `Bs ${n.toLocaleString('es-BO')}`;

export const formatPts = (n: number) => n.toLocaleString('es-BO');

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const randomPin = () => String(Math.floor(1000 + Math.random() * 9000));

export const randomHex = (bytes: number) =>
  '0x' +
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

export const randomCode = (len = 5) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => chars[b % chars.length]).join('');
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
};

export const POLYGONSCAN_TX = (hash: string) => `https://amoy.polygonscan.com/tx/${hash}`;
