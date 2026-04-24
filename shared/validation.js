const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUUID(value, fieldName) {
  if (!value || !UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`);
  }
}

function validateEmail(value) {
  if (!value || !EMAIL_REGEX.test(value)) {
    throw new Error("Invalid email address");
  }
}

function validateString(
  value,
  fieldName,
  { minLength = 1, maxLength = 500 } = {},
) {
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

function validateEnum(value, fieldName, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(
      `Invalid ${fieldName}: must be one of ${allowedValues.join(", ")}`,
    );
  }
}

function validatePagination(page, limit) {
  const p = Math.max(1, Math.floor(page || 1));
  const l = Math.min(100, Math.max(1, Math.floor(limit || 20)));
  return { page: p, limit: l };
}

module.exports = {
  validateUUID,
  validateEmail,
  validateString,
  validateEnum,
  validatePagination,
};
