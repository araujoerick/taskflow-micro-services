import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';

@Injectable()
export class ProxyService {
  async proxyRequest(
    serviceUrl: string,
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string>,
    queryParams?: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const config: AxiosRequestConfig = {
        method: method as AxiosRequestConfig['method'],
        url: `${serviceUrl}${path}`,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        data,
        params: queryParams,
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      this.handleProxyError(error);
    }
  }

  private handleProxyError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = (axiosError.response?.data as { message?: string })?.message || axiosError.message;

      throw new HttpException(
        {
          statusCode: status,
          message: message,
          error: axiosError.response?.statusText || 'Service Error',
        },
        status,
      );
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
