export type ServiceCallType = 'STAFF' | 'WATER' | 'BILL';

export interface ServiceCall {
  id: number;
  tableId: string;
  type: ServiceCallType;
  status: 'OPEN' | 'DONE';
  createdAt: string;
  doneAt?: string;
}

export const SERVICE_CALL_LABELS: Record<ServiceCallType, string> = {
  STAFF: 'เรียกพนักงาน',
  WATER: 'ขอน้ำเปล่า',
  BILL: 'เช็คบิล',
};
