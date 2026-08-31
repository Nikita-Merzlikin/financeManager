import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { CategoryDto, CreateCategoryDto } from "src/core/dto/finance.dto";
import { DEFAULT_CATEGORIES } from "src/db/seeds/default-categories";
import { Category } from "src/db/dbModels/Category";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  toDto(category: Category): CategoryDto {
    return category.toDto();
  }

  /** Ensures system defaults exist (prefer running db:seed). */
  async ensureDefaults(): Promise<void> {
    const count = await this.categoryModel.count({
      where: { userId: null },
    });
    if (count > 0) return;

    await this.categoryModel.bulkCreate(
      DEFAULT_CATEGORIES.map((item) => ({
        userId: null,
        name: item.name,
        type: item.type,
        icon: item.icon,
      })),
    );
  }

  async list(userId: string): Promise<CategoryDto[]> {
    await this.ensureDefaults();
    const categories = await this.categoryModel.findAll({
      where: {
        [Op.or]: [{ userId }, { userId: null }],
      },
      order: [
        ["type", "ASC"],
        ["name", "ASC"],
      ],
    });
    return categories.map((item) => item.toDto());
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryDto> {
    const category = await this.categoryModel.create({
      userId,
      name: dto.name,
      type: dto.type,
      icon: dto.icon ?? null,
    });
    return category.toDto();
  }
}
