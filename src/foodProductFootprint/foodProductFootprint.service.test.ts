import { dataSource, GreenlyDataSource } from "../../config/dataSource";
import { CarbonEmissionFactor } from "../carbonEmissionFactor/carbonEmissionFactor.entity";
import { CarbonEmissionFactorsService } from "../carbonEmissionFactor/carbonEmissionFactors.service";
import { getTestEmissionFactor } from "../seed-dev-data";
import { IngredientDto } from "./dto/foodProductFootprint.dto";
import { FoodProductFootprint } from "./foodProductFootprint.entity";
import { FoodProductFootprintService } from "./foodProductFootprint.service";


let hamEmissionFactor = getTestEmissionFactor("ham");
let olivedOilEmissionFactor = getTestEmissionFactor("oliveOil");
let tomatoEmissionFactor = getTestEmissionFactor("tomato");
let cheeseEmissionFactor = getTestEmissionFactor("cheese");
let flourEmissionFactor = getTestEmissionFactor("flour");
let carbonEmissionFactorService: CarbonEmissionFactorsService;
let foodProductFootprintService: FoodProductFootprintService;
const hamCheesePizzaIngredients: IngredientDto[] = [
    { name: "ham", quantity: 0.1, unit: "kg" },
    { name: "cheese", quantity: 0.15, unit: "kg" },
    { name: "tomato", quantity: 0.4, unit: "kg" },
    { name: "oliveOil", quantity: 0.3, unit: "kg" },
    { name: "flour", quantity: 0.7, unit: "kg" },
  ]

beforeAll(async () => {
    await dataSource.initialize();
    carbonEmissionFactorService = new CarbonEmissionFactorsService(
        dataSource.getRepository(CarbonEmissionFactor)
      );
    foodProductFootprintService = new FoodProductFootprintService(
        carbonEmissionFactorService,
        dataSource.getRepository(FoodProductFootprint)
    );
});

afterAll(async () => {
    await dataSource.destroy();
});

beforeEach(async () => {
    await GreenlyDataSource.cleanDatabase();
});


describe("FoodProductFootprintService", () => {

    describe("findByName", () => {
        it("should return the footprint of a product", async () => {
            await foodProductFootprintService.save({
                name: "hamCheesePizza",
                ingredients: hamCheesePizzaIngredients,
                carbonFootprint: 1.2
            });
            const hamCheesePizzaFootprint = await foodProductFootprintService.findByName("hamCheesePizza");
            expect(hamCheesePizzaFootprint).not.toBeNull();
        });

        it("should return null if the product does not exist", async () => {
            const hamCheesePizzaFootprint = await foodProductFootprintService.findByName("hamCheesePizza");
            expect(hamCheesePizzaFootprint).toBeNull();
        }
        );
    });

    describe("calculateIngredientEmission", () => {
        it("should calculate the emission of an ingredient", async () => {
            await carbonEmissionFactorService.save([hamEmissionFactor]);
            const hamIngredient: IngredientDto = { name: "ham", quantity: 0.1, unit: "kg" };
            const emission = await foodProductFootprintService.calculateIngredientEmission(hamIngredient);
            expect(emission).toBe(hamIngredient.quantity * hamEmissionFactor.emissionCO2eInKgPerUnit);
        });


        it("Can not compute ingredient emission if ingredient name case not match case in database", async () => {
            await carbonEmissionFactorService.save([hamEmissionFactor]);
            const hamIngredient: IngredientDto = { name: "HAM", quantity: 0.1, unit: "kg" };
            const emission = await foodProductFootprintService.calculateIngredientEmission(hamIngredient);
            expect(emission).toBeNull();
        });

        it("should return null if the ingredient does not have an emission factor", async () => {
            let chickenIngredient: IngredientDto = { name: "chicken", quantity: 0.1, unit: "kg" };
            expect(await foodProductFootprintService.calculateIngredientEmission(chickenIngredient)).toBeNull();
        });
    } );

    describe("calculateFootprintProduct", () => {
        it("should calculate the total emission of a product with all ingredients having emission factors", async () => {
            await carbonEmissionFactorService.save([
                hamEmissionFactor,
                olivedOilEmissionFactor,
                tomatoEmissionFactor,
                cheeseEmissionFactor,
                flourEmissionFactor
            ]);
            const hamCheesePizzaIngredientsEmission = hamCheesePizzaIngredients.map((ingredient: IngredientDto) => {
                return ingredient.quantity * getTestEmissionFactor(ingredient.name).emissionCO2eInKgPerUnit;
            }).reduce((acc, emission) => acc + emission, 0);

            const emission = await foodProductFootprintService.calculateFootprint(hamCheesePizzaIngredients);
            expect(emission).toBe(hamCheesePizzaIngredientsEmission);
        });

        it("should return null calculating the emission of a product with some ingredients not having emission factors", async () => {
            await carbonEmissionFactorService.save([hamEmissionFactor]);
            const randomDish: IngredientDto[] = [
                  { name: "ham", quantity: 0.1, unit: "kg" },
                  { name: "floor", quantity: 0.7, unit: "kg" },
                ]

            const emission = await foodProductFootprintService.calculateFootprint(randomDish);
            expect(emission).toBeNull();
        });

        it("should compute and save the footprint of a product", async () => {
            await carbonEmissionFactorService.save([
                hamEmissionFactor,
                olivedOilEmissionFactor,
                tomatoEmissionFactor,
                cheeseEmissionFactor,
                flourEmissionFactor
            ]);
            await foodProductFootprintService.computeAndSaveFootprint({
                name: "hamCheesePizza",
                ingredients: hamCheesePizzaIngredients
            });
            const hamCheesePizzaFootprint = await foodProductFootprintService.findByName("hamCheesePizza");
            expect(hamCheesePizzaFootprint).not.toBeNull();
            expect(hamCheesePizzaFootprint?.carbonFootprint).not.toBeNull();
        });

        it("should compute and save the footprint of a product even if the footprint is null", async () => {
            await carbonEmissionFactorService.save([hamEmissionFactor]);
            await foodProductFootprintService.computeAndSaveFootprint({
                name: "hamCheesePizza",
                ingredients: hamCheesePizzaIngredients
            });
            const hamCheesePizzaFootprint = await foodProductFootprintService.findByName("hamCheesePizza");
            expect(hamCheesePizzaFootprint).not.toBeNull();
            expect(hamCheesePizzaFootprint?.carbonFootprint).toBeNull();
        });

        it("should not save the footprint of a product if it already exists", async () => {
            await carbonEmissionFactorService.save([
                hamEmissionFactor,
                olivedOilEmissionFactor,
                tomatoEmissionFactor,
                cheeseEmissionFactor,
                flourEmissionFactor
            ]);
            
            // first call to save the footprint
            await foodProductFootprintService.computeAndSaveFootprint({
                name: "hamCheesePizza",
                ingredients: hamCheesePizzaIngredients
            });

            // second call should throw an error
            await expect(foodProductFootprintService.computeAndSaveFootprint({
                    name: "hamCheesePizza",
                    ingredients: hamCheesePizzaIngredients
            })).rejects.toThrow('FoodProductFootprint with name: hamCheesePizza already exists');
        });
    });
});