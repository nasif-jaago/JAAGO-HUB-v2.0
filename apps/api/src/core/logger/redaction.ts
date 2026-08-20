/**
 * Structural Redaction — applied to log objects BEFORE serialization.
 *
 * Architecture:
 * 1. PRIMARY: Path-based redaction on the structured object (before any string output).
 *    This is the reliable, zero-false-positive layer. It redacts known sensitive field names.
 *
 * 2. SECONDARY BACKSTOP: Regex patterns applied to the final serialized string.
 *    This catches high-confidence patterns (JWT shape, Bearer tokens, Luhn-format cards)
 *    in case a sensitive value ends up in an unexpected field (e.g. inside an error message,
 *    a URL query string, or a free-form 'details' field).
 *
 * IMPORTANT:
 * - Redact ONCE, CENTRALLY, here. Never redact in individual services.
 * - Never use regex as the primary layer — it has false positives and misses structural paths.
 * - The security test in __tests__/redaction.test.ts MUST prove a known secret never
 *   appears in the output after redaction.
 *
 * Pino redact paths are configured once at logger creation and applied automatically.
 * The additional structuralRedact() function handles nested/dynamic objects.
 */

export const REDACTED_PLACEHOLDER = "[REDACTED]";

/**
 * Pino redact paths — applied at Pino level (fastest, zero-overhead once configured).
 * These cover the most common locations where secrets appear in structured log objects.
 * Pino uses fast-redact under the hood for O(1) per-path redaction.
 */
export const PINO_REDACT_PATHS: string[] = [
  // Auth
  "password",
  "newPassword",
  "confirmPassword",
  "currentPassword",
  "*.password",
  "*.newPassword",

  // Tokens
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "sessionToken",
  "resetToken",
  "inviteToken",
  "*.token",
  "*.accessToken",
  "*.refreshToken",

  // HTTP headers
  "headers.authorization",
  "headers.Authorization",
  "req.headers.authorization",
  "req.headers.Authorization",
  "request.headers.authorization",

  // API keys / secrets
  "apiKey",
  "api_key",
  "secret",
  "secretKey",
  "*.apiKey",
  "*.api_key",
  "*.secret",
  "*.secretKey",

  // Encryption
  "encryptionKey",
  "kek",
  "dek",
  "privateKey",
  "*.encryptionKey",

  // Payment / financial
  "cardNumber",
  "cvv",
  "cvc",
  "pan",
  "ssn",
  "bankAccount",
  "accountNumber",
  "routingNumber",
  "*.cardNumber",
  "*.cvv",
  "*.bankAccount",

  // Personal identifiers
  "nid",
  "nationalId",
  "passport",
  "*.nid",
  "*.nationalId",

  // SMTP / email service
  "smtpPass",
  "smtpPassword",
  "emailPassword",
];

/**
 * Regex backstop patterns — applied to the serialized JSON string.
 * Only high-confidence, low-false-positive patterns:
 * - JWT shape: three base64url segments separated by dots
 * - Bearer tokens: "Bearer <token>"
 * - Potential Luhn-formatted card numbers (16 consecutive digits with optional dashes)
 */
const REGEX_BACKSTOP_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    // JWT: three base64url parts (eyJ... structure)
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    replacement: "[REDACTED:JWT]",
  },
  {
    // Bearer tokens
    pattern: /Bearer\s+[a-zA-Z0-9._\-+/=]{20,}/gi,
    replacement: "Bearer [REDACTED]",
  },
  {
    // 16-digit card number patterns (with optional spaces or dashes)
    pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    replacement: "[REDACTED:CARD]",
  },
  {
    // service_role or anon JWT prefix patterns in raw strings
    pattern: /"(service_role|anon)"\s*:\s*"[^"]{20,}"/g,
    replacement: '"[REDACTED:SUPABASE_KEY]"',
  },
];

/**
 * Apply regex backstop to a serialized log string.
 * This is a defense-in-depth fallback — the path-based redaction above is primary.
 */
export function applyRegexBackstop(serialized: string): string {
  let result = serialized;
  for (const { pattern, replacement } of REGEX_BACKSTOP_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Deep-redact a plain object by field name (case-insensitive match on key).
 * Used for dynamic objects that bypass Pino's static path configuration
 * (e.g. arbitrary error.details objects, connector response payloads).
 *
 * This is O(n) where n is the number of keys — acceptable for objects
 * going into a log entry (they are small and already bounded by the serializer).
 */
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /(?:^|[_-])(authorization|auth[_-]?header|auth[_-]?token)(?:[_-]|$)/i,
  /(?:^|[_-])credential(?:s)?(?:[_-]|$)/i,
  /private[_-]?key/i,
  /card[_-]?number/i,
  /(?:^|[_-])(cvv|cvc)(?:[_-]|$)/i,
  /(?:^|[_-])ssn(?:[_-]|$)/i,
  /(?:^|[_-])nid(?:[_-]|$)/i,
  /national[_-]?id/i,
  /bank[_-]?account/i,
  /account[_-]?number/i,
  /routing[_-]?number/i,
];

export function deepRedact(obj: unknown, maxDepth = 5): unknown {
  if (maxDepth <= 0) return obj;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => deepRedact(item, maxDepth - 1));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

    if (isSensitive) {
      if (value !== null && typeof value === "object") {
        // If it's a container object like `credentials: { password: ... }`, recurse into it
        redacted[key] = deepRedact(value, maxDepth - 1);
      } else {
        redacted[key] = REDACTED_PLACEHOLDER;
      }
    } else {
      redacted[key] = deepRedact(value, maxDepth - 1);
    }
  }
  return redacted;
}
