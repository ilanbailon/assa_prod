export interface Requirement {
  code: string;
  type: 'Staff' | 'Machine' | 'Service';
  requestDate: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'REJECTED';
  attachmentUrl?: string;
  requestor: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  module: string;
}
