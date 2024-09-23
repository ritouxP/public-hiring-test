
export class IngredientDto {
  name: string;
  quantity: number;
  unit: string;
}

export class FoodProduct {
  name: string;
  ingredients: IngredientDto[];
}
export class FoodProductFootprintDto extends FoodProduct {
  carbonFootprint: number | null;
}