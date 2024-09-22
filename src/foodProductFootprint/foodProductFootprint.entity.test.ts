import { GreenlyDataSource, dataSource } from "../../config/dataSource";
import { FoodProductFootprint } from "./foodProductFootprint.entity";

beforeAll(async () => {
  await dataSource.initialize();
});
beforeEach(async () => {
  await GreenlyDataSource.cleanDatabase();
});
describe("FoodProductFootprint", () => {
  describe("constructor", () => {
    it("should throw an error if the name is empty", () => {
      expect(() => {
        const carbonEmissionFactor = new FoodProductFootprint({
            name: "",
            ingredients: [{ name: "ham", quantity: 0.1, unit: "kg" }],
            carbonFootprint: 0
        });
      }).toThrow();
    });
    it("should throw an error if ingredients is empty", () => {
      expect(() => {
        const carbonEmissionFactor = new FoodProductFootprint({
            name: "name",
            ingredients: [],
            carbonFootprint: 0
        });
      }).toThrow();
    });
  });
});

afterAll(async () => {
  await dataSource.destroy();
});
