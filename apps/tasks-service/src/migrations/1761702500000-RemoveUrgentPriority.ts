import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUrgentPriority1761702500000 implements MigrationInterface {
  name = 'RemoveUrgentPriority1761702500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any tasks with URGENT priority to HIGH
    await queryRunner.query(`
      UPDATE "tasks"
      SET "priority" = 'HIGH'
      WHERE "priority" = 'URGENT'
    `);

    // Drop default constraint temporarily
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "priority" DROP DEFAULT
    `);

    // Recreate the enum without URGENT
    await queryRunner.query(`
      ALTER TYPE "public"."tasks_priority_enum" RENAME TO "tasks_priority_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "priority" TYPE "public"."tasks_priority_enum"
      USING "priority"::text::"public"."tasks_priority_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."tasks_priority_enum_old"
    `);

    // Restore default constraint
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate enum with URGENT
    await queryRunner.query(`
      ALTER TYPE "public"."tasks_priority_enum" RENAME TO "tasks_priority_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "priority" TYPE "public"."tasks_priority_enum"
      USING "priority"::text::"public"."tasks_priority_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."tasks_priority_enum_old"
    `);
  }
}
