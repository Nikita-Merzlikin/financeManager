import { Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { BanksService } from "./banks.service";

@ApiExcludeController()
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly banksService: BanksService) {}

  @Get("monobank")
  monobankValidate(@Res() res: Response) {
    return res.status(200).send("ok");
  }

  @Post("monobank")
  @HttpCode(200)
  async monobankWebhook(@Req() req: Request) {
    await this.banksService.handleMonobankWebhook(
      req.body as {
        type?: string;
        data?: {
          account?: string;
          statementItem?: {
            id: string;
            time: number;
            description: string;
            mcc: number;
            amount: number;
            currencyCode: number;
            balance?: number;
            comment?: string;
          };
        };
      },
    );
    return { status: "ok" };
  }
}
