
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SupabaseClientService } from '../lib/supabaseClient.service';

@Module({
  providers: [UsersService, SupabaseClientService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
