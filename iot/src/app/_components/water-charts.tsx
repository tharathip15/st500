"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
// ตรวจสอบให้แน่ใจว่าไฟล์นี้มี Type 'WaterDataPoint' ที่ถูกต้องตาม Prisma schema ของคุณ
import { type WaterDataPoint } from '../_types/water-data'; 

// --- Configuration สำหรับกราฟแต่ละประเภท ---
// สิ่งนี้ช่วยให้โค้ดสะอาดขึ้นและลดการเขียนโค้ดซ้ำ
type ChartConfig = {
  dataKey: keyof WaterDataPoint; // ใช้ keyof เพื่อความปลอดภัยของ Type (ต้องตรงกับชื่อฟิลด์ใน WaterDataPoint)
  name: string; // ชื่อที่แสดงบนหัวข้อกราฟและ legend
  unit: string; // หน่วยที่แสดงบนหัวข้อกราฟและ tooltip
  stroke: string; // สีของเส้นกราฟ
  yDomain?: [number | 'auto', number | 'auto']; // ช่วงแกน Y (เช่น pH คือ 0-14)
};

const chartConfigs: Record<string, ChartConfig> = {
  temperature: {
    dataKey: 'temperature',
    name: 'อุณหภูมิ',
    unit: '°C',
    stroke: '#FF6384', // แดงอมชมพู
    yDomain: ['auto', 'auto'], // ปรับตามข้อมูลจริงได้
  },
  ph: {
    dataKey: 'ph',
    name: 'ระดับ pH',
    unit: '', // pH ไม่มีหน่วยเฉพาะ
    stroke: '#36A2EB', // น้ำเงิน
    yDomain: [0, 14], // pH มีช่วง 0-14
  },
  dissolvedOxygen: {
    dataKey: 'dissolvedOxygen',
    name: 'ออกซิเจนละลายน้ำ',
    unit: 'mg/L',
    stroke: '#4BC0C0', // เขียวอมฟ้า
    yDomain: ['auto', 'auto'], // ปรับตามข้อมูลจริงได้
  },
  turbidity: {
    dataKey: 'turbidity',
    name: 'ความขุ่น',
    unit: 'NTU',
    stroke: '#9966FF', // ม่วง
    yDomain: ['auto', 'auto'], // ปรับตามข้อมูลจริงได้
  },
};

// --- ฟังก์ชันสำหรับจัดรูปแบบเวลาบนแกน X และใน Tooltip ---
const formatTimeTick = (timestamp: Date): string => {
  // แสดงเฉพาะเวลา (ชั่วโมง:นาที)
  return timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

// --- Custom Tooltip สำหรับแสดงข้อมูลเมื่อโฮเวอร์ ---
const CustomTooltip = ({
  active,
  payload,
  label, // label คือ timestamp ที่ถูกส่งมา (ตอนนี้เป็น Date object)
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    dataKey?: keyof WaterDataPoint; // ใช้ dataKey จาก config
  }[];
  label?: Date; // รับเป็น Date object โดยตรง
}) => {
  if (!active || !payload?.length || !label) return null;

  // จัดรูปแบบเวลาให้แสดงวันที่และเวลาแบบเต็มเพื่อความชัดเจน
  const dateTimeLabel = label.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white/90 p-4 shadow-xl backdrop-blur-sm">
      <p className="font-bold text-gray-800 mb-1">{dateTimeLabel}</p>
      {payload.map((entry, index) => {
        // ค้นหา config ที่ตรงกับ dataKey เพื่อดึงชื่อและหน่วยที่ถูกต้อง
        const config = Object.values(chartConfigs).find(
          (c) => c.dataKey === entry.dataKey
        );
        const displayUnit = config?.unit ?? ''; 
        const displayName = config?.name ?? entry.name;
        const displayColor = config?.stroke ?? 'text-gray-700'; // ใช้สีจาก config

        return (
          <p key={`item-${index}`} className={`text-sm`} style={{ color: displayColor }}>
            {displayName}: <span className="font-semibold">{entry.value !== undefined ? entry.value.toFixed(2) : 'N/A'}</span> {displayUnit}
          </p>
        );
      })}
    </div>
  );
};






export const WaterLineChart = ({
  data,
  chartType, // รับประเภทกราฟเข้ามา (เช่น "temperature", "ph")
}: { data: WaterDataPoint[]; chartType: keyof typeof chartConfigs }) => {
  const config = chartConfigs[chartType]; // ดึง config สำหรับกราฟประเภทนั้นๆ

  // แสดงข้อผิดพลาดหากประเภทกราฟไม่ถูกต้อง
  if (!config) {
    console.error(`Invalid chart type: ${chartType}`);
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 flex items-center justify-center h-[350px]">
        <p className="text-red-500 font-medium">เกิดข้อผิดพลาด: ประเภทกราฟไม่ถูกต้อง</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 transform hover:scale-[1.01] transition-transform duration-200 ease-in-out">
      {/* หัวข้อกราฟ พร้อมหน่วย */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        {config.name} {config.unit && `(${config.unit})`} 
      </h3>
      <div className="h-[350px]"> {/* กำหนดความสูงของพื้นที่กราฟ */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" /> {/* ปรับ dash และสี grid */}
            <XAxis
              dataKey="timestamp" // ฟิลด์ timestamp เป็นข้อมูลสำหรับแกน X
              tickFormatter={formatTimeTick} // ใช้ฟังก์ชันจัดรูปแบบเวลา
              minTickGap={30} // ช่วยจัดการไม่ให้ label ซ้อนกัน
              angle={-25} // เอียง label เล็กน้อย
              textAnchor="end" // จัดตำแหน่งข้อความ
              height={50} // เพิ่มความสูงให้ XAxis เพื่อรองรับ label เอียง
              tick={{ fill: '#6b7280', fontSize: 12 }} // สีและขนาด font ของ tick
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={config.yDomain ?? ['auto', 'auto']} // ใช้ domain จาก config
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              width={80} // เพิ่มความกว้างให้ YAxis ถ้าค่ามีตัวเลขเยอะ
            />
            {/* Tooltip ส่งข้อมูลให้ CustomTooltip ของเรา */}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" /> {/* ปรับตำแหน่ง Legend */}
            <Line
              type="monotone" // รูปแบบเส้นโค้งที่สวยงาม
              dataKey={config.dataKey} // ดึงข้อมูลตาม dataKey ที่กำหนดใน config (เช่น "temperature")
              stroke={config.stroke} // ใช้สีเส้นจาก config
              strokeWidth={3} // เพิ่มความหนาเส้น
              dot={{ r: 4, strokeWidth: 1, fill: config.stroke, stroke: '#fff' }} // ปรับจุดเริ่มต้น
              activeDot={{ r: 7, strokeWidth: 2, fill: config.stroke, stroke: '#fff' }} // จุดที่ active เมื่อโฮเวอร์
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};