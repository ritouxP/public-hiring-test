import { Body, Controller, Get, Logger, NotFoundException, Param, Post } from "@nestjs/common";
import { FoodProduct } from "./dto/foodProductFootprint.dto";
import { FoodProductFootprint } from "./foodProductFootprint.entity";
import { FoodProductFootprintService } from "./foodProductFootprint.service";


@Controller("food-product-footprint")
export class FoodProductFootprintController {
  constructor(
    private readonly foodProductFootprintService: FoodProductFootprintService
  ) {}

  @Get(':name')
    async getFoodProductFootprint(@Param('name') name: string): Promise<FoodProductFootprint | null> {
        Logger.log(
        `[food-product-footprint] [GET] FoodProductFootprint: getting FoodProductFootprint with name: ${name}`
        );
        const foodProductFootprint = await this.foodProductFootprintService.findByName(name);
        if (!foodProductFootprint) {
          throw new NotFoundException(`Could not find FoodProductFootprint with name: ${name}`);
        }
        return foodProductFootprint;
    }

  @Get()
    getAllFoodProductFootprint(): Promise<FoodProductFootprint[] | null> {
        Logger.log(
        `[food-product-footprint] [GET] FoodProductFootprint: getting all FoodProductFootprint`
        );
        return this.foodProductFootprintService.findAll();
    }


  @Post()
    async createFoodProductFootprint(
        @Body() foodProduct: FoodProduct
    ): Promise<FoodProductFootprint | null> {
        Logger.log(
        `[food-product-footprint] [POST] Creating FoodProductFootprint: ${foodProduct}`
        );
        return this.foodProductFootprintService.computeAndSaveFootprint(foodProduct);
    }
}
