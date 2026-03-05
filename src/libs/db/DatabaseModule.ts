import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Config } from 'src/config/configuration';
import mongoose from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly eventEmitter = new EventEmitter();

  async onModuleInit(): Promise<void> {
    try {
      await mongoose.connect(Config.MONGO_URI);
      console.log('Connected to MongoDB');
      this.eventEmitter.emit('connected');
    } catch (error) {
      console.log('Error connecting to MongoDB', error);
    }
  }

  onConnected(callback: () => void): void {
    this.eventEmitter.on('connected', callback);
  }

  async closeConnection(): Promise<void> {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

@Global()
@Module({
  providers: [DatabaseService],
})
export class DatabaseModule {}
