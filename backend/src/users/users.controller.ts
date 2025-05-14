
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  async getProfile(@Req() req: Request) {
    const userId = req['user'].sub;
    return await this.usersService.findById(userId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get()
  async getUsers(@Req() req: Request) {
    const userId = req['user'].sub;
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      return [];
    }
    
    return await this.usersService.findAll(user.academy_id);
  }
}
