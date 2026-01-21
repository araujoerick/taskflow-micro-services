import { Injectable, HttpException, HttpStatus, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { Request } from 'express';
import { catchError, firstValueFrom } from 'rxjs';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable({ scope: Scope.REQUEST })
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async proxyRequest(
    serviceUrl: string,
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string>,
    queryParams?: Record<string, unknown>,
  ): Promise<unknown> {
    const url = `${serviceUrl}${path}`;
    const correlationId = this.request.headers[CORRELATION_ID_HEADER] as string;

    const response$ = this.httpService.request({
      method: method as any,
      url,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        [CORRELATION_ID_HEADER]: correlationId,
      },
      data,
      params: queryParams,
      timeout: 30000, // 30 seconds
    }) as any;

    const responseObservable = response$.pipe(
      catchError((error: AxiosError) => {
        throw this.handleProxyError(error);
      }),
    );

    const response = await firstValueFrom(responseObservable);
    return (response as any).data;
  }

  private handleProxyError(error: AxiosError): HttpException {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = (error.response?.data as { message?: string })?.message || error.message;

    return new HttpException(
      {
        statusCode: status,
        message: message,
        error: error.response?.statusText || 'Service Error',
      },
      status,
    );
  }
}
