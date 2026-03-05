import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { OrganizationService } from './services/organization.service';
import { EmailService } from 'src/infra/email/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { OrganizationOwnerGuard } from './guard/organization-owner.guard';
import { UserRepository } from './repository/users.repository';
import { OrganizationRepository } from './repository/organization.repository';
import { EmailQueueService } from 'src/infra/email/services/email-queue.service';
import { BullModule } from '@nestjs/bull';
import { ResendProvider } from 'src/infra/email/providers/resend.provider';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'email',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OrganizationService,
    EmailService,
    JwtStrategy,
    JwtAuthGuard,
    OrganizationOwnerGuard,
    UserRepository,
    OrganizationRepository,
    EmailQueueService,
    {
      provide: 'EMAIL_PROVIDER',
      useClass: ResendProvider,
    },
  ],
  exports: [
    AuthService,
    OrganizationService,
    JwtStrategy,
    JwtAuthGuard,
    OrganizationOwnerGuard,
    UserRepository,
    OrganizationRepository,
  ],
})
export class AuthModule {}
