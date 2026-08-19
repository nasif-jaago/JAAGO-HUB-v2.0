import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Tracer } from "@jaago/observability";

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const reply = http.getResponse();

    const traceCtx = Tracer.extractContext(request.headers);
    request.correlationId = traceCtx.correlationId;
    request.traceId = traceCtx.traceId;

    if (reply && typeof reply.header === "function") {
      reply.header("X-Correlation-ID", traceCtx.correlationId);
      reply.header("traceparent", Tracer.formatTraceParent(traceCtx));
    }

    return next.handle();
  }
}
