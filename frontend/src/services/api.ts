import {
  ADRReport,
  AIExtractionResponse,
  DashboardStats,
  NaranjoQuestion,
  User,
  DemoAccount,
  ClinicalScenario
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('adr_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('adr_auth_token', token);
    } else {
      localStorage.removeItem('adr_auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // --- Auth Endpoints ---
  async login(credentials: { username: string; password: string }): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async getDemoAccounts(): Promise<DemoAccount[]> {
    return this.request<DemoAccount[]>('/auth/demo-accounts');
  }

  // --- AI & Extraction Endpoints ---
  async extractFromNarrative(narrative: string, apiKey?: string): Promise<AIExtractionResponse> {
    return this.request<AIExtractionResponse>('/ai/extract', {
      method: 'POST',
      body: JSON.stringify({ clinical_narrative: narrative, api_key: apiKey })
    });
  }

  async validateReport(reportData: Partial<ADRReport>): Promise<{
    missing_fields: any[];
    completeness_score: number;
    ich_criteria_met: boolean;
  }> {
    return this.request('/ai/validate', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  async getScenarios(): Promise<ClinicalScenario[]> {
    return this.request<ClinicalScenario[]>('/ai/scenarios');
  }

  async getNaranjoQuestions(): Promise<NaranjoQuestion[]> {
    return this.request<NaranjoQuestion[]>('/ai/naranjo-questions');
  }

  async evaluateNaranjo(answers: Record<string, number>): Promise<{
    total_score: number;
    category: string;
    interpretation: string;
    details: any;
  }> {
    return this.request('/ai/causality', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }

  // --- Report Endpoints ---
  async getReports(params?: {
    search?: string;
    status?: string;
    is_serious?: boolean;
    drug_name?: string;
  }): Promise<ADRReport[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.is_serious !== undefined) query.append('is_serious', String(params.is_serious));
    if (params?.drug_name) query.append('drug_name', params.drug_name);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<ADRReport[]>(`/reports${queryString}`);
  }

  async getReportById(id: number): Promise<ADRReport> {
    return this.request<ADRReport>(`/reports/${id}`);
  }

  async createReport(report: Partial<ADRReport>): Promise<ADRReport> {
    return this.request<ADRReport>('/reports', {
      method: 'POST',
      body: JSON.stringify(report)
    });
  }

  async updateReport(id: number, report: Partial<ADRReport>): Promise<ADRReport> {
    return this.request<ADRReport>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(report)
    });
  }

  async verifyReport(id: number, data: { approved: boolean; verification_notes?: string }): Promise<ADRReport> {
    return this.request<ADRReport>(`/reports/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async submitReport(id: number): Promise<ADRReport> {
    return this.request<ADRReport>(`/reports/${id}/submit`, {
      method: 'POST'
    });
  }

  async deleteReport(id: number): Promise<void> {
    await this.request(`/reports/${id}`, { method: 'DELETE' });
  }

  // --- Export Endpoints ---
  getPdfExportUrl(id: number): string {
    return `${API_BASE_URL}/reports/${id}/export/pdf`;
  }

  getE2bExportUrl(id: number): string {
    return `${API_BASE_URL}/reports/${id}/export/e2b`;
  }

  // --- Analytics ---
  async getDashboardAnalytics(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/analytics/dashboard');
  }
}

export const api = new ApiService();
