import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IngredientDto } from "./dto/foodProductFootprint.dto";

@Entity("food_product_footprint")
export class FoodProductFootprint extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({
        nullable: false,
    })
    name: string;
    
    @Column({
        type: "float",
        nullable: false,
    })
    carbonFootprint: number | null;

    @Column({
        type: 'jsonb',
        nullable: false,
    })
    ingredients: IngredientDto[];

    sanitize() {
        if (this.name === "") {
        throw new Error("Name cannot be empty");
        }
        if (this.ingredients?.length === 0) {
        throw new Error("Ingredients cannot be empty");
        }
    }
    
    constructor(props: {
        name: string;
        carbonFootprint: number | null;
        ingredients: IngredientDto[];
    }) {
        super();
    
        this.name = props?.name;
        this.carbonFootprint = props?.carbonFootprint;
        this.ingredients = props?.ingredients
        this.sanitize();
    }
    }