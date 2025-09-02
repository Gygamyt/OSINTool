import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";

export interface CacheableResponse {
  cached: boolean;
  data: any;
}

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data: CacheableResponse) => {
        if (data) {
          if (data.cached) {
            response.statusCode = 200;
          }
          return data;
        }
        return data;
      }),
    );
  }
}
