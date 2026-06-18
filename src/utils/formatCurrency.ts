export const currencySymbols: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
}

export default function formatCurrency(amount: number | string | undefined | null, currencyCode?: string) {
  const num = Number(amount || 0)
  const code = currencyCode || (typeof window !== 'undefined' ? (localStorage.getItem('hostelpro.currency') || 'BDT') : 'BDT')
  const symbol = currencySymbols[code] || '৳'
  try {
    const formatted = num.toLocaleString(undefined)
    return `${symbol}${formatted}`
  } catch (e) {
    return `${symbol}${num}`
  }
}
