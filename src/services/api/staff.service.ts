/**
 * Django REST Framework Staff Service
 * Endpoints:
 * - GET    /staff/ -> list of staff members
 * - POST   /staff/ -> create staff member
 * - GET    /staff/{id}/ -> retrieve staff details
 * - PATCH  /staff/{id}/ -> update staff details
 * - DELETE /staff/{id}/ -> remove staff
 * - GET    /attendance/ -> list attendance records
 * - POST   /attendance/ -> log staff attendance
 */

import { apiClient } from './client';
import { StaffUser, AttendanceLog } from '../../lib/db';

export const staffService = {
  /**
   * Fetch all staff members from DRF
   */
  getStaffRegistry: async (params?: { department?: string; search?: string }) => {
    let url = '/staff/';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.department) searchParams.append('department', params.department);
      if (params.search) searchParams.append('search', params.search);
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    return apiClient.get<StaffUser[]>(url);
  },

  /**
   * Create a new staff member in DRF
   */
  createStaff: async (staffData: Partial<StaffUser>) => {
    return apiClient.post<StaffUser>('/staff/', staffData);
  },

  /**
   * Update an existing staff member in DRF
   */
  updateStaff: async (id: string, staffData: Partial<StaffUser>) => {
    return apiClient.patch<StaffUser>(`/staff/${id}/`, staffData);
  },

  /**
   * Delete a staff member in DRF
   */
  deleteStaff: async (id: string) => {
    return apiClient.delete(`/staff/${id}/`);
  },

  /**
   * Fetch staff attendance logs from DRF
   */
  getAttendanceLogs: async (params?: { staffId?: string; date?: string }) => {
    let url = '/attendance/';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.staffId) searchParams.append('staff_id', params.staffId);
      if (params.date) searchParams.append('date', params.date);
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    return apiClient.get<AttendanceLog[]>(url);
  },

  /**
   * Log check-in / attendance for staff in DRF
   */
  logAttendance: async (attendance: Omit<AttendanceLog, 'id'>) => {
    return apiClient.post<AttendanceLog>('/attendance/', attendance);
  },
};
