// src/server/api/routers/lightData.ts
import { z } from "zod"; // จำเป็นถ้ามี input validation
import { createTRPCRouter, publicProcedure } from "../trpc";

export const lightDataRouter = createTRPCRouter({
  // ดึงข้อมูล LightData ทั้งหมด (หรือจำนวนจำกัด)
  getAllLightData: publicProcedure.query(({ ctx }) => {
    return ctx.db.lightData.findMany({
      orderBy: {
        timestamp: 'desc', // เรียงตามเวลาล่าสุด
      },
      take: 100, // ดึงแค่ 100 รายการล่าสุด หรือตามที่คุณต้องการ
    });
  }),

  // ดึงข้อมูล LightData ตาม deviceId
  getLightDataByDeviceId: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.lightData.findMany({
        where: { deviceId: input.deviceId },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
      });
    }),

  // ดึงค่าความเข้มแสงล่าสุด
  getLatestLightIntensity: publicProcedure
    .input(z.object({ deviceId: z.string().optional() })) // อาจจะให้ระบุ deviceId หรือดึงค่าล่าสุดจากทุก device
    .query(async ({ ctx, input }) => {
      // Logic ในการดึงค่าล่าสุด อาจจะดึงจาก device ที่มี timestamp ล่าสุด หรือตาม deviceId ที่ระบุ
      const latestData = await ctx.db.lightData.findFirst({
        where: input.deviceId ? { deviceId: input.deviceId } : undefined,
        orderBy: { timestamp: 'desc' },
        select: { intensity: true }, // ดึงเฉพาะฟิลด์ intensity
      });
      return latestData?.intensity ?? 0; // คืนค่า intensity หรือ 0 ถ้าไม่มีข้อมูล
    }),
});