import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SupabaseService } from '../supabase/supabase.service';
import { AwsService } from '../aws/aws.service';

@Module({
  imports: [PrismaModule],
  providers: [PostService, SupabaseService, AwsService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
