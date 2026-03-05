import { Logger } from '@nestjs/common';
import { IsString, validateSync } from 'class-validator';

import { config } from 'dotenv';
config();

class Configuration {
  private readonly logger = new Logger(Configuration.name);

  @IsString()
  readonly MONGO_URI = process.env.MONGO_URI as string;

  @IsString()
  readonly JWT_SECRET = process.env.JWT_SECRET as string;

  constructor() {
    const error = validateSync(this);

    if (!error.length) return;
    this.logger.error(`Config validation error: ${JSON.stringify(error[0])}`);
    process.exit(1);
  }
}

export const Config = new Configuration();
