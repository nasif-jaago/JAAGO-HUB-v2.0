import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env["API_INTERNAL_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  const path = proxy.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${API_BASE_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

  // Forward incoming headers (with correlation ID)
  const correlationId =
    request.headers.get("x-correlation-id") ||
    `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== "host") {
      headers.set(key, value);
    }
  });
  headers.set("X-Correlation-ID", correlationId);

  let body: BodyInit | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      // Body empty or unparseable
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error duplex required in Node fetch for streaming body
      duplex: "half",
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to backend API";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: errorMessage,
          correlationId,
        },
      },
      { status: 503 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
