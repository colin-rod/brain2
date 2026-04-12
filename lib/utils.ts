import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function summarizeSnippet(text: string | null | undefined, maxChars = 90): string {
  if (!text) return '';
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length <= maxChars ? single : single.slice(0, maxChars).trimEnd() + '…';
}

export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
