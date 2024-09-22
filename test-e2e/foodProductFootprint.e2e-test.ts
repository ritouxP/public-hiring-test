import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { dataSource, GreenlyDataSource } from "../config/dataSource";
import { AppModule } from "../src/app.module";
import { CarbonEmissionFactor } from "../src/carbonEmissionFactor/carbonEmissionFactor.entity";
import { IngredientDto } from "../src/foodProductFootprint/dto/foodProductFootprint.dto";
import { FoodProductFootprint } from "../src/foodProductFootprint/foodProductFootprint.entity";


const pastaTomatoe = new FoodProductFootprint({
  name: "pastaTomatoe",
  ingredients: [
    { name: "pasta", quantity: 0.1, unit: "kg" },
    { name: "tomatoe", quantity: 0.1, unit: "kg" },
  ],
  carbonFootprint: 1.2,
});
const carbonaraFootprint = new FoodProductFootprint({
  name: "carbonara",
  ingredients: [
    { name: "pasta", quantity: 0.1, unit: "kg" },
    { name: "ham", quantity: 0.1, unit: "kg" },
    { name: "cheese", quantity: 0.1, unit: "kg" },
  ],
  carbonFootprint: 2.4,
});
const pastaCarbonEmissionFactors: CarbonEmissionFactor = new CarbonEmissionFactor({
  name: "pasta",
  unit: "kg",
  emissionCO2eInKgPerUnit: 1.2,
  source: "Agrybalise",
});
const tomatoeCarbonEmissionFactors = new CarbonEmissionFactor({
  name: "tomatoe",
  unit: "kg",
  emissionCO2eInKgPerUnit: 1,
  source: "Agrybalise",
});
const hamCarbonEmissionFactors = new CarbonEmissionFactor({
  name: "ham",
  unit: "kg",
  emissionCO2eInKgPerUnit: 3,
  source: "Agrybalise",
});

const foodProductFootprintRepository = dataSource.getRepository(FoodProductFootprint);
const carbonEmissionFactorRepository = dataSource.getRepository(CarbonEmissionFactor);

beforeAll(async () => {
  await dataSource.initialize();
});

afterAll(async () => {
  await dataSource.destroy();
});

describe("foodProductFootprintController", () => {
  let app: INestApplication;
  let defaultFoodProductFootprints: FoodProductFootprint[];

  beforeEach(async () => {
    await GreenlyDataSource.cleanDatabase();
    await foodProductFootprintRepository.save([pastaTomatoe, carbonaraFootprint]);
    carbonEmissionFactorRepository.save([pastaCarbonEmissionFactors, tomatoeCarbonEmissionFactors, hamCarbonEmissionFactors]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  
    app = moduleFixture.createNestApplication();
    await app.init();
  
    defaultFoodProductFootprints = await dataSource
      .getRepository(FoodProductFootprint)
      .find();
  });

  it("GET /food-product-footprint should return all foodProductFootprints", async () => {
    return request(app.getHttpServer())
      .get("/food-product-footprint")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(defaultFoodProductFootprints);
      });
  })

  it("GET /food-product-footprint/:name should return 200", async () => {
    return request(app.getHttpServer())
      .get(`/food-product-footprint/${pastaTomatoe.name}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(pastaTomatoe);
      });
  })

  it("GET /food-product-footprint/:name should return a 404 if the foodProductFootprint doesn't exist", async () => {
    return request(app.getHttpServer())
      .get("/food-product-footprint/nonExistent")
      .expect(404);
  })

  it("POST /food-product-footprint should create a new foodProductFootprint with not null carbonFootprint", async () => {
    const pastaQuantities = 0.2;
    const hamQuantities = 0.1;
    const pastaHamIngredients: IngredientDto[] = [
      { name: "pasta", quantity: pastaQuantities, unit: "kg" },
      { name: "ham", quantity: hamQuantities, unit: "kg" },
    ];
    const pastaHam = {
      name: "pastaHam",
      ingredients: pastaHamIngredients
    };
    
    const carbonFootprint = pastaQuantities*pastaCarbonEmissionFactors.emissionCO2eInKgPerUnit + hamQuantities*hamCarbonEmissionFactors.emissionCO2eInKgPerUnit;
    return request(app.getHttpServer())
      .post("/food-product-footprint")
      .send(pastaHam)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({...pastaHam, carbonFootprint});
      });
    }
  );

  it("POST /food-product-footprint sould return 409 if the foodProductFootprint already exists", async () => {
    const pastaTomatoe = {
      name: "pastaTomatoe",
      ingredients: [
        { name: "pasta", quantity: 0.1, unit: "kg" },
        { name: "tomatoe", quantity: 0.1, unit: "kg" },
      ]
    };

    return request(app.getHttpServer())
      .post("/food-product-footprint")
      .send(pastaTomatoe)
      .expect(409);
    }
  );

  it("POST /food-product-footprint should create a new foodProductFootprint with null carbonFootprint", async () => {
    const pastaCheese = {
      name: "pastaCheese",
      ingredients: [
        { name: "pasta", quantity: 0.1, unit: "kg" },
        { name: "cheese", quantity: 0.1, unit: "kg" },
      ]
    };
    return request(app.getHttpServer())
      .post("/food-product-footprint")
      .send(pastaCheese)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({...pastaCheese, carbonFootprint: null});
      });
    }
  );
});




