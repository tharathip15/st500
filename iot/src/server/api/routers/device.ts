// src/server/api/routers/device.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const deviceRouter = createTRPCRouter({
  // ดึงข้อมูลอุปกรณ์ของผู้ใช้ที่ล็อกอินเท่านั้น
  getUserDevices: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.device.findMany({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          location: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user devices"
      });
    }
  }),

  // ดึงข้อมูลอุปกรณ์ตาม ID (เฉพาะของตัวเอง)
  getDeviceById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const device = await ctx.db.device.findUnique({
        where: { id: input.id },
        include: {
          waterData: { orderBy: { timestamp: 'desc' }, take: 50 },
          lightData: { orderBy: { timestamp: 'desc' }, take: 50 },
          pumpLogs: { orderBy: { timestamp: 'desc' }, take: 20 },
          alertRules: true
        }
      });

      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found"
        });
      }

      if (device.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to access this device"
        });
      }

      return device;
    }),

  // ดึงข้อมูล WaterData ของ Device (เฉพาะของตัวเอง)
  getWaterDataByDeviceId: protectedProcedure
    .input(z.object({ 
      deviceId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      from: z.date().optional(),
      to: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // ตรวจสอบสิทธิ์การเข้าถึงอุปกรณ์
      const device = await ctx.db.device.findUnique({
        where: { id: input.deviceId },
        select: { userId: true }
      });

      if (!device || device.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to access this device's data"
        });
      }

      return ctx.db.waterData.findMany({
        where: { 
          deviceId: input.deviceId,
          timestamp: {
            gte: input.from,
            lte: input.to
          }
        },
        orderBy: { timestamp: 'desc' },
        take: input.limit
      });
    }),

  // สร้าง Alert Rule ใหม่
  createAlertRule: protectedProcedure
    .input(z.object({
      deviceId: z.string(),
      name: z.string().min(3),
      description: z.string().optional(),
      condition: z.object({
        metric: z.enum(["temperature", "ph", "dissolvedOxygen", "turbidity", "lightIntensity"]),
        operator: z.enum([">", "<", ">=", "<=", "=="]),
        value: z.number()
      }),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    }))
    .mutation(async ({ ctx, input }) => {
      // ตรวจสอบสิทธิ์การเข้าถึงอุปกรณ์
      const device = await ctx.db.device.findUnique({
        where: { id: input.deviceId },
        select: { userId: true }
      });

      if (!device || device.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to create alert for this device"
        });
      }

      return ctx.db.alertRule.create({
        data: {
          userId: ctx.session.user.id,
          deviceId: input.deviceId,
          name: input.name,
          description: input.description,
          condition: input.condition,
          severity: input.severity
        }
      });
    }),

  // ดึง Alert Rules ของอุปกรณ์
  getDeviceAlertRules: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // ตรวจสอบสิทธิ์การเข้าถึงอุปกรณ์
      const device = await ctx.db.device.findUnique({
        where: { id: input.deviceId },
        select: { userId: true }
      });

      if (!device || device.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to access this device's alerts"
        });
      }

      return ctx.db.alertRule.findMany({
        where: { deviceId: input.deviceId },
        orderBy: { createdAt: 'desc' }
      });
    }),

  // อัปเดตสถานะอุปกรณ์
  updateDeviceStatus: protectedProcedure
    .input(z.object({
      deviceId: z.string(),
      status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"])
    }))
    .mutation(async ({ ctx, input }) => {
      // ตรวจสอบสิทธิ์การเข้าถึงอุปกรณ์
      const device = await ctx.db.device.findUnique({
        where: { id: input.deviceId },
        select: { userId: true }
      });

      if (!device || device.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to update this device"
        });
      }

      return ctx.db.device.update({
        where: { id: input.deviceId },
        data: { status: input.status }
      });
    })
});