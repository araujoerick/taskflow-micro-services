import { Module } from '@nestjs/common';
import { WebSocketPublisherService } from './websocket-publisher.service';

@Module({
  providers: [WebSocketPublisherService],
  exports: [WebSocketPublisherService],
})
export class WebSocketModule {}
