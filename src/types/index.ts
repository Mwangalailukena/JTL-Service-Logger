export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'technician' | 'client';
  linkedClientId?: string; // For client portal users
  photoURL?: string;
}

export interface ServiceLog {
  id: string;
  clientId: string;
  clientName: string;
  technicianId: string;
  technicianName: string;
  serviceDate: Date;
  description: string;
  notes?: string;
  images?: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export type Theme = 'light' | 'dark' | 'system';
