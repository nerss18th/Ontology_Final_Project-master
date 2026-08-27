import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: { email: string; name?: string; phone?: string; plan?: string | null };
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USERS_KEY = 'mock_users';
  private readonly CURRENT_USER_KEY = 'mock_current_user';

  /* ข้อมูลทดสอบ */
  private readonly DEFAULT_ACCOUNTS = [
    {
      email: 'standard@gmail.com',
      password: 'admin034161',
      name: 'Standard User',
      phone: '081-234-5678',
      plan: 'Standard',
    },
    {
      email: 'pro@gmail.com',
      password: 'admin034161',
      name: 'Pro User',
      phone: '089-876-5432',
      plan: 'Pro',
    },
  ];

  private currentUserSubject = new BehaviorSubject<{
    email: string;
    name?: string;
    phone?: string;
    plan?: string | null;
  } | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load current user session if exists
    const savedUser = localStorage.getItem(this.CURRENT_USER_KEY);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Look up registered user to populate name/phone if missing
        const users = this.getUsersFromStorage();
        const dbUser = users.find((u) => u.email.toLowerCase() === parsed.email.toLowerCase());
        if (dbUser) {
          parsed.name = dbUser.name || parsed.name || parsed.email.split('@')[0];
          parsed.phone = dbUser.phone || parsed.phone || '-';
        } else {
          parsed.name = parsed.name || parsed.email.split('@')[0];
          parsed.phone = parsed.phone || '-';
        }
        this.currentUserSubject.next(parsed);
      } catch (e) {
        localStorage.removeItem(this.CURRENT_USER_KEY);
      }
    }

    // mock up users
    const users = this.getUsersFromStorage();
    let updated = false;
    this.DEFAULT_ACCOUNTS.forEach((account) => {
      const existing = users.find((u) => u.email.toLowerCase() === account.email.toLowerCase());
      if (!existing) {
        users.push(account);
        updated = true;
      } else {
        let entryUpdated = false;
        if (!existing.name) {
          existing.name = account.name;
          entryUpdated = true;
        }
        if (!existing.phone) {
          existing.phone = account.phone;
          entryUpdated = true;
        }
        if (entryUpdated) {
          updated = true;
        }
      }
    });

    if (updated) {
      this.saveUsersToStorage(users);
    }
  }

  /**
   * Helper to retrieve all registered users from localStorage
   */
  private getUsersFromStorage(): any[] {
    const data = localStorage.getItem(this.USERS_KEY);
    if (!data) {
      this.saveUsersToStorage(this.DEFAULT_ACCOUNTS);
      return [...this.DEFAULT_ACCOUNTS];
    }
    try {
      const users = JSON.parse(data);
      if (!Array.isArray(users) || users.length === 0) {
        this.saveUsersToStorage(this.DEFAULT_ACCOUNTS);
        return [...this.DEFAULT_ACCOUNTS];
      }
      return users;
    } catch (e) {
      this.saveUsersToStorage(this.DEFAULT_ACCOUNTS);
      return [...this.DEFAULT_ACCOUNTS];
    }
  }

  /**
   * Helper to write registered users back to localStorage
   */
  private saveUsersToStorage(users: any[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  /**
   * Mock login endpoint
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const users = this.getUsersFromStorage();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return of({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      }).pipe(delay(100));
    }

    if (user.password !== password) {
      return of({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      }).pipe(delay(100));
    }

    const loggedInUser = {
      email: user.email,
      name: user.name || user.email.split('@')[0],
      phone: user.phone || '-',
      plan: user.plan || null,
    };
    return of({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: loggedInUser,
      token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
    }).pipe(
      delay(100),
      tap((res) => {
        if (res.success && res.user) {
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
    );
  }

  /**
   * Mock signup endpoint
   */
  signUp(email: string, password: string, name: string): Observable<AuthResponse> {
    const users = this.getUsersFromStorage();
    const emailExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      return of({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ',
      }).pipe(delay(100));
    }

    const newUser = { email, password, name, phone: '-', plan: null };
    users.push(newUser);
    this.saveUsersToStorage(users);

    const loggedInUser = { email, name, phone: '-', plan: null };
    return of({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user: loggedInUser,
      token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
    }).pipe(
      delay(100),
      tap((res) => {
        if (res.success && res.user) {
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
    );
  }

  /**
   * Logout session
   */
  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Update the plan of the currently logged-in user
   */
  updateUserPlan(planId: string): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return of(false);
    }

    // Map planId to "Standard" or "Pro"
    let planName = 'Standard';
    if (planId.toLowerCase() === 'pro') {
      planName = 'Pro';
    }

    // Update in users storage
    const users = this.getUsersFromStorage();
    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === currentUser.email.toLowerCase(),
    );
    if (userIndex !== -1) {
      users[userIndex].plan = planName;
      this.saveUsersToStorage(users);
    }

    // Update in current user session
    const updatedUser = { ...currentUser, plan: planName };
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);

    return of(true).pipe(delay(100));
  }
}
