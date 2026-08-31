import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";
import type { MonoWebhookPayload } from "./banks/monobank.types";
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
  async monobankWebhook(@Body() payload: MonoWebhookPayload) {
    await this.banksService.handleMonobankWebhook(payload);
    return { status: "ok" };
  }
}
