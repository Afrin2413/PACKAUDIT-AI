import {
  User,
  Inspection,
  DashboardStats,
  AnalyticsData,
  Rule,
  ReportItem
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('packaudit_token');
  }

  public setToken(token: string) {
    localStorage.setItem('packaudit_token', token);
  }

  public clearToken() {
    localStorage.removeItem('packaudit_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `Request failed (${response.status})`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch {
          // Non-JSON error
        }
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Auth APIs ---
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // --- Dashboard APIs ---
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // --- Inspections APIs ---
  async createAndAnalyze(formData: FormData): Promise<Inspection> {
    return this.request<Inspection>('/inspections', {
      method: 'POST',
      body: formData,
    });
  }

  async listInspections(params: {
    search?: string;
    status?: string;
    risk?: string;
    category?: string;
  } = {}): Promise<Inspection[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.risk) query.append('risk', params.risk);
    if (params.category) query.append('category', params.category);

    const queryString = query.toString();
    const endpoint = queryString ? `/inspections?${queryString}` : '/inspections';
    return this.request<Inspection[]>(endpoint);
  }

  async getInspection(id: string): Promise<Inspection> {
    return this.request<Inspection>(`/inspections/${id}`);
  }

  async deleteInspection(id: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/inspections/${id}`, {
      method: 'DELETE',
    });
  }

  async getInspectionEvidence(id: string): Promise<any> {
    return this.request<any>(`/inspections/${id}/evidence`);
  }

  // --- Reports APIs ---
  async generateReport(inspectionId: string): Promise<{
    report_id: string;
    inspection_id: string;
    file_name: string;
    file_size_bytes: number;
    download_url: string;
  }> {
    return this.request(`/inspections/${inspectionId}/report`, {
      method: 'POST',
    });
  }

  async listReports(): Promise<ReportItem[]> {
    return this.request<ReportItem[]>('/reports');
  }

  getReportDownloadUrl(reportId: string): string {
    return `${BASE_URL}/reports/${reportId}/download`;
  }

  getReportPreviewUrl(reportId: string): string {
    return `${BASE_URL}/reports/${reportId}/preview`;
  }

  // --- Rules APIs ---
  async getRules(): Promise<{
    version: string;
    title: string;
    authority: string;
    last_updated: string;
    disclaimer: string;
    rules: Rule[];
  }> {
    return this.request('/rules');
  }

  async updateRule(ruleId: string, updates: Partial<Rule>): Promise<{ status: string; rule: Rule }> {
    return this.request(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // --- Analytics APIs ---
  async getAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>('/analytics');
  }
}

export const apiClient = new ApiClient();
