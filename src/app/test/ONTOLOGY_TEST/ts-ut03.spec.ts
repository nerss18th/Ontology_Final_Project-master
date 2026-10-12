import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT03: โมดูลจัดการข้อมูลผู้ใช้งาน (แก้ไขโปรไฟล์) (For Test ID: UT03)', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    const initialUser = {
      id: 1,
      email: 'user@example.com',
      name: 'Old Name',
      phone: '0812345678',
      description: 'Old bio',
      pic: '/uploads/old.jpg',
    };
    localStorage.setItem('mock_current_user', JSON.stringify(initialUser));
    localStorage.setItem('auth_token', 'mock-token-ut03');

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        BackendApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('แก้ไขชื่อและเบอร์โทรศัพท์ -> Pass: ข้อมูลโปรไฟล์ถูกอัปเดตในฐานข้อมูล', () => {
    authService.updateProfile('New Name', '0898765432', 'user@example.com', 'New bio').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('อัปเดตข้อมูลเรียบร้อยแล้ว');
      
      const userStr = localStorage.getItem('mock_current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      expect(user.name).toBe('New Name');
      expect(user.phone).toBe('0898765432');
    });

    const req = httpMock.expectOne('http://localhost:3000/users/profile');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      id: 1,
      email: 'user@example.com',
      name: 'New Name',
      phone: '0898765432',
      description: 'New bio',
    });

    req.flush({
      success: true,
      message: 'อัปเดตข้อมูลเรียบร้อยแล้ว',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'New Name',
        phone: '0898765432',
        description: 'New bio',
      },
    });
  });

  it('อัปโหลดรูปภาพโปรไฟล์ใหม่ -> Pass: ไฟล์รูปถูกอัปโหลดและอัปเดตพาธสำเร็จ', () => {
    const validFile = new File(['mock-image-data'], 'avatar.png', { type: 'image/png' });

    authService.uploadProfilePic(validFile).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.imagePath).toBe('/uploads/avatar.png');
      
      const userStr = localStorage.getItem('mock_current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      expect(user.pic).toBe('/uploads/avatar.png');
    });

    const req = httpMock.expectOne('http://localhost:3000/users/upload-profile-pic');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'อัปโหลดรูปภาพสำเร็จ',
      imagePath: '/uploads/avatar.png',
    });
  });

  it('อัปโหลดไฟล์โปรไฟล์ที่ขนาดเกินกำหนด -> Pass: แจ้งเตือนข้อผิดพลาดและไม่อัปโหลดรูป', () => {
    const MAX_SIZE_MB = 5;
    // สร้างไฟล์จำลองขนาด 6MB (เกินโควตา 5MB)
    const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    const isOverSize = oversizedFile.size > MAX_SIZE_MB * 1024 * 1024;

    expect(isOverSize).toBe(true);

    // เซิร์ฟเวอร์ตอบปฏิเสธ Payload Too Large (413) หรือแสดงข้อความ Error
    authService.uploadProfilePic(oversizedFile).subscribe((res) => {
      expect(res.success).toBe(false);
      expect(res.message).toBe('ขนาดไฟล์รูปภาพเกินกำหนด (สูงสุด 5MB)');
    });

    const req = httpMock.expectOne('http://localhost:3000/users/upload-profile-pic');
    expect(req.request.method).toBe('POST');
    req.flush(
      { success: false, message: 'ขนาดไฟล์รูปภาพเกินกำหนด (สูงสุด 5MB)' },
      { status: 413, statusText: 'Payload Too Large' }
    );
  });
});
