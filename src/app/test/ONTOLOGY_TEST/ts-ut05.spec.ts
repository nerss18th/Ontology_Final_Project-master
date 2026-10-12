import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT05: โมดูลจัดการสมาชิกในทีม (Team) (For Test ID: UT05)', () => {
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;
  const mockOwnerToken = 'mock-owner-token';
  const mockMemberToken = 'mock-non-owner-token';
  const projectId = 101;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BackendApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    apiService = TestBed.inject(BackendApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('เชิญผู้ใช้ในระบบเข้าสู่ทีม -> Pass: สร้างสิทธิ์สมาชิกในฐานข้อมูลสำเร็จ', () => {
    const inviteData = { email: 'teammate@example.com', role: 'Editor' };

    apiService.postProjectMember(projectId, inviteData, mockOwnerToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('เพิ่มสมาชิกสำเร็จ');
    });

    const req = httpMock.expectOne(`http://localhost:3000/projects/${projectId}/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(inviteData);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockOwnerToken}`);

    req.flush({
      success: true,
      message: 'เพิ่มสมาชิกสำเร็จ',
    });
  });

  it('ลบสมาชิกโดยเจ้าของ (Owner) -> Pass: สมาชิกถูกลบออกจากทีมโปรเจกต์', () => {
    const memberId = 205;

    apiService.deleteProjectMember(projectId, memberId, mockOwnerToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('ลบสมาชิกสำเร็จ');
    });

    const req = httpMock.expectOne(`http://localhost:3000/projects/${projectId}/members/${memberId}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockOwnerToken}`);

    req.flush({
      success: true,
      message: 'ลบสมาชิกสำเร็จ',
    });
  });

  it('ลบสมาชิกโดยผู้ที่ไม่มีสิทธิ์ (ไม่มี Owner) -> Pass: แจ้งเตือนข้อผิดพลาด "คุณไม่มีสิทธิ์"', () => {
    const memberId = 205;

    apiService.deleteProjectMember(projectId, memberId, mockMemberToken).subscribe({
      next: (res) => {
        expect(res.success).toBe(false);
        expect(res.message).toContain('ไม่มีสิทธิ์');
      },
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.error?.message).toContain('คุณไม่มีสิทธิ์');
      },
    });

    const req = httpMock.expectOne(`http://localhost:3000/projects/${projectId}/members/${memberId}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockMemberToken}`);

    req.flush(
      { success: false, message: 'คุณไม่มีสิทธิ์ลบสมาชิกในโปรเจกต์นี้' },
      { status: 403, statusText: 'Forbidden' }
    );
  });
});
