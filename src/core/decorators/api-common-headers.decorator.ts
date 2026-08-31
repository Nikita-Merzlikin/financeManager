import { applyDecorators } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";
import {
  CurrencyEnum,
  DEFAULT_CURRENCY,
} from "src/core/enums/finance.enums";
import {
  ClientTypeEnum,
  LanguageEnum,
  UnitSystemEnum,
} from "src/core/enums/header.enums";

export function ApiCommonHeaders() {
  return applyDecorators(
    ApiHeader({
      name: "x-unit-system",
      required: false,
      schema: {
        type: "string",
        enum: Object.values(UnitSystemEnum),
        default: UnitSystemEnum.METRIC,
      },
    }),
    ApiHeader({
      name: "x-lang",
      required: false,
      schema: {
        type: "string",
        enum: Object.values(LanguageEnum),
        default: LanguageEnum.UK,
      },
    }),
    ApiHeader({
      name: "client-type",
      required: false,
      schema: {
        type: "string",
        enum: Object.values(ClientTypeEnum),
        default: ClientTypeEnum.CLIENT,
      },
    }),
    ApiHeader({
      name: "Currency",
      required: false,
      schema: {
        type: "string",
        enum: Object.values(CurrencyEnum),
        default: DEFAULT_CURRENCY,
      },
    }),
  );
}
