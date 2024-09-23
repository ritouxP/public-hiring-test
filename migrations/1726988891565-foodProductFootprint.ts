import { MigrationInterface, QueryRunner } from "typeorm";

export class FoodProductFootprint1726988891565 implements MigrationInterface {
    name = 'FoodProductFootprint1726988891565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "food_product_footprint" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "carbonFootprint" double precision, "ingredients" jsonb NOT NULL, CONSTRAINT "PK_602d5cb2d3d9ca884509cb9a2d4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "food_product_footprint"`);
    }
}
