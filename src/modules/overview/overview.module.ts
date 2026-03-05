import { Module } from '@nestjs/common';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { KYCModule } from '../kyc/kyc.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, KYCModule, PortfolioModule],
  controllers: [OverviewController],
  providers: [OverviewService],
  exports: [OverviewService],
})
export class OverviewModule {}
