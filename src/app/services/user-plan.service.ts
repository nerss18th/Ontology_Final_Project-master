import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserPlanService {
  constructor(private authService: AuthService) {}

  /**
   * Check if current user has 'Pro' package access
   */
  isProUser(user?: any): boolean {
    const activeUser = user || this.getCurrentUserFromSession();
    if (!activeUser || !activeUser.plan) return true;
    return activeUser.plan.toLowerCase() === 'pro';
  }

  /**
   * Check if current user has 'Standard' package access
   */
  isStandardUser(user?: any): boolean {
    const activeUser = user || this.getCurrentUserFromSession();
    if (!activeUser || !activeUser.plan) return false;
    return activeUser.plan.toLowerCase() === 'standard';
  }

  /**
   * Check if user can access team collaboration features
   */
  canAccessTeamMembers(user?: any): boolean {
    return this.isProUser(user);
  }

  /**
   * Observable stream of Pro plan status
   */
  get isProUser$(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map((user) => this.isProUser(user)),
    );
  }

  private getCurrentUserFromSession(): any {
    try {
      const savedUser = localStorage.getItem('mock_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  }
}
