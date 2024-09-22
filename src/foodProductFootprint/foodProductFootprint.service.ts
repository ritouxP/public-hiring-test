import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CarbonEmissionFactorsService } from "../carbonEmissionFactor/carbonEmissionFactors.service";
import { FoodProduct, FoodProductFootprintDto, IngredientDto } from "./dto/foodProductFootprint.dto";
import { FoodProductFootprint } from "./foodProductFootprint.entity";

@Injectable()
export class FoodProductFootprintService {
  constructor(
    private carbonEmissionFactorsService: CarbonEmissionFactorsService,
    @InjectRepository(FoodProductFootprint)
    private foodProductFootprintRepository: Repository<FoodProductFootprint>
  ) {}

  async calculateIngredientEmission(ingredient: IngredientDto): Promise<number | null> {
    const carbonEmissionFactor = await this.carbonEmissionFactorsService.findByNameAndUnit(ingredient.name, ingredient.unit)
    if (!carbonEmissionFactor) {
      return null;
    }
    return ingredient.quantity * carbonEmissionFactor.emissionCO2eInKgPerUnit;
  }

  async calculateFootprint(ingredients: IngredientDto[]): Promise<number | null> {
    const ingredientsEmissions = await Promise.all(ingredients.map(ingredient => this.calculateIngredientEmission(ingredient)));
    if (ingredientsEmissions.some(ingredientEmission => ingredientEmission === null)) {
      return null;
    }
    const totalEmission = ingredientsEmissions.reduce((acc: number, emission: number) => {
      return acc + emission;
    }, 0);
    return totalEmission;
  }

  async findByName(name: string): Promise<FoodProductFootprint | null> {
    const foodProductFootprint = await this.foodProductFootprintRepository.findOne({where: {name}});
    return foodProductFootprint
  }

  async computeAndSaveFootprint(foodProduct: FoodProduct): Promise<FoodProductFootprint | null> {
    const foodProductInDB = await this.findByName(foodProduct.name);
    if (foodProductInDB) {
        throw new ConflictException(`FoodProductFootprint with name: ${foodProduct.name} already exists`);
    }
    const carbonFootprint = await this.calculateFootprint(foodProduct.ingredients);
    const foodProductFootprint = new FoodProductFootprint({
      name: foodProduct.name,
      carbonFootprint,
      ingredients: foodProduct.ingredients
    });
    return this.save(foodProductFootprint);
  }

  async save(foodProductFootprint: FoodProductFootprintDto): Promise<FoodProductFootprint | null> {
    try {
        return await this.foodProductFootprintRepository.save(foodProductFootprint);
    } catch (error) {
        throw new Error('Could not save FoodProduct.');
    }
  }

  async findAll(): Promise<FoodProductFootprint[] | null> {
    try {
        return await this.foodProductFootprintRepository.find();
    } catch (error) {
        throw new Error('Could not fetch FoodProducts.');
    }
  }
}