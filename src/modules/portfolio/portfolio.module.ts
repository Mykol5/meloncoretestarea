import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { ProjectRepository } from './repository/projects.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    {
      provide: 'PROJECT_REPOSITORY',
      useClass: ProjectRepository,
    },
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
