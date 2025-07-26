// src/app/_types/water-data.ts
export type WaterDataPoint = {
  id: number;
  timestamp: Date; // ต้องเป็น Date object
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  turbidity: number;
  // หากคุณ `select` ฟิลด์ device ใน tRPC ด้วย ก็สามารถเพิ่มที่นี่ได้ เช่น:
  // device: {
  //   id: string;
  //   name: string;
  // };
};