import { GreenlyDataSource, dataSource } from "../../config/dataSource";
import { getTestEmissionFactor } from "../seed-dev-data";
import { CarbonEmissionFactor } from "./carbonEmissionFactor.entity";
import { CarbonEmissionFactorsService } from "./carbonEmissionFactors.service";

let flourEmissionFactor = getTestEmissionFactor("flour");
let hamEmissionFactor = getTestEmissionFactor("ham");
let olivedOilEmissionFactor = getTestEmissionFactor("oliveOil");
let carbonEmissionFactorService: CarbonEmissionFactorsService;

beforeAll(async () => {
  await dataSource.initialize();
  carbonEmissionFactorService = new CarbonEmissionFactorsService(
    dataSource.getRepository(CarbonEmissionFactor)
  );
});

beforeEach(async () => {
  await GreenlyDataSource.cleanDatabase();
  await dataSource
    .getRepository(CarbonEmissionFactor)
    .save(olivedOilEmissionFactor);
});

describe("CarbonEmissionFactors.service", () => {
  it("should save new emissionFactors", async () => {
    await carbonEmissionFactorService.save([
      hamEmissionFactor,
      flourEmissionFactor,
    ]);
    const retrieveChickenEmissionFactor = await dataSource
      .getRepository(CarbonEmissionFactor)
      .findOne({ where: { name: "flour" } });
    expect(retrieveChickenEmissionFactor?.name).toBe("flour");
  });
  it("should retrieve emission Factors", async () => {
    const carbonEmissionFactors = await carbonEmissionFactorService.findAll();
    expect(carbonEmissionFactors).toHaveLength(1);
  });
  it("should retrieve emission Factor by name and unit", async () => {
    const carbonEmissionFactor = await carbonEmissionFactorService.findByNameAndUnit(
      "oliveOil", "kg"
    );
    expect(carbonEmissionFactor?.name).toBe("oliveOil");
  });

  it("should not retrive emission if unit is not matching", async () => {
    const carbonEmissionFactor = await carbonEmissionFactorService.findByNameAndUnit("oliveOil", "g");
    expect(carbonEmissionFactor).toBeNull();
  });
});

afterAll(async () => {
  await dataSource.destroy();
});
