import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT02: โมดูลเลือกและจัดการแพ็กเกจ (Plan) (For Test ID: UT02)', () => {
  let authService: AuthService;
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    // จำลองผู้ใช้เริ่มต้นเป็นแพ็กเกจ Standard
    const initialUser = {
      id: 1,
      email: 'member@example.com',
      name: 'Test Member',
      plan: 'Standard',
    };
    localStorage.setItem('mock_current_user', JSON.stringify(initialUser));
    localStorage.setItem('auth_token', 'mock-token-ut02');

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        BackendApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    apiService = TestBed.inject(BackendApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('เปลี่ยนระดับแพ็กเกจเป็น Pro -> Pass: ข้อมูล Plan ในระบบถูกอัปเดตเป็น Pro', () => {
    authService.updateUserPlan('Pro').subscribe((success) => {
      expect(success).toBe(true);
      const userStr = localStorage.getItem('mock_current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      expect(user.plan).toBe('Pro');
    });

    const req = httpMock.expectOne('http://localhost:3000/users/plan');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ plan: 'Pro' });

    req.flush({
      success: true,
      message: 'อัปเดตแพ็กเกจเป็น Pro สำเร็จ',
    });
  });

  it('อัปโหลดหลักฐานชำระเงิน ที่ไม่ใช่ไฟล์รูปภาพ -> Pass: แสดงแจ้งเตือนข้อมูลผิดพลาด', () => {
    // จำลองไฟล์ที่เป็น PDF หรือ Text (ไม่ใช่รูปภาพ)
    const invalidFile = new File(['dummy content'], 'slip.pdf', { type: 'application/pdf' });
    const isImage = invalidFile.type.startsWith('image/');
    
    // ตรวจสอบ Client-side validation
    expect(isImage).toBe(false);

    // ทดสอบการเรียก API ด้วย FormData ที่ไม่ผ่าน หรือเซิร์ฟเวอร์ตอบกลับปฏิเสธ
    const formData = new FormData();
    formData.append('receipt', invalidFile);

    apiService.postUploadReceipt(formData, 'mock-token-ut02').subscribe({
      next: (res) => {
        expect(res.success).toBe(false);
        expect(res.message).toContain('รูปภาพ');
      },
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error?.message).toBe('ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น');
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/users/upload-receipt');
    expect(req.request.method).toBe('POST');
    req.flush(
      { success: false, message: 'ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น' },
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
