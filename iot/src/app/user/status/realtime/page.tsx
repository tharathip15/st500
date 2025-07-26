// src/app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Sidebar } from "~/app/_components/sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();

  // 1. ถ้าไม่ได้ล็อกอินให้กลับไปหน้า /login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 2. เรียก tRPC query getUserDevices (ไม่มี input เพราะดึงจาก ctx.session.user.id)
  const {
    data: devices,
    isLoading,
    error,
  } = api.device.getUserDevices.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  // 3. ระหว่างโหลด
  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading your devices...</p>
      </div>
    );
  }

  // 4. ถ้าเกิด error
  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">
          Failed to load devices: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar คงที่ด้านซ้าย */}
      <Sidebar />
      
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Your Devices</h1>

      {devices && devices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 cursor-pointer"
              // สมมติว่าเราต้องการไปดูรายละเอียด เพิ่ม navigation ได้ตามนี้
              onClick={() => router.push(`/dashboard/device/${device.id}`)}
            >
              <h2 className="text-xl font-semibold">{device.name}</h2>
              <p className="text-sm text-gray-500">Type: {device.type}</p>
              <p className="text-sm text-gray-500">
                Status: {device.status}
              </p>
              {device.location && (
                <p className="text-sm text-gray-500">
                  Location: {device.location}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Created:{" "}
                {new Date(device.createdAt).toLocaleString("th-TH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">You don’t have any devices yet.</p>
      )}
    </div>
    </div>
  );
}
