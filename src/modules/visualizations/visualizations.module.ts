import { Module } from '@nestjs/common';
import { VisualizationsController } from './visualizations.controller';
import { VisualizationsService } from './visualizations.service';
import { DataSourceRepository } from './repository/data-source.repository';
import { ChartRepository } from './repository/chart.repository';
import { FileProcessingService } from './services/file-processing.service';
import { DataAnalysisService } from './services/data-analysis.service';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [VisualizationsController],
  providers: [
    VisualizationsService,
    FileProcessingService,
    DataAnalysisService,
    {
      provide: 'DATA_SOURCE_REPOSITORY',
      useClass: DataSourceRepository,
    },
    {
      provide: 'CHART_REPOSITORY',
      useClass: ChartRepository,
    },
  ],
  exports: [VisualizationsService],
})
export class VisualizationsModule {}
