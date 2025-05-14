
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    // The JWT payload from Supabase auth
    return req['user'];
  }
}
