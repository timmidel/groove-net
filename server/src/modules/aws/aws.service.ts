import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class AwsService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  getClient(): S3Client {
    return this.s3;
  }

  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string,
    contentType?: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    return this.s3.send(command);
  }

  async getFile(bucket: string, key: string) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return this.s3.send(command);
  }
}
