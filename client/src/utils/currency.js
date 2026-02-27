// Country list with currency information
export const countries = [
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', locale: 'en-IN' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', locale: 'en-AE' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', locale: 'en-AU' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', locale: 'en-CA' },
  { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', locale: 'fr-FR' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', locale: 'en-SG' },
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', locale: 'ja-JP' },
  { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', locale: 'ar-SA' },
  { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: '﷼', locale: 'en-QA' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD', symbol: 'د.ك', locale: 'en-KW' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: 'د.ب', locale: 'en-BH' },
  { code: 'OM', name: 'Oman', currency: 'OMR', symbol: '﷼', locale: 'en-OM' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', symbol: '₨', locale: 'en-NP' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', symbol: '৳', locale: 'en-BD' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', symbol: '₨', locale: 'en-PK' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', symbol: '₨', locale: 'en-LK' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', locale: 'en-MY' },
  { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿', locale: 'en-TH' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', locale: 'en-PH' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', locale: 'en-ID' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫', locale: 'en-VN' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩', locale: 'en-KR' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', locale: 'en-NZ' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', locale: 'en-ZA' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', locale: 'en-NG' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', locale: 'en-KE' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£', locale: 'en-EG' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: 'Mex$', locale: 'es-MX' },
  { code: 'RU', name: 'Russia', currency: 'RUB', symbol: '₽', locale: 'ru-RU' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF', locale: 'de-CH' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr', locale: 'sv-SE' },
  { code: 'NO', name: 'Norway', currency: 'NOK', symbol: 'kr', locale: 'en-NO' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', symbol: 'kr', locale: 'da-DK' },
  { code: 'PL', name: 'Poland', currency: 'PLN', symbol: 'zł', locale: 'pl-PL' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', symbol: '₺', locale: 'en-TR' },
  { code: 'IL', name: 'Israel', currency: 'ILS', symbol: '₪', locale: 'en-IL' },
  { code: 'OTHER', name: 'Other', currency: 'USD', symbol: '$', locale: 'en-US' },
];

// Get country by code
export const getCountryByCode = (code) => {
  return countries.find(c => c.code === code) || countries[0];
};

// Get user's country from localStorage or detect from browser
export const getUserCountry = () => {
  // First check if user has set their country in localStorage
  const savedCountry = localStorage.getItem('userCountry');
  if (savedCountry) {
    return getCountryByCode(savedCountry);
  }

  // Try to detect from browser timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneToCountry = {
      'Asia/Kolkata': 'IN',
      'Asia/Calcutta': 'IN',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'Europe/London': 'GB',
      'Asia/Dubai': 'AE',
      'Australia/Sydney': 'AU',
      'America/Toronto': 'CA',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Asia/Singapore': 'SG',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Riyadh': 'SA',
      'Asia/Doha': 'QA',
      'Asia/Kuwait': 'KW',
      'Asia/Bahrain': 'BH',
      'Asia/Muscat': 'OM',
      'Asia/Kathmandu': 'NP',
      'Asia/Dhaka': 'BD',
      'Asia/Karachi': 'PK',
      'Asia/Colombo': 'LK',
      'Asia/Kuala_Lumpur': 'MY',
      'Asia/Bangkok': 'TH',
      'Asia/Manila': 'PH',
      'Asia/Jakarta': 'ID',
      'Asia/Ho_Chi_Minh': 'VN',
      'Asia/Seoul': 'KR',
    };

    const countryCode = timezoneToCountry[timezone];
    if (countryCode) {
      return getCountryByCode(countryCode);
    }
  } catch (e) {
    console.log('Could not detect country from timezone');
  }

  // Default to India (most common for this HR system)
  return getCountryByCode('IN');
};

// Set user country
export const setUserCountry = (code) => {
  localStorage.setItem('userCountry', code);
};

// Format currency based on country
export const formatCurrency = (amount, countryCode = null) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  const country = countryCode ? getCountryByCode(countryCode) : getUserCountry();

  try {
    return new Intl.NumberFormat(country.locale, {
      style: 'currency',
      currency: country.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback to simple formatting
    return `${country.symbol}${amount.toLocaleString()}`;
  }
};

// Get currency symbol
export const getCurrencySymbol = (countryCode = null) => {
  const country = countryCode ? getCountryByCode(countryCode) : getUserCountry();
  return country.symbol;
};

// Get currency code
export const getCurrencyCode = (countryCode = null) => {
  const country = countryCode ? getCountryByCode(countryCode) : getUserCountry();
  return country.currency;
};

// Format number with locale
export const formatNumber = (number, countryCode = null) => {
  const country = countryCode ? getCountryByCode(countryCode) : getUserCountry();
  return new Intl.NumberFormat(country.locale).format(number);
};

// Format date with locale
export const formatDate = (date, countryCode = null) => {
  const country = countryCode ? getCountryByCode(countryCode) : getUserCountry();
  return new Intl.DateTimeFormat(country.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};