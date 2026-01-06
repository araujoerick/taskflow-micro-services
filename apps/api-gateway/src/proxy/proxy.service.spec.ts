import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from './proxy.service';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: HttpService;

  const mockRequest = {
    headers: {
      'X-Correlation-ID': 'test-correlation-id',
    },
  };

  const mockHttpService = {
    request: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('proxyRequest', () => {
    it('should successfully proxy a GET request', async () => {
      const mockResponseData = { data: 'test response' };
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      mockHttpService.request.mockReturnValue(of(mockAxiosResponse));

      const result = await service.proxyRequest('http://localhost:3001', '/auth/login', 'GET');

      expect(result).toEqual(mockResponseData);
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'http://localhost:3001/auth/login',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          }),
        }),
      );
    });

    it('should successfully proxy a POST request with data', async () => {
      const mockRequestData = { email: 'test@example.com', password: 'password' };
      const mockResponseData = { accessToken: 'token' };
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      mockHttpService.request.mockReturnValue(of(mockAxiosResponse));

      const result = await service.proxyRequest(
        'http://localhost:3001',
        '/auth/login',
        'POST',
        mockRequestData,
      );

      expect(result).toEqual(mockResponseData);
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'http://localhost:3001/auth/login',
          data: mockRequestData,
        }),
      );
    });

    it('should pass authorization header to downstream service', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      mockHttpService.request.mockReturnValue(of(mockAxiosResponse));

      await service.proxyRequest('http://localhost:3002', '/tasks', 'GET', undefined, {
        Authorization: 'Bearer test-token',
      });

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should pass query parameters to downstream service', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      mockHttpService.request.mockReturnValue(of(mockAxiosResponse));

      await service.proxyRequest('http://localhost:3002', '/tasks', 'GET', undefined, undefined, {
        page: 1,
        limit: 10,
      });

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { page: 1, limit: 10 },
        }),
      );
    });

    it('should handle 401 Unauthorized error from downstream', async () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid credentials' },
          headers: {},
          config: { headers: {} } as any,
        },
        message: 'Request failed with status code 401',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.proxyRequest('http://localhost:3001', '/auth/login', 'POST', {
          email: 'wrong@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(HttpException);

      await expect(
        service.proxyRequest('http://localhost:3001', '/auth/login', 'POST'),
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    it('should handle 404 Not Found error from downstream', async () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Task not found' },
          headers: {},
          config: { headers: {} } as any,
        },
        message: 'Request failed with status code 404',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.proxyRequest('http://localhost:3002', '/tasks/non-existent-id', 'GET'),
      ).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should handle 500 Internal Server Error from downstream', async () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Database connection failed' },
          headers: {},
          config: { headers: {} } as any,
        },
        message: 'Request failed with status code 500',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.proxyRequest('http://localhost:3002', '/tasks', 'GET'),
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle network error (no response)', async () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        response: undefined,
        message: 'connect ECONNREFUSED',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(service.proxyRequest('http://localhost:3002', '/tasks', 'GET')).rejects.toThrow(
        HttpException,
      );

      await expect(
        service.proxyRequest('http://localhost:3002', '/tasks', 'GET'),
      ).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should include correlation ID in requests', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      mockHttpService.request.mockReturnValue(of(mockAxiosResponse));

      await service.proxyRequest('http://localhost:3001', '/auth/login', 'POST');

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Correlation-ID': 'test-correlation-id',
          }),
        }),
      );
    });

    it('should set 30 second timeout for requests', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      mockHttpService.request.mockReturnValue(of(mockAxiosResponse));

      await service.proxyRequest('http://localhost:3001', '/auth/login', 'POST');

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        }),
      );
    });
  });
});
