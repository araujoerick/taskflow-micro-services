import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1761702700000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for notification types
    await queryRunner.query(`
      CREATE TYPE "public"."notification_type_enum" AS ENUM (
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_ASSIGNED',
        'TASK_COMMENTED'
      );
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" varchar NOT NULL,
        "type" "public"."notification_type_enum" NOT NULL,
        "message" text NOT NULL,
        "taskId" varchar,
        "metadata" jsonb,
        "read" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_taskId" ON "notifications" ("taskId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_read" ON "notifications" ("userId", "read");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_createdAt" ON "notifications" ("userId", "createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications";`);
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum";`);
  }
}
