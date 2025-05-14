
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './supabase.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
