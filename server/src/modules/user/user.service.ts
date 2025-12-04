import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AwsService } from '../aws/aws.service';
import { User, Prisma } from '@prisma/client';
import { UserWithCounts } from '../auth/interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private aws: AwsService,
  ) {}
  private readonly logger = new Logger(UserService.name);

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    select?: Prisma.UserSelect,
  ): Promise<UserWithCounts | null> {
    const user = await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      select,
    });
    if (!user) return null;
    const followersCount = await this.prisma.follow.count({
      where: { followingId: user?.id },
    });

    const followingCount = await this.prisma.follow.count({
      where: { followerId: user?.id },
    });
    return { ...user, followersCount, followingCount };
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async getUsersNotFollowedBy(currentUserId: string) {
    const followedIds = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followedIdList = followedIds.map((f) => f.followingId);

    return this.prisma.user.findMany({
      where: {
        id: {
          notIn: [currentUserId, ...followedIdList], // Exclude self and followed users
        },
      },
      take: 10, // Limit the number of users returned
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
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string | undefined> {
    const key = `avatars/${userId}`;

    try {
      // Upload to S3 via AWS Service
      await this.aws.uploadFile(
        process.env.AWS_BUCKET_NAME!,
        key,
        file.buffer,
        file.mimetype, // ensure proper content type
      );

      // Construct public URL
      const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      this.logger.log(`Avatar uploaded successfully: ${publicUrl}`);

      // Append timestamp to prevent cache issues in frontend
      return `${publicUrl}?t=${Date.now()}`;
    } catch (error) {
      this.logger.error('Avatar upload failed', error);
      throw new InternalServerErrorException('Failed to upload avatar', error);
    }
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
    select: Prisma.UserSelect;
  }): Promise<User> {
    const { where, data, select } = params;
    return this.prisma.user.update({
      data,
      where,
      select,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
