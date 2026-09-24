import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { CategoriesService } from "src/finance/categories.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_EMPTY_PARAMETERS } from "./ai-tool-parameters";
import { okResult } from "./ai-tool-result";

/** Tool: list income/expense categories. */
@Injectable()
export class GetCategoriesTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_CATEGORIES;
  readonly description =
    "List income and expense categories available to the authenticated user (system defaults + custom).";
  readonly parameters = AI_EMPTY_PARAMETERS;

  constructor(private readonly categoriesService: CategoriesService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    const categories = await this.categoriesService.list(ctx.userId);
    return okResult({ categories });
  }
}
