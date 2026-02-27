// Country list with currency and phone code information
export const countries = [
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', locale: 'en-IN', phoneCode: '+91', phonePattern: '^[6-9]\\d{9}$', phonePlaceholder: '9876543210', timezone: 'Asia/Kolkata' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', locale: 'en-US', phoneCode: '+1', phonePattern: '^\\d{10}$', phonePlaceholder: '1234567890', timezone: 'America/New_York' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', locale: 'en-GB', phoneCode: '+44', phonePattern: '^\\d{10,11}$', phonePlaceholder: '7123456789', timezone: 'Europe/London' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', locale: 'en-AE', phoneCode: '+971', phonePattern: '^\\d{9}$', phonePlaceholder: '501234567', timezone: 'Asia/Dubai' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', locale: 'en-AU', phoneCode: '+61', phonePattern: '^\\d{9}$', phonePlaceholder: '412345678', timezone: 'Australia/Sydney' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', locale: 'en-CA', phoneCode: '+1', phonePattern: '^\\d{10}$', phonePlaceholder: '4161234567', timezone: 'America/Toronto' },
  { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€', locale: 'de-DE', phoneCode: '+49', phonePattern: '^\\d{10,11}$', phonePlaceholder: '1512345678', timezone: 'Europe/Berlin' },
  { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', locale: 'fr-FR', phoneCode: '+33', phonePattern: '^\\d{9}$', phonePlaceholder: '612345678', timezone: 'Europe/Paris' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', locale: 'en-SG', phoneCode: '+65', phonePattern: '^\\d{8}$', phonePlaceholder: '91234567', timezone: 'Asia/Singapore' },
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', locale: 'ja-JP', phoneCode: '+81', phonePattern: '^\\d{10,11}$', phonePlaceholder: '9012345678', timezone: 'Asia/Tokyo' },
  { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', locale: 'zh-CN', phoneCode: '+86', phonePattern: '^\\d{11}$', phonePlaceholder: '13812345678', timezone: 'Asia/Shanghai' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', locale: 'ar-SA', phoneCode: '+966', phonePattern: '^\\d{9}$', phonePlaceholder: '501234567', timezone: 'Asia/Riyadh' },
  { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: '﷼', locale: 'en-QA', phoneCode: '+974', phonePattern: '^\\d{8}$', phonePlaceholder: '50123456', timezone: 'Asia/Doha' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD', symbol: 'د.ك', locale: 'en-KW', phoneCode: '+965', phonePattern: '^\\d{8}$', phonePlaceholder: '50123456', timezone: 'Asia/Kuwait' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: 'د.ب', locale: 'en-BH', phoneCode: '+973', phonePattern: '^\\d{8}$', phonePlaceholder: '30123456', timezone: 'Asia/Bahrain' },
  { code: 'OM', name: 'Oman', currency: 'OMR', symbol: '﷼', locale: 'en-OM', phoneCode: '+968', phonePattern: '^\\d{8}$', phonePlaceholder: '91234567', timezone: 'Asia/Muscat' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', symbol: '₨', locale: 'en-NP', phoneCode: '+977', phonePattern: '^\\d{10}$', phonePlaceholder: '9812345678', timezone: 'Asia/Kathmandu' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', symbol: '৳', locale: 'en-BD', phoneCode: '+880', phonePattern: '^\\d{10,11}$', phonePlaceholder: '1812345678', timezone: 'Asia/Dhaka' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', symbol: '₨', locale: 'en-PK', phoneCode: '+92', phonePattern: '^\\d{10}$', phonePlaceholder: '3012345678', timezone: 'Asia/Karachi' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', symbol: '₨', locale: 'en-LK', phoneCode: '+94', phonePattern: '^\\d{9}$', phonePlaceholder: '712345678', timezone: 'Asia/Colombo' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', locale: 'en-MY', phoneCode: '+60', phonePattern: '^\\d{9,10}$', phonePlaceholder: '121234567', timezone: 'Asia/Kuala_Lumpur' },
  { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿', locale: 'en-TH', phoneCode: '+66', phonePattern: '^\\d{9}$', phonePlaceholder: '812345678', timezone: 'Asia/Bangkok' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', locale: 'en-PH', phoneCode: '+63', phonePattern: '^\\d{10}$', phonePlaceholder: '9171234567', timezone: 'Asia/Manila' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', locale: 'en-ID', phoneCode: '+62', phonePattern: '^\\d{10,12}$', phonePlaceholder: '81234567890', timezone: 'Asia/Jakarta' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫', locale: 'en-VN', phoneCode: '+84', phonePattern: '^\\d{9,10}$', phonePlaceholder: '912345678', timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩', locale: 'en-KR', phoneCode: '+82', phonePattern: '^\\d{10,11}$', phonePlaceholder: '1012345678', timezone: 'Asia/Seoul' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', locale: 'en-NZ', phoneCode: '+64', phonePattern: '^\\d{9}$', phonePlaceholder: '211234567', timezone: 'Pacific/Auckland' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', locale: 'en-ZA', phoneCode: '+27', phonePattern: '^\\d{9}$', phonePlaceholder: '721234567', timezone: 'Africa/Johannesburg' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', locale: 'en-NG', phoneCode: '+234', phonePattern: '^\\d{10}$', phonePlaceholder: '8012345678', timezone: 'Africa/Lagos' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', locale: 'en-KE', phoneCode: '+254', phonePattern: '^\\d{9}$', phonePlaceholder: '712123456', timezone: 'Africa/Nairobi' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£', locale: 'en-EG', phoneCode: '+20', phonePattern: '^\\d{10}$', phonePlaceholder: '1012345678', timezone: 'Africa/Cairo' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', locale: 'pt-BR', phoneCode: '+55', phonePattern: '^\\d{10,11}$', phonePlaceholder: '11912345678', timezone: 'America/Sao_Paulo' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: 'Mex$', locale: 'es-MX', phoneCode: '+52', phonePattern: '^\\d{10}$', phonePlaceholder: '5512345678', timezone: 'America/Mexico_City' },
  { code: 'RU', name: 'Russia', currency: 'RUB', symbol: '₽', locale: 'ru-RU', phoneCode: '+7', phonePattern: '^\\d{10}$', phonePlaceholder: '9123456789', timezone: 'Europe/Moscow' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF', locale: 'de-CH', phoneCode: '+41', phonePattern: '^\\d{9}$', phonePlaceholder: '791234567', timezone: 'Europe/Zurich' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr', locale: 'sv-SE', phoneCode: '+46', phonePattern: '^\\d{9}$', phonePlaceholder: '701234567', timezone: 'Europe/Stockholm' },
  { code: 'NO', name: 'Norway', currency: 'NOK', symbol: 'kr', locale: 'en-NO', phoneCode: '+47', phonePattern: '^\\d{8}$', phonePlaceholder: '41234567', timezone: 'Europe/Oslo' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', symbol: 'kr', locale: 'da-DK', phoneCode: '+45', phonePattern: '^\\d{8}$', phonePlaceholder: '20123456', timezone: 'Europe/Copenhagen' },
  { code: 'PL', name: 'Poland', currency: 'PLN', symbol: 'zł', locale: 'pl-PL', phoneCode: '+48', phonePattern: '^\\d{9}$', phonePlaceholder: '512345678', timezone: 'Europe/Warsaw' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', symbol: '₺', locale: 'en-TR', phoneCode: '+90', phonePattern: '^\\d{10}$', phonePlaceholder: '5321234567', timezone: 'Europe/Istanbul' },
  { code: 'IL', name: 'Israel', currency: 'ILS', symbol: '₪', locale: 'en-IL', phoneCode: '+972', phonePattern: '^\\d{9}$', phonePlaceholder: '501234567', timezone: 'Asia/Jerusalem' },
  { code: 'OTHER', name: 'Other', currency: 'USD', symbol: '$', locale: 'en-US', phoneCode: '+', phonePattern: '^\\d{6,15}$', phonePlaceholder: '123456789', timezone: 'UTC' },
];

// Get country by code
export const getCountryByCode = (code) => {
  return countries.find(c => c.code === code) || countries[0];
};

// Get user's stored country preference
export const getUserCountry = () => {
  const savedCountry = localStorage.getItem('userCountry');
  if (savedCountry) {
    return getCountryByCode(savedCountry);
  }
  // Default to India
  return getCountryByCode('IN');
};

// Set user country preference
export const setUserCountry = (code) => {
  localStorage.setItem('userCountry', code);
};

// Format currency based on country code (for employee-specific currency)
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

// Get phone code for country
export const getPhoneCode = (countryCode) => {
  const country = getCountryByCode(countryCode);
  return country.phoneCode;
};

// Validate phone number for country
export const validatePhone = (phone, countryCode) => {
  const country = getCountryByCode(countryCode);
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Remove country code if present
  const phoneWithoutCode = cleanPhone.replace(new RegExp(`^\\${country.phoneCode.replace('+', '\\+')}?`), '');
  // Test against pattern
  const pattern = new RegExp(country.phonePattern);
  return pattern.test(phoneWithoutCode);
};

// Format phone number with country code
export const formatPhone = (phone, countryCode) => {
  const country = getCountryByCode(countryCode);
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // If already has country code, return as is
  if (cleanPhone.startsWith(country.phoneCode)) {
    return cleanPhone;
  }
  // Add country code
  return `${country.phoneCode}${cleanPhone}`;
};

// Get phone placeholder for country
export const getPhonePlaceholder = (countryCode) => {
  const country = getCountryByCode(countryCode);
  return `${country.phoneCode} ${country.phonePlaceholder}`;
};

// Get timezone for country
export const getTimezone = (countryCode) => {
  const country = getCountryByCode(countryCode);
  return country.timezone;
};

// Format date with timezone
export const formatDateWithTimezone = (date, countryCode) => {
  const country = getCountryByCode(countryCode);
  try {
    return new Intl.DateTimeFormat(country.locale, {
      timeZone: country.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch (e) {
    return new Date(date).toLocaleString();
  }
};

// Format time with timezone
export const formatTimeWithTimezone = (date, countryCode) => {
  const country = getCountryByCode(countryCode);
  try {
    return new Intl.DateTimeFormat(country.locale, {
      timeZone: country.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(date));
  } catch (e) {
    return new Date(date).toLocaleTimeString();
  }
};

// Get current time in timezone
export const getCurrentTimeInTimezone = (countryCode) => {
  const country = getCountryByCode(countryCode);
  try {
    return new Intl.DateTimeFormat(country.locale, {
      timeZone: country.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch (e) {
    return new Date().toLocaleTimeString();
  }
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