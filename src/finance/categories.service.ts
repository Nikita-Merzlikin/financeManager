import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { CategoryDto, CreateCategoryDto } from "src/core/dto/finance.dto";
import { Category } from "src/db/dbModels/Category";

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "income" | "expense";
  icon: string;
}> = [
  { name: "Salary", type: "income", icon: "salary" },
  { name: "Freelance", type: "income", icon: "work" },
  { name: "Other income", type: "income", icon: "plus" },
  { name: "Food", type: "expense", icon: "food" },
  { name: "Transport", type: "expense", icon: "transport" },
  { name: "Home", type: "expense", icon: "home" },
  { name: "Health", type: "expense", icon: "health" },
  { name: "Entertainment", type: "expense", icon: "fun" },
  { name: "Savings transfer", type: "expense", icon: "piggy" },
  { name: "Other expense", type: "expense", icon: "minus" },
];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  toDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
    };
  }

  async ensureDefaults(userId: string): Promise<void> {
    const count = await this.categoryModel.count({
      where: {
        [Op.or]: [{ userId }, { userId: null }],
      },
    });
    if (count > 0) return;

    await this.categoryModel.bulkCreate(
      DEFAULT_CATEGORIES.map((item) => ({
        userId,
        name: item.name,
        type: item.type,
        icon: item.icon,
      })),
    );
  }

  async list(userId: string): Promise<CategoryDto[]> {
    await this.ensureDefaults(userId);
    const categories = await this.categoryModel.findAll({
      where: {
        [Op.or]: [{ userId }, { userId: null }],
      },
      order: [["type", "ASC"], ["name", "ASC"]],
    });
    return categories.map((item) => this.toDto(item));
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryDto> {
    const category = await this.categoryModel.create({
      userId,
      name: dto.name,
      type: dto.type,
      icon: dto.icon ?? null,
    });
    return this.toDto(category);
  }
}
