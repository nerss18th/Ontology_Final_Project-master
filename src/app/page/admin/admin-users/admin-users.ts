import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendApiService } from '../../../services/backend-api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>จัดการผู้ใช้งาน</h2>
        <div class="input-group" style="max-width: 300px;">
          <input type="text" class="form-control" placeholder="ค้นหา Username..." [(ngModel)]="searchQuery">
          <span class="input-group-text"><span class="material-symbols-outlined fs-6">search</span></span>
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Role</th>
                  <th class="text-end pe-4">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers">
                  <td class="ps-4">#{{ user.id }}</td>
                  <td>{{ user.username || user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td><span class="badge" [ngClass]="user.plan === 'Admin' ? 'text-bg-dark' : (user.plan === 'Pro' ? 'text-bg-warning' : 'text-bg-secondary')">{{ user.plan }}</span></td>
                  <td>
                    <span class="badge" [ngClass]="user.role === 'admin' ? 'text-bg-primary' : 'text-bg-light text-dark'">{{ user.role | uppercase }}</span>
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-info me-2" (click)="onViewProjects(user.id)">
                      ดูโปรเจกต์
                    </button>

                    <button class="btn btn-sm btn-outline-danger" (click)="deleteUser(user)" *ngIf="user.id !== currentUserId">
                      ลบ
                    </button>
                    <span *ngIf="user.id === currentUserId" class="text-muted small">บัญชีของคุณ</span>
                  </td>
                </tr>
                <tr *ngIf="filteredUsers.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">ไม่พบข้อมูลผู้ใช้งาน</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminUsers implements OnInit {
  @Output() viewProjects = new EventEmitter<string | number>();

  users: any[] = [];
  searchQuery = '';
  currentUserId: number | null = null;
  errorMessage = '';
  successMessage = '';

  get filteredUsers() {
    if (!this.searchQuery) return this.users;
    return this.users.filter(u => {
      const username = (u.username || '').toLowerCase();
      const search = this.searchQuery.toLowerCase();
      return username.includes(search);
    });
  }

  constructor(
    private api: BackendApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.currentUserId = u.id || null;
      }
    });
    this.loadUsers();
  }

  onViewProjects(id: string | number) {
    this.viewProjects.emit(id);
  }

  loadUsers() {
    this.api.getAdminUsers(this.auth.getToken()).subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res['users'];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'ไม่สามารถดึงข้อมูลได้';
        this.cdr.detectChanges();
      }
    });
  }

  toggleRole(user: any) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if(confirm(`ต้องการเปลี่ยนสิทธิ์ของ ${user.email} เป็น ${newRole} หรือไม่?`)) {
      this.api.putAdminUserRole(user.id, newRole, this.auth.getToken()).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = res.message;
            this.loadUsers();
          } else {
            this.errorMessage = res.message;
          }
          setTimeout(() => this.successMessage = '', 3000);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteUser(user: any) {
    if(confirm(`ยืนยันการลบบัญชี ${user.email} อย่างถาวร?`)) {
      this.api.deleteAdminUser(user.id, this.auth.getToken()).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = res.message;
            this.loadUsers();
          } else {
            this.errorMessage = res.message;
          }
          setTimeout(() => this.successMessage = '', 3000);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
