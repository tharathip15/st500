// src/server/api/routers/user.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

// Schema สำหรับ validation
const registerSchema = z.object({
  email: z.string().email("กรุณาใส่อีเมลที่ถูกต้อง"),
  password: z.string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "รหัสผ่านต้องมีอักษรเล็ก ใหญ่ และตัวเลข"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").optional(),
});

const loginSchema = z.object({
  email: z.string().email("กรุณาใส่อีเมลที่ถูกต้อง"),
  password: z.string().min(1, "กรุณาใส่รหัสผ่าน"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").optional(),
  email: z.string().email("กรุณาใส่อีเมลที่ถูกต้อง").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณาใส่รหัสผ่านปัจจุบัน"),
  newPassword: z.string()
    .min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "รหัสผ่านใหม่ต้องมีอักษรเล็ก ใหญ่ และตัวเลข"),
  confirmNewPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmNewPassword"],
});

export const userRouter = createTRPCRouter({
  // ลงทะเบียนผู้ใช้ใหม่
  registerUser: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // ตรวจสอบว่า Email ถูกใช้งานไปแล้วหรือยัง
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email.toLowerCase() },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "อีเมลนี้ถูกใช้งานแล้ว",
          });
        }

        // Hash รหัสผ่านด้วย bcrypt
        const hashedPassword = await bcrypt.hash(input.password, 12);

        // บันทึกผู้ใช้ใหม่ลง Database
        const newUser = await ctx.db.user.create({
          data: {
            email: input.email.toLowerCase(),
            hashedPassword: hashedPassword,
            name: input.name ?? input.email.split('@')[0],
            role: "USER", // ค่าเริ่มต้น
            emailVerified: null, // รอการยืนยัน email
          },
        });

        // คืนค่าข้อมูลที่ปลอดภัย
        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          message: "ลงทะเบียนสำเร็จ",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการลงทะเบียน",
        });
      }
    }),

  // เข้าสู่ระบบ (สำหรับใช้กับ credentials provider)
  loginUser: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // ค้นหาผู้ใช้จากอีเมล
        const user = await ctx.db.user.findUnique({
          where: { email: input.email.toLowerCase() },
        });

        if (!user?.hashedPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          });
        }

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(
          input.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          });
        }

        // อัปเดตเวลาเข้าสู่ระบบล่าสุด
        // await ctx.db.user.update({
        //   where: { id: user.id },
        //   data: { lastLogin: new Date() },
        // });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          message: "เข้าสู่ระบบสำเร็จ",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
        });
      }
    }),

  // ดูข้อมูลโปรไฟล์ของตัวเอง
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            // createdAt: true,
            // lastLogin: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ไม่พบข้อมูลผู้ใช้",
          });
        }

        return user;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        });
      }
    }),

  // อัปเดตโปรไฟล์
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // ตรวจสอบว่าอีเมลใหม่ถูกใช้งานแล้วหรือยัง (ถ้ามีการเปลี่ยน)
        if (input.email) {
          const existingUser = await ctx.db.user.findUnique({
            where: { email: input.email.toLowerCase() },
          });

          if (existingUser && existingUser.id !== ctx.session.user.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "อีเมลนี้ถูกใช้งานแล้ว",
            });
          }
        }

        const updatedUser = await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.email && { email: input.email.toLowerCase() }),
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        return {
          ...updatedUser,
          message: "อัปเดตข้อมูลสำเร็จ",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        });
      }
    }),

  // เปลี่ยนรหัสผ่าน
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!user?.hashedPassword) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ไม่พบข้อมูลผู้ใช้",
          });
        }

        // ตรวจสอบรหัสผ่านปัจจุบัน
        const isCurrentPasswordValid = await bcrypt.compare(
          input.currentPassword,
          user.hashedPassword
        );

        if (!isCurrentPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
          });
        }

        // Hash รหัสผ่านใหม่
        const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);

        // อัปเดตรหัสผ่าน
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { hashedPassword: hashedNewPassword },
        });

        return {
          message: "เปลี่ยนรหัสผ่านสำเร็จ",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
        });
      }
    }),

  // ดูรายชื่อผู้ใช้ (สำหรับ admin)
  getAllUsers: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // ตรวจสอบสิทธิ์ admin
        const currentUser = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (currentUser?.role !== "ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
          });
        }

        const skip = (input.page - 1) * input.limit;
        const where = input.search ? {
          OR: [
            { email: { contains: input.search, mode: "insensitive" as const } },
            { name: { contains: input.search, mode: "insensitive" as const } },
          ],
        } : {};

        const [users, total] = await Promise.all([
          ctx.db.user.findMany({
            where,
            skip,
            take: input.limit,
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              emailVerified: true,
              // createdAt: true,
              // lastLogin: true,
            },
            // orderBy: { createdAt: "desc" },
          }),
          ctx.db.user.count({ where }),
        ]);

        return {
          users,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            pages: Math.ceil(total / input.limit),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        });
      }
    }),

  // ลบบัญชี
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string().min(1, "กรุณาใส่รหัสผ่านเพื่อยืนยัน"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!user?.hashedPassword) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ไม่พบข้อมูลผู้ใช้",
          });
        }

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(
          input.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "รหัสผ่านไม่ถูกต้อง",
          });
        }

        // ลบบัญชี
        await ctx.db.user.delete({
          where: { id: ctx.session.user.id },
        });

        return {
          message: "ลบบัญชีสำเร็จ",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "เกิดข้อผิดพลาดในการลบบัญชี",
        });
      }
    }),
});