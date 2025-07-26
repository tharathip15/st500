// src/server/api/routers/pumpLog.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PumpAction } from "@prisma/client"; // Import enum จาก Prisma Client

export const pumpLogRouter = createTRPCRouter({
  // ดึงประวัติ PumpLog ทั้งหมด
  getAllPumpLogs: publicProcedure.query(({ ctx }) => {
    return ctx.db.pumpLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 50, // ดึงแค่ 50 รายการล่าสุด
    });
  }),

  // ดึงประวัติ PumpLog ตาม deviceId
  getPumpLogsByDeviceId: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.pumpLog.findMany({
        where: { deviceId: input.deviceId },
        orderBy: {
          timestamp: 'desc',
        },
        take: 30,
      });
    }),

  // บันทึกการควบคุมปั๊ม (Mutation)
  controlPump: publicProcedure // หรือ protectedProcedure ถ้าต้องการให้เฉพาะผู้ใช้ที่ล็อกอินแล้ว
    .input(z.object({
      deviceId: z.string(),
      action: z.nativeEnum(PumpAction), // ใช้ z.nativeEnum สำหรับ Prisma Enum
      duration: z.number().int().optional(), // ระยะเวลาเป็นวินาที
    }))
    .mutation(async ({ ctx, input }) => {
      const newPumpLog = await ctx.db.pumpLog.create({
        data: {
          deviceId: input.deviceId,
          action: input.action,
          duration: input.duration,
          // timestamp จะถูก default เป็น now()
        },
      });
      console.log(`Pump ${input.action} on device ${input.deviceId}`);
      return newPumpLog;
    }),
});