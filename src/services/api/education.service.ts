/**
 * Django REST Framework Education Service
 * Endpoints:
 * - GET /courses/
 * - GET /batches/
 * - GET /paths/
 * - GET /schedules/
 */

import { apiClient } from './client';
import { GlobalPath, GlobalBatch, ClassScheduleSession, GlobalCategory } from '../../lib/db';

export const educationService = {
  getPaths: async () => apiClient.get<GlobalPath[]>('/education/paths/'),
  getBatches: async () => apiClient.get<GlobalBatch[]>('/education/batches/'),
  getSchedules: async () => apiClient.get<ClassScheduleSession[]>('/education/schedules/'),
  getCategories: async () => apiClient.get<GlobalCategory[]>('/education/categories/'),
};
