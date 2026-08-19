import type { ApiResult } from "@jaago/shared-types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly correlationId?: string | undefined;
  readonly fieldErrors?: Record<string, string> | undefined;

  constructor(message: string, code = "CLIENT_ERROR", correlationId?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.correlationId = correlationId;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = normalizedPath.startsWith("/api") ? normalizedPath : `/api${normalizedPath}`;

  const method = (options.method || "GET").toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  const isBodyMethod = method !== "GET" && method !== "HEAD";

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...(isBodyMethod ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(isBodyMethod && !hasBody ? { body: "{}" } : {}),
  };

  const response = await fetch(url, fetchOptions);

  const json = (await response.json()) as ApiResult<T>;

  if (!response.ok || !json.success) {
    const errorInfo = "error" in json ? json.error : undefined;
    throw new ApiClientError(
      errorInfo?.message || `Request failed with status ${response.status}`,
      errorInfo?.code || `HTTP_${response.status}`,
      errorInfo?.correlationId,
      errorInfo?.fieldErrors,
    );
  }

  return json.data;
}
