import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT06: โมดูลจัดการข้อมูลและรูปภาพ Diagram (For Test ID: UT06)', () => {
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;
  const mockToken = 'mock-token-ut06';
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

  it('เพิ่ม Diagram และรูปภาพประกอบ -> Pass: ระบบสร้าง ID สำเร็จและอัปโหลดไฟล์รูป', () => {
    // 1. จำลองการอัปโหลดรูปภาพ
    const mockImageFile = new File(['mock-diagram-bytes'], 'usecase.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', mockImageFile);

    apiService.postUploadDiagramImage(formData, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.imagePath).toBe('/uploads/diagrams/usecase.png');
    });

    const uploadReq = httpMock.expectOne('http://localhost:3000/diagrams/upload-image');
    expect(uploadReq.request.method).toBe('POST');
    uploadReq.flush({
      success: true,
      imagePath: '/uploads/diagrams/usecase.png',
    });

    // 2. จำลองการบันทึกข้อมูลไดอะแกรมพร้อมรับ ID อัตโนมัติ (เช่น UC-01)
    const newDiagramData = {
      type: 'Use Case',
      caption: 'ระบบสมัครสมาชิก',
      description: 'ผู้ใช้งานสมัครสมาชิกเข้าสู่ระบบ',
      imagePath: '/uploads/diagrams/usecase.png',
    };

    apiService.saveUseCase(projectId, newDiagramData, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res['id']).toBe('UC01');
      expect(res.message).toBe('บันทึกสำเร็จ');
    });

    const saveReq = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/use-cases`);
    expect(saveReq.request.method).toBe('POST');
    expect(saveReq.request.body).toEqual(newDiagramData);
    saveReq.flush({
      success: true,
      id: 'UC01',
      message: 'บันทึกสำเร็จ',
    });
  });

  it('แก้ไขข้อมูลรายละเอียด Diagram -> Pass: ฐานข้อมูลถูกเปลี่ยนแปลง', () => {
    const updatedDiagramData = {
      id: 'UC01',
      type: 'Use Case',
      caption: 'ระบบสมัครสมาชิกและยืนยันตัวตน',
      description: 'ปรับปรุงรายละเอียดการสมัครสมาชิก',
    };

    apiService.saveUseCase(projectId, updatedDiagramData, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('บันทึกสำเร็จ');
    });

    const req = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/use-cases`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(updatedDiagramData);

    req.flush({
      success: true,
      message: 'บันทึกสำเร็จ',
    });
  });

  it('ลบ Diagram ออกจากระบบ -> Pass: ข้อมูลแผนภาพถูกลบจากฐานข้อมูล', () => {
    const diagramIdToDelete = 'UC01';

    apiService.deleteUseCase(projectId, diagramIdToDelete, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('ลบสำเร็จ');
    });

    const req = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/use-cases/${diagramIdToDelete}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush({
      success: true,
      message: 'ลบสำเร็จ',
    });
  });
});
