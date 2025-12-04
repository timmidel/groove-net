import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from '@nestjs/passport';
import { Comment as CommentModel } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UserPayload } from 'src/@types/user-payload';

@UseGuards(AuthGuard('jwt'))
@Controller('post/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}
  @Post()
  async createComment(
    @Param('postId') postId: string,
    @Body() commentData: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ): Promise<CommentModel> {
    return this.commentService.createComment({
      ...commentData,
      postId, // from URL param
      authorId: user.id, // from authenticated user
    });
  }
  @Get()
  async getComments(
    @Param('postId') postId: string,
    @Query('skip') skip = '0',
    @Query('take') take = '5',
  ): Promise<CommentModel[]> {
    const skipNumber = parseInt(skip, 10) || 0;
    const takeNumber = parseInt(take, 10) || 5;
    return this.commentService.getCommentsByPostId({
      orderBy: { createdAt: 'desc' },
      skip: skipNumber,
      take: takeNumber,
      where: { postId }, // filter by postId
    });
  }
}
