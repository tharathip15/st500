// src/server/api/routers/waterData.ts
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { type Prisma } from "@prisma/client";
// ... (ส่วนอื่นๆ)

export const waterDataRouter = createTRPCRouter({
  getLatestWaterData: protectedProcedure // 👈 ตรงนี้สำคัญมาก!
  .input(z.object({
    deviceId: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    from: z.date().optional(),
    to: z.date().optional()
  }))
  .query(async ({ ctx, input }) => { // `ctx` จะมีข้อมูล `session` ของผู้ใช้ที่ล็อกอิน
    try {
      const whereCondition: Prisma.WaterDataWhereInput = {
        timestamp: {
          gte: input.from ?? undefined,
          lte: input.to ?? undefined,
        },
        device: { // 👈 เงื่อนไขนี้!
          userId: ctx.session.user.id, // ✅ ดึงเฉพาะข้อมูลของอุปกรณ์ที่เป็นของผู้ใช้ปัจจุบัน
        },
      };

      if (input.deviceId) {
        whereCondition.deviceId = input.deviceId;
      }

      return await ctx.db.waterData.findMany({
        where: whereCondition,
        orderBy: { timestamp: 'desc' },
        take: input.limit,
        select: {
          id: true,
          temperature: true,
          ph: true,
          dissolvedOxygen: true,
          turbidity: true,
          timestamp: true,
          device: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      // Handle the error appropriately, e.g., log and throw
      console.error(error);
      throw new Error("Failed to fetch water data");
    }
  }),
  
});