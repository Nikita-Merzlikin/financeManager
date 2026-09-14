import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { CategoriesService } from "src/finance/categories.service";
import type { AiTool } from "./ai-tool.interface";

@Injectable()
export class GetCategoriesTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_CATEGORIES;
  readonly description =
    "List income and expense categories available to the authenticated user (system defaults + custom).";
  readonly parameters = {
    type: "object" as const,
    properties: {},
    required: [] as string[],
  };

  constructor(private readonly categoriesService: CategoriesService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    const categories = await this.categoriesService.list(ctx.userId);
    return { ok: true, data: { categories } };
  }
}
