import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function sanitizeNumberInput(value) {
  const raw = String(value ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
  const firstDotIdx = raw.indexOf('.');
  if (firstDotIdx === -1) return raw;
  return `${raw.slice(0, firstDotIdx + 1)}${raw.slice(firstDotIdx + 1).replace(/\./g, '')}`;
}

export function formatNumberInput(value) {
  const clean = sanitizeNumberInput(value);
  if (!clean) return '';

  const hasDot = clean.includes('.');
  const [intPartRaw, decimalPart = ''] = clean.split('.');
  const normalizedInt = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const intWithCommas = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!hasDot) return intWithCommas;
  return `${intWithCommas}.${decimalPart}`;
}

export function parseNumberInput(value) {
  const clean = sanitizeNumberInput(value);
  return clean ? Number(clean) : 0;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function generateId(prefix, existingIds) {
  const year = new Date().getFullYear();
  const nums = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => {
      const parts = id.split('-');
      return parseInt(parts[parts.length - 1], 10);
    })
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
