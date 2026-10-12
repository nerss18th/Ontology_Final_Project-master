import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';

describe('TS-UT01: โมดูลลงทะเบียนและเข้าสู่ระบบ (For Test ID: UT01)', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
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

  it('สมัครสมาชิกด้วยข้อมูลที่ถูกต้อง -> Pass: ข้อมูลบันทึกลงฐานข้อมูล และสร้างบัญชีสำเร็จ', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Natchanan Test',
      username: 'natchanan',
      plan: 'Standard',
    };

    authService.signUp('test@example.com', 'password123', 'Natchanan Test', 'natchanan').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.user?.email).toBe('test@example.com');
      expect(authService.getToken()).toBe('mock-token-123');
    });

    const req = httpMock.expectOne('http://localhost:3000/users/signup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'test@example.com',
      password: 'password123',
      name: 'Natchanan Test',
      username: 'natchanan',
    });

    req.flush({
      success: true,
      message: 'สร้างบัญชีสำเร็จ',
      user: mockUser,
      token: 'mock-token-123',
    });
  });

  it('สมัครสมาชิกด้วยอีเมลที่ซ้ำในระบบ -> Pass: แสดงข้อความแจ้งเตือน "อีเมลถูกใช้งานแล้ว"', () => {
    authService.signUp('duplicate@example.com', 'password123', 'Dup User', 'dupuser').subscribe((res) => {
      expect(res.success).toBe(false);
      expect(res.message).toBe('อีเมลถูกใช้งานแล้ว');
    });

    const req = httpMock.expectOne('http://localhost:3000/users/signup');
    expect(req.request.method).toBe('POST');

    req.flush(
      { success: false, message: 'อีเมลถูกใช้งานแล้ว' },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  it('เข้าสู่ระบบด้วยอีเมลและรหัสผ่านถูกต้อง -> Pass: เข้าสู่ระบบสำเร็จและสร้าง Session/Token', () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      name: 'Logged User',
      plan: 'Pro',
    };

    authService.login('user@example.com', 'correctpass').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.token).toBe('jwt-auth-token-xyz');
      expect(authService.getToken()).toBe('jwt-auth-token-xyz');
      expect(authService.isLoggedIn()).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:3000/users/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'user@example.com',
      password: 'correctpass',
    });

    req.flush({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: mockUser,
      token: 'jwt-auth-token-xyz',
    });
  });

  it('เข้าสู่ระบบด้วยรหัสผ่านผิดพลาด -> Pass: แสดงแจ้งเตือนรหัสผ่านไม่ถูกต้อง', () => {
    authService.login('user@example.com', 'wrongpassword').subscribe((res) => {
      expect(res.success).toBe(false);
      expect(res.message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      expect(authService.getToken()).toBeNull();
      expect(authService.isLoggedIn()).toBe(false);
    });

    const req = httpMock.expectOne('http://localhost:3000/users/login');
    expect(req.request.method).toBe('POST');

    req.flush(
      { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });
});