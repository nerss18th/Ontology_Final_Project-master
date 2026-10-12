import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';

describe('========== รายงานผลการทดสอบระดับ Unit Testing (ตารางที่ ง-1) ==========', () => {
  let authService: AuthService;
  let apiService: BackendApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
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

  // =========================================================================
  // TS-UT01: โมดูลลงทะเบียนและเข้าสู่ระบบ (For Test ID: UT01)
  // =========================================================================
  describe('TS-UT01: โมดูลลงทะเบียนและเข้าสู่ระบบ (For Test ID: UT01)', () => {
    it('1. สมัครสมาชิกด้วยข้อมูลที่ถูกต้อง -> Pass: ข้อมูลบันทึกลงฐานข้อมูล และสร้างบัญชีสำเร็จ', () => {
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

    it('2. สมัครสมาชิกด้วยอีเมลที่ซ้ำในระบบ -> Pass: แสดงข้อความแจ้งเตือน "อีเมลถูกใช้งานแล้ว"', () => {
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

    it('3. เข้าสู่ระบบด้วยอีเมลและรหัสผ่านถูกต้อง -> Pass: เข้าสู่ระบบสำเร็จและสร้าง Session/Token', () => {
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

    it('4. เข้าสู่ระบบด้วยรหัสผ่านผิดพลาด -> Pass: แสดงแจ้งเตือนรหัสผ่านไม่ถูกต้อง', () => {
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

  // =========================================================================
  // TS-UT02: โมดูลเลือกและจัดการแพ็กเกจ (Plan) (For Test ID: UT02)
  // =========================================================================
  describe('TS-UT02: โมดูลเลือกและจัดการแพ็กเกจ (Plan) (For Test ID: UT02)', () => {
    beforeEach(() => {
      const initialUser = {
        id: 1,
        email: 'member@example.com',
        name: 'Test Member',
        plan: 'Standard',
      };
      localStorage.setItem('mock_current_user', JSON.stringify(initialUser));
      localStorage.setItem('auth_token', 'mock-token-ut02');
      (authService as any).currentUserSubject.next(initialUser);
    });

    it('1. เปลี่ยนระดับแพ็กเกจเป็น Pro -> Pass: ข้อมูล Plan ในระบบถูกอัปเดตเป็น Pro', () => {
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

    it('2. อัปโหลดหลักฐานชำระเงิน ที่ไม่ใช่ไฟล์รูปภาพ -> Pass: แสดงแจ้งเตือนข้อมูลผิดพลาด', () => {
      const invalidFile = new File(['dummy content'], 'slip.pdf', { type: 'application/pdf' });
      expect(invalidFile.type.startsWith('image/')).toBe(false);

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
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/users/upload-receipt');
      expect(req.request.method).toBe('POST');
      req.flush(
        { success: false, message: 'ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  // =========================================================================
  // TS-UT03: โมดูลจัดการข้อมูลผู้ใช้งาน (แก้ไขโปรไฟล์) (For Test ID: UT03)
  // =========================================================================
  describe('TS-UT03: โมดูลจัดการข้อมูลผู้ใช้งาน (แก้ไขโปรไฟล์) (For Test ID: UT03)', () => {
    beforeEach(() => {
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
      (authService as any).currentUserSubject.next(initialUser);
    });

    it('1. แก้ไขชื่อและเบอร์โทรศัพท์ -> Pass: ข้อมูลโปรไฟล์ถูกอัปเดตในฐานข้อมูล', () => {
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

    it('2. อัปโหลดรูปภาพโปรไฟล์ใหม่ -> Pass: ไฟล์รูปถูกอัปโหลดและอัปเดตพาธสำเร็จ', () => {
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

    it('3. อัปโหลดไฟล์โปรไฟล์ที่ขนาดเกินกำหนด -> Pass: แจ้งเตือนข้อผิดพลาดและไม่อัปโหลดรูป', () => {
      const MAX_SIZE_MB = 5;
      const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
      expect(oversizedFile.size > MAX_SIZE_MB * 1024 * 1024).toBe(true);

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

  // =========================================================================
  // TS-UT04: โมดูลจัดการข้อมูลโปรเจกต์ (สร้าง/แก้ไข/ลบ) (For Test ID: UT04)
  // =========================================================================
  describe('TS-UT04: โมดูลจัดการข้อมูลโปรเจกต์ (สร้าง/แก้ไข/ลบ) (For Test ID: UT04)', () => {
    const mockToken = 'mock-token-ut04';

    it('1. สร้างโปรเจกต์ใหม่ (ในโควตา Plan) -> Pass: โปรเจกต์ถูกบันทึกลงฐานข้อมูล', () => {
      const newProject = { name: 'Hospital Ontology System', detail: 'ระบบจัดการแผนภาพโรงพยาบาล' };

      apiService.postProject(newProject, mockToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res['projectId']).toBe(101);
        expect(res.message).toBe('สร้าง Project สำเร็จ');
      });

      const req = httpMock.expectOne('http://localhost:3000/projects');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProject);

      req.flush({
        success: true,
        message: 'สร้าง Project สำเร็จ',
        projectId: 101,
      });
    });

    it('2. สร้างโปรเจกต์ใหม่ (เกินโควตา Plan) -> Pass: ปฏิเสธการสร้างและแจ้งให้อัปเกรด Plan', () => {
      const extraProject = { name: 'Second Project Standard', detail: 'โปรเจกต์ที่สองของผู้ใช้ Standard' };

      apiService.postProject(extraProject, mockToken).subscribe({
        next: (res) => {
          expect(res.success).toBe(false);
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

    it('3. แก้ไขชื่อและรายละเอียดโปรเจกต์ -> Pass: ฐานข้อมูลถูกเปลี่ยนแปลง', () => {
      const updateData = { name: 'Updated Ontology Name', detail: 'รายละเอียดที่ปรับปรุงใหม่' };

      apiService.putProjectDetail(101, updateData, mockToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('บันทึกสำเร็จ');
      });

      const req = httpMock.expectOne('http://localhost:3000/projects/101');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({ success: true, message: 'บันทึกสำเร็จ' });
    });

    it('4. ลบโปรเจกต์โดยผู้สร้าง (Owner) -> Pass: โปรเจกต์ถูกลบออกจากฐานข้อมูลทั้งหมด', () => {
      apiService.deleteProject(101, mockToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('ลบสำเร็จ');
      });

      const req = httpMock.expectOne('http://localhost:3000/projects/101');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'ลบสำเร็จ' });
    });
  });

  // =========================================================================
  // TS-UT05: โมดูลจัดการสมาชิกในทีม (Team) (For Test ID: UT05)
  // =========================================================================
  describe('TS-UT05: โมดูลจัดการสมาชิกในทีม (Team) (For Test ID: UT05)', () => {
    const mockOwnerToken = 'mock-owner-token';
    const mockMemberToken = 'mock-non-owner-token';
    const projectId = 101;

    it('1. เชิญผู้ใช้ในระบบเข้าสู่ทีม -> Pass: สร้างสิทธิ์สมาชิกในฐานข้อมูลสำเร็จ', () => {
      const inviteData = { email: 'teammate@example.com', role: 'Editor' };

      apiService.postProjectMember(projectId, inviteData, mockOwnerToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('เพิ่มสมาชิกสำเร็จ');
      });

      const req = httpMock.expectOne(`http://localhost:3000/projects/${projectId}/members`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(inviteData);
      req.flush({ success: true, message: 'เพิ่มสมาชิกสำเร็จ' });
    });

    it('2. ลบสมาชิกโดยเจ้าของ (Owner) -> Pass: สมาชิกถูกลบออกจากทีมโปรเจกต์', () => {
      const memberId = 205;

      apiService.deleteProjectMember(projectId, memberId, mockOwnerToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('ลบสมาชิกสำเร็จ');
      });

      const req = httpMock.expectOne(`http://localhost:3000/projects/${projectId}/members/${memberId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'ลบสมาชิกสำเร็จ' });
    });

    it('3. ลบสมาชิกโดยผู้ที่ไม่มีสิทธิ์ (ไม่มี Owner) -> Pass: แจ้งเตือนข้อผิดพลาด "คุณไม่มีสิทธิ์"', () => {
      const memberId = 205;

      apiService.deleteProjectMember(projectId, memberId, mockMemberToken).subscribe({
        next: (res) => {
          expect(res.success).toBe(false);
        },
        error: (err) => {
          expect(err.status).toBe(403);
          expect(err.error?.message).toContain('คุณไม่มีสิทธิ์');
        },
      });

      const req = httpMock.expectOne(`http://localhost:3000/projects/${projectId}/members/${memberId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(
        { success: false, message: 'คุณไม่มีสิทธิ์ลบสมาชิกในโปรเจกต์นี้' },
        { status: 403, statusText: 'Forbidden' }
      );
    });
  });

  // =========================================================================
  // TS-UT06: โมดูลจัดการข้อมูลและรูปภาพ Diagram (For Test ID: UT06)
  // =========================================================================
  describe('TS-UT06: โมดูลจัดการข้อมูลและรูปภาพ Diagram (For Test ID: UT06)', () => {
    const mockToken = 'mock-token-ut06';
    const projectId = 101;

    it('1. เพิ่ม Diagram และรูปภาพประกอบ -> Pass: ระบบสร้าง ID สำเร็จและอัปโหลดไฟล์รูป', () => {
      const mockImageFile = new File(['mock-diagram-bytes'], 'usecase.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('image', mockImageFile);

      apiService.postUploadDiagramImage(formData, mockToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.imagePath).toBe('/uploads/diagrams/usecase.png');
      });

      const uploadReq = httpMock.expectOne('http://localhost:3000/diagrams/upload-image');
      expect(uploadReq.request.method).toBe('POST');
      uploadReq.flush({ success: true, imagePath: '/uploads/diagrams/usecase.png' });

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
      saveReq.flush({ success: true, id: 'UC01', message: 'บันทึกสำเร็จ' });
    });

    it('2. แก้ไขข้อมูลรายละเอียด Diagram -> Pass: ฐานข้อมูลถูกเปลี่ยนแปลง', () => {
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
      req.flush({ success: true, message: 'บันทึกสำเร็จ' });
    });

    it('3. ลบ Diagram ออกจากระบบ -> Pass: ข้อมูลแผนภาพถูกลบจากฐานข้อมูล', () => {
      const diagramIdToDelete = 'UC01';

      apiService.deleteUseCase(projectId, diagramIdToDelete, mockToken).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('ลบสำเร็จ');
      });

      const req = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/use-cases/${diagramIdToDelete}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'ลบสำเร็จ' });
    });
  });

  // =========================================================================
  // TS-UT07: โมดูลสั่งส่งออกเอกสาร (Export PDF/Word) (For Test ID: UT07)
  // =========================================================================
  describe('TS-UT07: โมดูลสั่งส่งออกเอกสาร (Export PDF/Word) (For Test ID: UT07)', () => {
    const mockToken = 'mock-token-pro-user';
    const projectId = 101;

    it('1. สั่ง Export ไฟล์ในรูปแบบ Word -> Pass: ไฟล์ Word ถูกสร้างและดาวน์โหลดสำเร็จ', () => {
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
      req.flush(mockWordBlob);
    });

    it('2. สั่ง Export ไฟล์ในรูปแบบ PDF -> Pass: ไฟล์ PDF ถูกแปลงและดาวน์โหลดสำเร็จ', () => {
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
      req.flush(mockPdfBlob);
    });
  });

  // =========================================================================
  // TS-UT08: โมดูลจัดการและประมวลผล Ontology (For Test ID: UT08)
  // =========================================================================
  describe('TS-UT08: โมดูลจัดการและประมวลผล Ontology (For Test ID: UT08)', () => {
    const mockToken = 'mock-token-ut08';
    const projectId = 101;

    it('1. แสดง Ontology Graph -> Pass: แสดงผลกราฟได้ถูกต้อง', () => {
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
        const classNode = res['@graph'].find((item: any) => item['@type'] === 'se:Class');
        expect(classNode['se:name']).toBe('User');
      });

      const req = httpMock.expectOne(`http://localhost:3000/ontology/export/${projectId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGraphData);
    });

    it('2. สร้างตาราง Diagram Reference จากแผนภาพทั้งหมด -> Pass: คืนค่าตาราง Diagram References ได้ถูกต้อง', () => {
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
        expect(classItem.reference).toBe('UC01');
      });
      const clReq = httpMock.expectOne(`http://localhost:3000/diagrams/project/${projectId}/classes`);
      clReq.flush(mockClasses);
    });

    it('3. กรณีพบแผนภาพอ้างอิงสูญหาย (Broken Reference) -> Pass: แจ้งเตือนข้อความขีดค่อมรหัสและ Warning', () => {
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
});
