import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserService } from './user.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AwsService } from '../aws/aws.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, SupabaseService, AwsService],
  exports: [UserService],
})
export class UserModule {}
