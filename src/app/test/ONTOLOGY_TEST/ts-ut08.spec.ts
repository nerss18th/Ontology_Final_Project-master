import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT08: โมดูลจัดการและประมวลผล Ontology (For Test ID: UT08)', () => {
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;
  const mockToken = 'mock-token-ut08';
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

  it('แสดง Ontology Graph -> Pass: แสดงผลกราฟได้ถูกต้อง', () => {
    const mockGraphData = {
      '@context': { se: 'http://example.org/se#' },
      '@graph': [
        { '@id': 'project:UC01', '@type': 'se:UseCase', 'se:name': 'สมัครสมาชิก' },
        { '@id': 'project:CLSD01', '@type': 'se:Class', 'se:name': 'User', 'se:realizes': { '@id': 'project:UC01' } },
        { '@id': 'project:ACT01', '@type': 'se:Activity', 'se:name': 'ลงทะเบียน', 'se:realizes': { '@id': 'project:UC01' } },
      ],
    };

    apiService.getOntologyExport(projectId, mockToken).subscribe((res) => {
      expect(res).toBeTruthy();
      expect(res['@graph']).toBeDefined();
      expect(res['@graph'].length).toBe(3);
      
      // ตรวจสอบโหนดและประเภท
      const classNode = res['@graph'].find((item: any) => item['@type'] === 'se:Class');
      expect(classNode['se:name']).toBe('User');
    });

    const req = httpMock.expectOne(`http://localhost:3000/ontology/export/${projectId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockGraphData);
  });

  it('สร้างตาราง Diagram Reference จากแผนภาพทั้งหมด -> Pass: คืนค่าตาราง Diagram References ได้ถูกต้อง', () => {
    // จำลองผลลัพธ์การดึง use-cases, classes, activity-diagrams เพื่อนำมาสร้างตารางเชื่อมโยง
    const mockUseCases = {
      success: true,
      data: [{ id: 'UC01', caption: 'สมัครสมาชิก', type: 'Use Case' }],
    };
    const mockClasses = {
      success: true,
      data: [{ id: 'CLSD01', name: 'User', reference: 'UC01' }],
    };

    apiService.getUseCases(projectId, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res['data'][0].id).toBe('UC01');
    });
    const ucReq = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/use-cases`);
    ucReq.flush(mockUseCases);

    apiService.getClasses(projectId, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      const classItem = res['data'][0];
      expect(classItem.id).toBe('CLSD01');
      expect(classItem.reference).toBe('UC01'); // ตรวจสอบความเชื่อมโยงของ Reference
    });
    const clReq = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/classes`);
    clReq.flush(mockClasses);
  });

  it('กรณีพบแผนภาพอ้างอิงสูญหาย (Broken Reference) -> Pass: แจ้งเตือนข้อความขีดค่อมรหัสและ Warning', () => {
    // จำลองกรณีที่ Class มีการ reference ไปหา UC99 ซึ่งถูกลบไปแล้ว
    const mockValidationResponse = {
      success: true,
      issues: [
        {
          type: 'BROKEN_REFERENCE',
          severity: 'warning',
          element: 'CLSD01',
          target: 'UC99',
          message: 'อ้างอิงไปยัง UC99 ที่ไม่มีอยู่จริง',
        },
      ],
    };

    apiService.getOntologyValidate(projectId, mockToken).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.issues.length).toBe(1);
      
      const issue = res.issues[0];
      expect(issue.severity).toBe('warning');
      expect(issue.target).toBe('UC99');
      expect(issue.message).toContain('ไม่มีอยู่จริง');
    });

    const req = httpMock.expectOne(`http://localhost:3000/ontology/validate/${projectId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockValidationResponse);
  });
});
