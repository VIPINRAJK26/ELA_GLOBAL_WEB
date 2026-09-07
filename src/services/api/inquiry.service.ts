/**
 * Django REST Framework Inquiry & Lead Service
 * Endpoints:
 * - GET    /inquiries/ -> list inquiries
 * - POST   /inquiries/ -> create new inquiry / intake lead
 * - GET    /inquiries/{id}/ -> single inquiry details
 * - PATCH  /inquiries/{id}/ -> update inquiry status/details
 * - DELETE /inquiries/{id}/ -> delete inquiry
 * - POST   /inquiries/{id}/follow-ups/ -> add follow up record
 * - POST   /inquiries/{id}/assign/ -> assign staff
 */

import { apiClient } from './client';
import { Inquiry, FollowUpRecord } from '../../lib/db';

export const inquiryService = {
  /**
   * Fetch all inquiries from DRF with optional filtering
   */
  getInquiries: async (params?: { category?: string; status?: string; search?: string; department?: string }) => {
    let url = '/inquiries/';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.category) searchParams.append('category', params.category);
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      if (params.department) searchParams.append('department', params.department);
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    return apiClient.get<Inquiry[]>(url);
  },

  /**
   * Create an inquiry in DRF
   */
  createInquiry: async (inquiryData: Partial<Inquiry>) => {
    return apiClient.post<Inquiry>('/inquiries/', inquiryData);
  },

  /**
   * Update inquiry fields in DRF
   */
  updateInquiry: async (id: string, updates: Partial<Inquiry>) => {
    return apiClient.patch<Inquiry>(`/inquiries/${id}/`, updates);
  },

  /**
   * Assign inquiry to staff member
   */
  assignStaff: async (inquiryId: string, staffId: string, staffName: string) => {
    return apiClient.patch<Inquiry>(`/inquiries/${inquiryId}/`, {
      assignedStaffId: staffId,
      assignedStaffName: staffName,
      crmStatus: 'In Progress',
    });
  },

  /**
   * Add a follow up record to an inquiry in DRF
   */
  addFollowUp: async (inquiryId: string, record: Partial<FollowUpRecord> & { nextFollowUpDate?: string }) => {
    return apiClient.post<Inquiry>(`/inquiries/${inquiryId}/follow-ups/`, record);
  },

  /**
   * Delete inquiry in DRF
   */
  deleteInquiry: async (id: string) => {
    return apiClient.delete(`/inquiries/${id}/`);
  },
};
