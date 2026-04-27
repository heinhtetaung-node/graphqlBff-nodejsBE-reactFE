const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUUID(
  value: string | undefined,
  fieldName: string,
): void {
  if (!value || !UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`);
  }
}

export function validateEmail(value: string | undefined): void {
  if (!value || !EMAIL_REGEX.test(value)) {
    throw new Error("Invalid email address");
  }
}

interface StringValidationOptions {
  minLength?: number;
  maxLength?: number;
}

export function validateString(
  value: string | undefined,
  fieldName: string,
  { minLength = 1, maxLength = 500 }: StringValidationOptions = {},
): string {
  if (!value || typeof value !== "string") {
    throw new Error(`${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

export function validateEnum(
  value: string | undefined,
  fieldName: string,
  allowedValues: string[],
): void {
  if (!value || !allowedValues.includes(value)) {
    throw new Error(
      `Invalid ${fieldName}: must be one of ${allowedValues.join(", ")}`,
    );
  }
}

export interface PaginationResult {
  page: number;
  limit: number;
}

export function validatePagination(
  page?: number,
  limit?: number,
): PaginationResult {
  const p = Math.max(1, Math.floor(page || 1));
  const l = Math.min(100, Math.max(1, Math.floor(limit || 20)));
  return { page: p, limit: l };
}
