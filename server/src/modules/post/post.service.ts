import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Post, Prisma } from '@prisma/client';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private aws: AwsService,
  ) {}

  private readonly logger = new Logger(PostService.name);

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });
  }

  async getUserPosts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });
  }

  async createPost(data: {
    authorId: string;
    content: string;
    audioUrl?: string;
  }): Promise<Post> {
    const { authorId, content, audioUrl } = data;

    return this.prisma.post.create({
      data: {
        content,
        audioUrl,
        ...(audioUrl && { audioUrl }), // Only include audioUrl if it exists
        author: {
          connect: { id: authorId },
        },
      },
    });
  }
  async uploadAudio(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string | undefined> {
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const key = `posts/${userId}/audio/${timestamp}.${extension}`;

    try {
      // Upload file to S3
      await this.aws.uploadFile(process.env.AWS_BUCKET_NAME!, key, file.buffer);

      // Construct public URL
      const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      this.logger.log(`Audio uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error('Audio upload failed', error);
      throw new InternalServerErrorException('Failed to upload file', error);
    }
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
