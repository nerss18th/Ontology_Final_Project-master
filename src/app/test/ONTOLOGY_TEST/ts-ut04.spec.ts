import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT04: โมดูลจัดการข้อมูลโปรเจกต์ (สร้าง/แก้ไข/ลบ) (For Test ID: UT04)', () => {
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;
  const mockToken = 'mock-token-ut04';

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

  it('สร้างโปรเจกต์ใหม่ (ในโควตา Plan) -> Pass: โปรเจกต์ถูกบันทึกลงฐานข้อมูล', () => {
    const newProject = { name: 'Hospital Ontology System', detail: 'ระบบจัดการแผนภาพโรงพยาบาล' };

    apiService.postProject(newProject, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res['projectId']).toBe(101);
      expect(res.message).toBe('สร้าง Project สำเร็จ');
    });

    const req = httpMock.expectOne('http://localhost:3000/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProject);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush({
      success: true,
      message: 'สร้าง Project สำเร็จ',
      projectId: 101,
    });
  });

  it('สร้างโปรเจกต์ใหม่ (เกินโควตา Plan) -> Pass: ปฏิเสธการสร้างและแจ้งให้อัปเกรด Plan', () => {
    const extraProject = { name: 'Second Project Standard', detail: 'โปรเจกต์ที่สองของผู้ใช้ Standard' };

    apiService.postProject(extraProject, mockToken).subscribe({
      next: (res) => {
        expect(res.success).toBe(false);
        expect(res.message).toBe('Error Standard สร้างได้แค่ 1 Project');
      },
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.error?.message).toContain('Standard สร้างได้แค่ 1 Project');
      },
    });

    const req = httpMock.expectOne('http://localhost:3000/projects');
    expect(req.request.method).toBe('POST');

    req.flush(
      { success: false, message: 'Error Standard สร้างได้แค่ 1 Project กรุณาอัปเกรดเป็น Pro' },
      { status: 403, statusText: 'Forbidden' }
    );
  });

  it('แก้ไขชื่อและรายละเอียดโปรเจกต์ -> Pass: ฐานข้อมูลถูกเปลี่ยนแปลง', () => {
    const updateData = { name: 'Updated Ontology Name', detail: 'รายละเอียดที่ปรับปรุงใหม่' };

    apiService.putProjectDetail(101, updateData, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('บันทึกสำเร็จ');
    });

    const req = httpMock.expectOne('http://localhost:3000/projects/101');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);

    req.flush({
      success: true,
      message: 'บันทึกสำเร็จ',
    });
  });

  it('ลบโปรเจกต์โดยผู้สร้าง (Owner) -> Pass: โปรเจกต์ถูกลบออกจากฐานข้อมูลทั้งหมด', () => {
    apiService.deleteProject(101, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('ลบสำเร็จ');
    });

    const req = httpMock.expectOne('http://localhost:3000/projects/101');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush({
      success: true,
      message: 'ลบสำเร็จ',
    });
  });
});
