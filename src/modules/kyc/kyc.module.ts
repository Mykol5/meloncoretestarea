import { Module } from '@nestjs/common';
import { KYCController } from './kyc.controller';
import { KYCWebhookController } from './controllers/kyc-webhook.controller';
import { KYCService } from './kyc.service';
import { KYCRepository } from './repository/kyc.repository';
import { MobileIntegrationService } from './services/mobile-integration.service';
import { GeocodingService } from './services/geocoding.service';
import { PDFGenerationService } from './services/pdf-generation.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KYCController, KYCWebhookController],
  providers: [
    KYCService,
    MobileIntegrationService,
    GeocodingService,
    PDFGenerationService,
    {
      provide: 'KYC_REPOSITORY',
      useClass: KYCRepository,
    },
  ],
  exports: [KYCService],
})
export class KYCModule {}
