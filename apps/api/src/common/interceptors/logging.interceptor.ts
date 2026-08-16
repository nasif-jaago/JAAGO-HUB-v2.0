import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { getLogger } from "@jaago/logger";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const startTime = Date.now();

    const correlationId = request.correlationId ?? (request.headers["x-correlation-id"] as string);
    const traceId = request.traceId;
    const orgId = request.tenant?.orgId;
    const userId = request.user?.id;
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          try {
            const logger = getLogger();
            logger.info(
              {
                correlationId,
                traceId,
                orgId,
                userId,
                httpMethod: method,
                route: url,
                durationMs,
                status: 200,
              },
              `HTTP ${method} ${url} completed in ${durationMs}ms`,
            );
          } catch {
            // Logger may not be initialized in isolated test environments
          }
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - startTime;
          const status = (err as { status?: number })?.status ?? 500;
          try {
            const logger = getLogger();
            logger.error(
              {
                correlationId,
                traceId,
                orgId,
                userId,
                httpMethod: method,
                route: url,
                durationMs,
                status,
                errorCode: (err as { code?: string })?.code ?? "INTERNAL_SERVER_ERROR",
              },
              `HTTP ${method} ${url} failed with status ${status} after ${durationMs}ms`,
            );
          } catch {
            // Logger may not be initialized in isolated test environments
          }
        },
      }),
    );
  }
}
