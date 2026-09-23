import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { BackendApiService } from './backend-api.service';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: { id?: number; email: string; name?: string; username?: string; phone?: string; plan?: string | null; pic?: string | null; description?: string | null; role?: string };
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly CURRENT_USER_KEY = 'mock_current_user';
  private readonly TOKEN_KEY = 'auth_token';

  private currentUserSubject = new BehaviorSubject<{
    id?: number;
    email: string;
    name?: string;
    username?: string;
    phone?: string;
    plan?: string | null;
    pic?: string | null;
    description?: string | null;
    role?: string;
  } | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: BackendApiService) {
    const savedUser = sessionStorage.getItem(this.CURRENT_USER_KEY);
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem(this.CURRENT_USER_KEY);
      }
    }
  }

  /**
   * สมัครสมาชิกใหม่
   */
  signUp(email: string, password: string, name: string, username?: string): Observable<AuthResponse> {
    return this.apiService.postSignUp({ email, password, name, username }).pipe(
      map((res) => ({
        success: res.success,
        message: res.message || '',
        user: res.user,
        token: res.token
      })),
      tap((res) => {
        if (res.success && res.user) {
          if (res.token) {
            sessionStorage.setItem(this.TOKEN_KEY, res.token);
          }
          sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
      catchError((err) => {
        const errorMsg = err.error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  /**
   * เข้าสู่ระบบ
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.apiService.postLogin({ email, password }).pipe(
      map((res) => ({
        success: res.success,
        message: res.message || '',
        user: res.user,
        token: res.token
      })),
      tap((res) => {
        if (res.success && res.user) {
          if (res.token) {
            sessionStorage.setItem(this.TOKEN_KEY, res.token);
          }
          sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
      catchError((err) => {
        const errorMsg = err.error?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        return of({ success: false, message: errorMsg });
      })
    );
  }

  /**
   * ออกจากระบบ
   */
  logout(): void {
    sessionStorage.removeItem(this.CURRENT_USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * ตรวจสอบว่าล็อกอินอยู่หรือไม่
   */
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * ดึง Token ปัจจุบัน
   */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * อัปเดตแพ็กเกจ (Standard / Pro)
   */
  updateUserPlan(planId: string): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return of(false);

    const planName = planId.toLowerCase() === 'pro' ? 'Pro' : 'Standard';
    const token = this.getToken();

    return this.apiService.putUserPlan(planName, token).pipe(
      map((res) => {
        if (res.success) {
          const updated = { ...currentUser, plan: planName };
          sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updated));
          this.currentUserSubject.next(updated);
          return true;
        }
        return false;
      }),
      catchError(() => {
        // Fallback local update if offline
        const updated = { ...currentUser, plan: planName };
        sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        return of(true);
      })
    );
  }

  /**
   * แก้ไขข้อมูลส่วนตัว (ชื่อ - นามสกุล, เบอร์โทร, อีเมล, รายละเอียด)
   */
  updateProfile(name: string, phone: string, email?: string, description?: string): Observable<{ success: boolean; message: string; user?: any }> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return of({ success: false, message: 'ไม่พบผู้ใช้งาน' });

    const token = this.getToken();
    const payload = {
      id: currentUser.id,
      email: email || currentUser.email,
      name,
      phone,
      description
    };

    return this.apiService.putUserProfile(payload, token).pipe(
      map((res) => ({
        success: res.success,
        message: res.message || 'อัปเดตข้อมูลเรียบร้อยแล้ว',
        user: res.user
      })),
      tap((res) => {
        if (res.success && res.user) {
          const updated = { 
            ...currentUser, 
            email: res.user.email || currentUser.email,
            name: res.user.name, 
            phone: res.user.phone,
            description: res.user.description
          };
          sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updated));
          this.currentUserSubject.next(updated);
        }
      }),
      catchError(() => {
        // Fallback local update if offline
        const updated = { ...currentUser, email: email || currentUser.email, name, phone, description };
        sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        return of({ success: true, message: 'อัปเดตข้อมูลเรียบร้อยแล้ว (ออฟไลน์)', user: updated });
      })
    );
  }

  /**
   * อัปโหลดรูปโปรไฟล์
   */
  uploadProfilePic(file: File): Observable<{ success: boolean; message: string; imagePath?: string }> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return of({ success: false, message: 'ไม่พบผู้ใช้งาน' });

    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', file);

    return this.apiService.postUploadProfilePic(formData, token).pipe(
      map((res) => ({
        success: res.success,
        message: res.message || 'อัปโหลดรูปภาพสำเร็จ',
        imagePath: res.imagePath
      })),
      tap((res) => {
        if (res.success && res.imagePath) {
          const updated = { ...currentUser, pic: res.imagePath };
          sessionStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updated));
          this.currentUserSubject.next(updated);
        }
      }),
      catchError((err) => {
        const errorMsg = err.error?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ';
        return of({ success: false, message: errorMsg });
      })
    );
  }
}
