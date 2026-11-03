export const convert = (amount, from, to, rate) => {
  const a = Number(amount) || 0;
  const r = Number(rate) || 1;
  if (from === to) return a;
  if (from === 'USD' && to === 'SP') return a * r;
  if (from === 'SP' && to === 'USD') return a / r;
  return a;
};

export const fmtAmount = (n, currency = 'USD') => {
  const v = Number(n) || 0;
  const decimals = currency === 'USD' ? 2 : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
};

export const money = (n, currency = 'USD') =>
  currency === 'SP' ? `${fmtAmount(n, 'SP')} SP` : `$${fmtAmount(n, 'USD')}`;

export const signedMoney = (n, currency) => {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${money(Math.abs(n), currency)}`;
};

export const thisMonth = () => new Date().toISOString().slice(0, 7);
export const today = () => new Date().toISOString().slice(0, 10);

/* تاريخ مختصر بأرقام لاتينية موحّدة */
export const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

/* اسم الشهر بأرقام لاتينية */
export const fmtMonth = (ym, lang) => {
  const [y, m] = ym.split('-').map(Number);
  const loc = lang === 'ar' ? 'ar-SY-u-nu-latn' : 'en-US';
  return new Date(y, m - 1, 1).toLocaleDateString(loc, { month: 'long', year: 'numeric' });
};
