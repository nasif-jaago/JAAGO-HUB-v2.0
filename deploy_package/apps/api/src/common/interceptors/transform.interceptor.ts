import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiSuccess } from "@jaago/shared-types";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already enveloped as ApiSuccess, return as-is
        if (data && typeof data === "object" && "success" in data && data.success === true) {
          return data as ApiSuccess<T>;
        }

        // If data contains data + meta structure
        if (data && typeof data === "object" && "data" in data && "meta" in data) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
