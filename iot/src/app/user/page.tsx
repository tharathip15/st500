// src/app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react"; // ตรวจสอบว่านี่คือ path ที่ถูกต้องสำหรับ tRPC client ของคุณ
import { Sidebar } from "../_components/sidebar";
import { FaServer, FaCheckCircle, FaExclamationTriangle, FaBell } from "react-icons/fa";

// นำเข้าคอมโพเนนต์กราฟและ Type ที่เราสร้างไว้
import { WaterLineChart } from '../_components/water-charts'; 
import type { WaterDataPoint } from '../_types/water-data';

// FIX 1: กำหนด Type ให้กับ Props ของ StatCard
type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  colorClass: string;
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, colorClass }) => (
  <div className="flex items-center rounded-lg bg-white p-4 shadow">
    <div className={`mr-4 rounded-full p-3 text-white ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ดึงข้อมูลอุปกรณ์ของผู้ใช้
  const {
    data: devices,
    isLoading: isLoadingDevices, // เปลี่ยนชื่อเพื่อหลีกเลี่ยงความสับสนกับ isLoadingData
    error: devicesError,
  } = api.device.getUserDevices.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  // ดึงข้อมูลคุณภาพน้ำสำหรับกราฟ
  const { 
    data: waterData, 
    isLoading: isLoadingWaterData, 
    error: waterDataError 
  } = api.waterData.getLatestWaterData.useQuery(
    {
      limit: 100, // สามารถปรับจำนวนจุดข้อมูลได้
      // สามารถเพิ่ม deviceId หรือช่วงเวลาเพื่อกรองข้อมูลได้ที่นี่
    },
    {
      enabled: status === "authenticated", // ดึงข้อมูลก็ต่อเมื่อผู้ใช้ล็อกอินแล้ว
    }
  );

  // เตรียมข้อมูลสำหรับกราฟ: แปลง timestamp และเรียงลำดับ
  const chartData: WaterDataPoint[] = waterData
    ? waterData
        .map((d) => ({
          ...d,
          timestamp: new Date(d.timestamp), // แปลง ISO string เป็น Date object
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) // เรียงจากเก่าไปใหม่
    : [];


  // แก้ไขค่า DeviceStatus ให้ตรงกับ enum ใน schema.prisma ของคุณ
  // โดยปกติ Enum ใน Prisma จะถูกแปลงเป็น string ตามชื่อค่า
  const totalDevices = devices?.length ?? 0;
  const onlineDevices = devices?.filter((d) => d.status === "ACTIVE").length ?? 0; // สมมติว่า "ACTIVE" คือออนไลน์
  const alertDevices = devices?.filter((d) => d.status === "ERROR").length ?? 0; // สมมติว่า "ERROR" คือแจ้งเตือน
  // หากมี AlertRule และ AlertHistory model ที่แท้จริง ควรดึงข้อมูลจากตรงนั้น
  const recentAlerts = devices?.filter((d) => d.status === "ERROR").slice(0, 5) ?? []; // ตัวอย่าง, ควรดึงจาก AlertHistory จริงๆ

  // แสดง Loading state รวม
  if (status === "loading" || isLoadingDevices || isLoadingWaterData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        <p className="ml-3 text-lg text-gray-600">กำลังโหลด Dashboard...</p>
      </div>
    );
  }

  // แสดง Error state รวม
  if (devicesError || waterDataError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล!</h2>
          <p className="text-lg">
            {(devicesError?.message ?? waterDataError?.message) ?? "โปรดลองใหม่อีกครั้ง"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-4 pt-20 md:ml-64 md:p-6 md:pt-6">
        <h1 className="text-3xl font-bold text-gray-800">
          ยินดีต้อนรับ, {session?.user?.name ?? "User"}!
        </h1>
        <p className="mb-6 text-gray-500">ภาพรวมระบบบำบัดน้ำเสียของคุณ</p>

        {/* แถบสถิติอุปกรณ์ */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<FaServer size={22} />}
            title="อุปกรณ์ทั้งหมด"
            value={totalDevices}
            colorClass="bg-blue-500"
          />
          <StatCard
            icon={<FaCheckCircle size={22} />}
            title="ออนไลน์"
            value={onlineDevices}
            colorClass="bg-green-500"
          />
          <StatCard
            icon={<FaExclamationTriangle size={22} />}
            title="แจ้งเตือน"
            value={alertDevices}
            colorClass="bg-red-500"
          />
        </div>

        {/* ส่วนแสดงสถานะอุปกรณ์และแจ้งเตือนล่าสุด */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8"> {/* เพิ่ม mb-8 เพื่อเว้นพื้นที่สำหรับกราฟ */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-2xl font-semibold text-gray-700">
              สถานะอุปกรณ์
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {devices && devices.length > 0 ? (
                devices.map((device) => (
                  <div
                    key={device.id}
                    className="transform cursor-pointer rounded-lg bg-white p-4 shadow transition hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => router.push(`/status/realtime?device=${device.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">{device.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                          device.status === "ACTIVE" ? "bg-green-500" :
                          device.status === "ERROR" ? "bg-red-500" : "bg-gray-400"
                        }`}
                      >
                        {device.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{device.type}</p>
                    <p className="text-sm text-gray-500">{device.location}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-lg bg-white p-6 text-center text-gray-500">
                  <p>ยังไม่มีอุปกรณ์ในระบบ</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 text-2xl font-semibold text-gray-700">
              <FaBell className="mr-2 inline-block" />
              การแจ้งเตือนล่าสุด
            </h2>
            {recentAlerts.length > 0 ? (
              <ul className="space-y-3">
                {recentAlerts.map((alert) => (
                  // alert.id และ alert.name มาจาก device object ในตัวอย่างนี้
                  // ในระบบจริง คุณจะใช้ AlertHistory model เพื่อแสดงการแจ้งเตือนที่เกิดขึ้น
                  <li key={alert.id} className="flex items-start text-sm">
                    <FaExclamationTriangle className="mr-3 mt-1 flex-shrink-0 text-red-500" />
                    <div>
                      <span className="font-bold">{alert.name}</span>
                      <span className="text-gray-600"> มีสถานะผิดปกติ</span>
                      <p className="text-xs text-gray-400">
                          {/* หากเป็น AlertHistory จะมี triggeredAt หรือ createdAt */}
                          {/* ถ้าใช้ device.createdAt ก็ต้องระวังว่ามันคือเวลาสร้างอุปกรณ์ ไม่ใช่เวลาแจ้งเตือน */}
                          {/* ตัวอย่างนี้ยังคงใช้ device.createdAt แต่ควรปรับให้ดึงจาก AlertHistory */}
                          {new Date(alert.createdAt).toLocaleString("th-TH")} 
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">ไม่มีการแจ้งเตือน</p>
            )}
          </div>
        </div>

        {/* --- ส่วนที่เราเพิ่มเข้ามา: กราฟข้อมูลคุณภาพน้ำ --- */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          กราฟข้อมูลคุณภาพน้ำล่าสุด
        </h2>
        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <WaterLineChart data={chartData} chartType="dissolvedOxygen" />
            <WaterLineChart data={chartData} chartType="temperature" />
            <WaterLineChart data={chartData} chartType="ph" />
            <WaterLineChart data={chartData} chartType="turbidity" />
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">
            <p>ไม่พบข้อมูลคุณภาพน้ำสำหรับกราฟ</p>
          </div>
        )}
        {/* --- สิ้นสุดส่วนกราฟ --- */}
      </main>
    </div>
  );
}