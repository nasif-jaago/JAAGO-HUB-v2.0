import { Module } from "@nestjs/common";
import { PeopleCultureController } from "./people-culture.controller.js";
import { PeopleCultureService } from "./people-culture.service.js";

@Module({
  controllers: [PeopleCultureController],
  providers: [PeopleCultureService],
  exports: [PeopleCultureService],
})
export class PeopleCultureModule {}
