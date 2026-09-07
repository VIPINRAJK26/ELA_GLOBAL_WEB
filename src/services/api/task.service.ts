/**
 * Django REST Framework Task & Approval Service
 * Endpoints:
 * - GET    /tasks/ -> list enterprise tasks
 * - POST   /tasks/ -> create enterprise task
 * - PATCH  /tasks/{id}/ -> update task status
 * - DELETE /tasks/{id}/ -> remove task
 * - GET    /approvals/ -> list approval requests
 * - POST   /approvals/ -> submit approval request
 * - PATCH  /approvals/{id}/ -> update approval (Approve/Reject)
 * - GET    /activity-logs/ -> list system update logs
 */

import { apiClient } from './client';
import { EnterpriseTask, ApprovalRequest, UpdateLog } from '../../lib/db';

export const taskService = {
  getTasks: async (params?: { department?: string; status?: string }) => {
    let url = '/tasks/';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.department) searchParams.append('dept', params.department);
      if (params.status) searchParams.append('status', params.status);
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    return apiClient.get<EnterpriseTask[]>(url);
  },

  createTask: async (task: Partial<EnterpriseTask>) => {
    return apiClient.post<EnterpriseTask>('/tasks/', task);
  },

  updateTask: async (id: string, updates: Partial<EnterpriseTask>) => {
    return apiClient.patch<EnterpriseTask>(`/tasks/${id}/`, updates);
  },

  deleteTask: async (id: string) => {
    return apiClient.delete(`/tasks/${id}/`);
  },

  getApprovals: async () => {
    return apiClient.get<ApprovalRequest[]>('/approvals/');
  },

  submitApproval: async (approval: Partial<ApprovalRequest>) => {
    return apiClient.post<ApprovalRequest>('/approvals/', approval);
  },

  updateApproval: async (id: string, status: 'Approved' | 'Rejected') => {
    return apiClient.patch<ApprovalRequest>(`/approvals/${id}/`, { status });
  },

  getActivityLogs: async () => {
    return apiClient.get<UpdateLog[]>('/activity-logs/');
  },
};
