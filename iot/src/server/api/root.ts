// src/server/api/root.ts
import { createTRPCRouter } from "~/server/api/trpc";
import { deviceRouter } from "./routers/device"; // Router เดิมถ้ามี
import { waterDataRouter } from "./routers/waterData"; // WaterData Router ที่ทำไปแล้ว
import { lightDataRouter } from "./routers/lightData"; // <-- **เพิ่ม LightData Router**
import { pumpLogRouter } from "./routers/pumpLog"; // <-- **เพิ่ม PumpLog Router**
import { userRouter } from "./routers/user"; // <-- **เพิ่ม User Router ถ้ามี**

export const appRouter = createTRPCRouter({
  device: deviceRouter,
  waterData: waterDataRouter,
  lightData: lightDataRouter, // <-- **เพิ่มเข้าใน appRouter**
  pumpLog: pumpLogRouter,     // <-- **เพิ่มเข้าใน appRouter**
  user: userRouter, // <-- **เพิ่ม User Router ถ้ามี**
});

export type AppRouter = typeof appRouter;