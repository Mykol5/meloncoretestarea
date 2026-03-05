import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './libs/db/DatabaseModule';
import { ReportsModule } from './modules/reports/reports.module';
import { ImpactMetricsModule } from './modules/impact-metrics/impact-metrics.module';
import { ResponsesModule } from './modules/responses/responses.module';
import { VisualizationsModule } from './modules/visualizations/visualizations.module';
import { EmailModule } from './infra/email/email.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { KYCModule } from './modules/kyc/kyc.module';
import { OverviewModule } from './modules/overview/overview.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    ReportsModule,
    ImpactMetricsModule,
    PortfolioModule,
    ResponsesModule,
    VisualizationsModule,
    EmailModule,
    KYCModule,
    OverviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
