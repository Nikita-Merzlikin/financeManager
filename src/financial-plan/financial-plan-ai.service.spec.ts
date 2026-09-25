import { FinancialPlanRecommendationType } from "src/core/enums/financial-plan.enums";
import { parseAiRecommendationPayload } from "./financial-plan-ai.parser";

describe("parseAiRecommendationPayload", () => {
  it("parses a valid structured recommendation", () => {
    const payload = parseAiRecommendationPayload(
      JSON.stringify({
        recommendations: [
          {
            type: FinancialPlanRecommendationType.REDUCE_CATEGORY_LIMIT,
            categoryId: "cat-1",
            currentValue: 9000,
            suggestedValue: 7500,
            reason: "Food spend is high",
          },
          {
            type: FinancialPlanRecommendationType.PLAN_ON_TRACK,
            reason: "Looking good",
          },
        ],
        summary: "Tighten food",
        suggestedSavings: 6000,
      }),
    );

    expect(payload).not.toBeNull();
    expect(payload?.recommendations).toHaveLength(2);
    expect(payload?.suggestedSavings).toBe(6000);
  });

  it("rejects malformed responses safely", () => {
    expect(parseAiRecommendationPayload(null)).toBeNull();
    expect(parseAiRecommendationPayload("not json")).toBeNull();
    expect(
      parseAiRecommendationPayload(
        JSON.stringify({
          recommendations: [{ type: "not_a_real_type", reason: "x" }],
        }),
      ),
    ).toBeNull();
    expect(
      parseAiRecommendationPayload(
        JSON.stringify({
          recommendations: [
            {
              type: FinancialPlanRecommendationType.INCREASE_SAVINGS,
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it("accepts fenced JSON from the model", () => {
    const text = `\`\`\`json
{"recommendations":[{"type":"${FinancialPlanRecommendationType.PLAN_AT_RISK}","reason":"Behind goal"}]}
\`\`\``;
    const payload = parseAiRecommendationPayload(text);
    expect(payload?.recommendations[0].type).toBe(
      FinancialPlanRecommendationType.PLAN_AT_RISK,
    );
  });
});
