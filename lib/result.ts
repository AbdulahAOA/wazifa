export type ServiceErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid_transition"
  | "closed"
  | "duplicate";

export type ServiceError = {
  ok: false;
  code: ServiceErrorCode;
  error: string;
};

export type ServiceOk<T> = {
  ok: true;
  data: T;
};

export type ServiceResult<T> = ServiceOk<T> | ServiceError;

export function ok<T>(data: T): ServiceOk<T> {
  return { ok: true, data };
}

export function fail(code: ServiceErrorCode, error: string): ServiceError {
  return { ok: false, code, error };
}

export function isUniqueViolation(error: unknown) {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && (current as { code?: unknown }).code === "23505") return true;
    const message = "message" in current ? String((current as { message?: unknown }).message) : "";
    if (message.toLowerCase().includes("duplicate key") || message.toLowerCase().includes("unique constraint")) {
      return true;
    }
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}
