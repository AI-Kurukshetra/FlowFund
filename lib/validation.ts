const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
const REG_NUMBER_REGEX = /^[A-Za-z0-9/-]{6,30}$/;
const TAX_ID_REGEX = /^[A-Za-z0-9-]{6,20}$/;
const INVOICE_NUMBER_REGEX = /^[A-Za-z0-9-]{4,30}$/;
const TEXT_WITH_NUMBERS_REGEX = /^[A-Za-z0-9][A-Za-z0-9 '&.,/-]{1,119}$/;

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

export function isValidPersonName(value: string) {
  return NAME_REGEX.test(value.trim());
}

export function isValidBusinessName(value: string) {
  return TEXT_WITH_NUMBERS_REGEX.test(value.trim()) && value.trim().length >= 2;
}

export function isValidIndustry(value: string) {
  const clean = value.trim();
  return clean.length >= 2 && clean.length <= 60;
}

export function isValidAddress(value: string) {
  const clean = value.trim();
  return clean.length >= 10 && clean.length <= 180 && /\d/.test(clean);
}

export function isValidRegistrationNumber(value: string) {
  return REG_NUMBER_REGEX.test(value.trim());
}

export function isValidTaxId(value: string) {
  return TAX_ID_REGEX.test(value.trim());
}

export function isValidInvoiceNumber(value: string) {
  return INVOICE_NUMBER_REGEX.test(value.trim());
}

export function isReasonableAmount(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function isValidYearsInBusiness(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 80;
}

export function isReasonableLoanPurpose(value: string) {
  const clean = value.trim();
  return clean.length >= 10 && clean.length <= 300;
}

export function isDueDateInRange(value: string, maxDaysAhead = 365) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + maxDaysAhead);

  return date >= today && date <= max;
}

export function isValidUpload(file: File, maxMb: number, acceptedPrefixes: string[]) {
  const sizeOk = file.size <= maxMb * 1024 * 1024;
  const typeOk = acceptedPrefixes.some((prefix) => file.type.startsWith(prefix));
  return sizeOk && typeOk;
}
