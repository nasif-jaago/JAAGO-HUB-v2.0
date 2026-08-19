import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { ApiError } from "@jaago/shared-types";
import { getIssueTemplate } from "@jaago/logger";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred.";
    let fieldErrors: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const errorObj = res as Record<string, unknown>;
        message = (errorObj["message"] as string) || exception.message;
        code = (errorObj["error"] as string) || (errorObj["code"] as string) || `HTTP_${status}`;

        if (Array.isArray(errorObj["message"])) {
          message = errorObj["message"].join(", ");
        }

        if (errorObj["fieldErrors"] && typeof errorObj["fieldErrors"] === "object") {
          fieldErrors = errorObj["fieldErrors"] as Record<string, string>;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if ("code" in exception && typeof (exception as { code: unknown }).code === "string") {
        code = (exception as { code: string }).code;
      }
    }

    // Lookup curated issue template if available
    const template = getIssueTemplate(code);
    if (template && status >= 500) {
      // Add guidance reference for operations
    }

    const correlationId =
      request.correlationId || (request.headers?.["x-correlation-id"] as string) || "unknown";
    const traceId = request.traceId || (request.headers?.["traceparent"] as string) || undefined;

    const errorPayload: ApiError = {
      success: false,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
        correlationId,
        ...(traceId ? { traceId } : {}),
      },
    };

    if (response && typeof response.status === "function" && typeof response.send === "function") {
      response.status(status).send(errorPayload);
    }
  }
}
