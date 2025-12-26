import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';

@Injectable()
export class MicroserviceHealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string, url: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const response$ = this.httpService.get(`${url}/health`) as any;
      await firstValueFrom(
        response$.pipe(
          timeout(5000), // 5s timeout
          catchError((error: any) => {
            throw new Error(`${key} is unreachable: ${error.message}`);
          }),
        ),
      );

      return indicator.up();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return indicator.down({ message: errorMessage });
    }
  }
}
