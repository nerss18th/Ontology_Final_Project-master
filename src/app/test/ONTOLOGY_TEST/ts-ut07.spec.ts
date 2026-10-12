import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT07: โมดูลสั่งส่งออกเอกสาร (Export PDF/Word) (For Test ID: UT07)', () => {
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;
  const mockToken = 'mock-token-pro-user';
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

  it('สั่ง Export ไฟล์ในรูปแบบ Word -> Pass: ไฟล์ Word ถูกสร้างและดาวน์โหลดสำเร็จ', () => {
    // จำลอง Blob ของไฟล์ Word (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
    const mockWordBlob = new Blob(['mock-word-binary-content'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    apiService.getExportUseCase(projectId, mockToken).subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    const req = httpMock.expectOne((r) => r.url.includes(`/export/project/${projectId}/use-case`));
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush(mockWordBlob);
  });

  it('สั่ง Export ไฟล์ในรูปแบบ PDF -> Pass: ไฟล์ PDF ถูกแปลงและดาวน์โหลดสำเร็จ', () => {
    // จำลอง Blob ของไฟล์ PDF (application/pdf)
    const mockPdfBlob = new Blob(['%PDF-1.4 mock pdf data'], {
      type: 'application/pdf',
    });

    apiService.getExportUseCasePdf(projectId, mockToken).subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/pdf');
    });

    const req = httpMock.expectOne(`http://localhost:3000/export-pdf/project/${projectId}/use-case`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    req.flush(mockPdfBlob);
  });
});
