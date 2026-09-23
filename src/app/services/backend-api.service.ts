import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  user?: T;
  token?: string;
  imagePath?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class BackendApiService {
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /**
   * Helper สร้าง HttpHeaders สำหรับใส่ JWT Token
   */
  private getHeaders(token?: string | null): HttpHeaders {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ==========================================
  // USER API ENDPOINTS
  // ==========================================

  postSignUp(data: { email: string; password: string; name: string; username?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/users/signup`, data);
  }

  postLogin(data: { email: string; password: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/users/login`, data);
  }

  getUserMe(token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/users/me`, { headers: this.getHeaders(token) });
  }

  putUserPlan(plan: string, token?: string | null): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/users/plan`, { plan }, { headers: this.getHeaders(token) });
  }

  putUserProfile(payload: { id?: number; email?: string; name: string; phone: string; description?: string }, token?: string | null): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/users/profile`, payload, { headers: this.getHeaders(token) });
  }

  postUploadProfilePic(formData: FormData, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/users/upload-profile-pic`, formData, { headers: this.getHeaders(token) });
  }

  // ==========================================
  // PROJECT API ENDPOINTS
  // ==========================================

  getProjects(token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/projects`, { headers: this.getHeaders(token) });
  }

  postProject(data: { name: string; detail?: string }, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/projects`, data, { headers: this.getHeaders(token) });
  }

  deleteProject(id: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/projects/${id}`, { headers: this.getHeaders(token) });
  }

  getProjectDetail(id: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/projects/${id}`, { headers: this.getHeaders(token) });
  }

  putProjectDetail(id: string | number, data: { name: string; detail?: string }, token?: string | null): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/projects/${id}`, data, { headers: this.getHeaders(token) });
  }

  postProjectMember(projectId: string | number, data: { email: string; role: string }, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/projects/${projectId}/members`, data, { headers: this.getHeaders(token) });
  }

  deleteProjectMember(projectId: string | number, memberId: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/projects/${projectId}/members/${memberId}`, { headers: this.getHeaders(token) });
  }

  // ==========================================
  // DIAGRAM API ENDPOINTS
  // ==========================================

  getDiagramByType(projectId: string | number, type: string, token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/type/${type}`, { headers: this.getHeaders(token) });
  }

  postUploadDiagram(data: { projectId: number | string; type: string; fileName: string; imagePath: string }, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/diagrams/upload`, data, { headers: this.getHeaders(token) });
  }

  postUploadDiagramImage(formData: FormData, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/diagrams/upload-image`, formData, { headers: this.getHeaders(token) });
  }

  // Use Case Diagram API Endpoints
  getUseCases(projectId: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/use-cases`, { headers: this.getHeaders(token) });
  }

  saveUseCase(projectId: string | number, useCaseData: any, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/use-cases`, useCaseData, { headers: this.getHeaders(token) });
  }

  deleteUseCase(projectId: string | number, id: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/use-cases/${id}`, { headers: this.getHeaders(token) });
  }

  // Class Diagram API Endpoints
  getClasses(projectId: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/classes`, { headers: this.getHeaders(token) });
  }

  saveClass(projectId: string | number, classData: any, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/classes`, classData, { headers: this.getHeaders(token) });
  }

  deleteClass(projectId: string | number, id: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/classes/${id}`, { headers: this.getHeaders(token) });
  }

  // Activity Diagram API Endpoints
  getActivityDiagrams(projectId: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/activity-diagrams`, { headers: this.getHeaders(token) });
  }

  saveActivityDiagram(projectId: string | number, diagramData: any, token?: string | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/activity-diagrams`, diagramData, { headers: this.getHeaders(token) });
  }

  deleteActivityDiagram(projectId: string | number, diagramId: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/diagrams/project/${projectId}/activity-diagrams/${diagramId}`, { headers: this.getHeaders(token) });
  }

  // ==========================================
  // EXPORT API ENDPOINTS
  // ==========================================

  getExportUseCase(projectId: string | number, token: string | null): Observable<Blob> {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const noCache = new Date().getTime();
    return this.http.get(`${this.baseUrl}/export/project/${projectId}/use-case?_t=${noCache}`, {
      headers,
      responseType: 'blob'
    });
  }

  getExportClassDiagram(projectId: string | number, token: string | null): Observable<Blob> {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const noCache = new Date().getTime();
    return this.http.get(`${this.baseUrl}/export/project/${projectId}/class-diagram?_t=${noCache}`, {
      headers,
      responseType: 'blob'
    });
  }

  getExportActivityDiagram(projectId: string | number, token: string | null): Observable<Blob> {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const noCache = new Date().getTime();
    return this.http.get(`${this.baseUrl}/export/project/${projectId}/activity-diagram?_t=${noCache}`, {
      headers,
      responseType: 'blob'
    });
  }

  // ==========================================
  // ADMIN API ENDPOINTS
  // ==========================================

  getAdminUsers(token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/admin/users`, { headers: this.getHeaders(token) });
  }

  putAdminUserRole(id: string | number, role: string, token?: string | null): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/admin/users/${id}/role`, { role }, { headers: this.getHeaders(token) });
  }

  deleteAdminUser(id: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/admin/users/${id}`, { headers: this.getHeaders(token) });
  }

  getAdminUserProjects(id: string | number, token?: string | null): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/admin/users/${id}/projects`, { headers: this.getHeaders(token) });
  }
}
