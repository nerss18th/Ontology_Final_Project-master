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
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 class="fw-bold text-dark fs-4 mb-0 d-flex align-items-center gap-2">
          <span class="material-symbols-outlined text-primary">group</span>
          จัดการผู้ใช้งาน
        </h2>
        <div class="input-group" style="max-width: 280px;">
          <input type="text" class="form-control rounded-3 border-0 shadow-sm" placeholder="ค้นหา Username..." [(ngModel)]="searchQuery" style="font-size: 14px;">
          <span class="input-group-text bg-white border-0 shadow-sm rounded-3 ms-1">
            <span class="material-symbols-outlined fs-6 text-secondary">search</span>
          </span>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-3" style="font-size: 14px;">
        <span class="material-symbols-outlined" style="font-size: 18px;">error</span>
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-3" style="font-size: 14px;">
        <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
        {{ successMessage }}
      </div>

      <!-- Table -->
      <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead style="background: #f8f9ff;">
                <tr>
                  <th class="ps-4 py-3 text-secondary fw-semibold" style="font-size: 12px; letter-spacing: 0.05em;">ID</th>
                  <th class="py-3 text-secondary fw-semibold" style="font-size: 12px; letter-spacing: 0.05em;">USERNAME</th>
                  <th class="py-3 text-secondary fw-semibold" style="font-size: 12px; letter-spacing: 0.05em;">EMAIL</th>
                  <th class="py-3 text-secondary fw-semibold" style="font-size: 12px; letter-spacing: 0.05em;">PLAN</th>
                  <th class="py-3 text-secondary fw-semibold" style="font-size: 12px; letter-spacing: 0.05em;">ROLE</th>
                  <th class="text-end pe-4 py-3 text-secondary fw-semibold" style="font-size: 12px; letter-spacing: 0.05em;">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers" class="border-top">
                  <td class="ps-4 py-3">
                    <span class="text-secondary fw-medium" style="font-size: 13px;">#{{ user.id }}</span>
                  </td>
                  <td class="py-3">
                    <span class="fw-semibold text-dark" style="font-size: 14px;">{{ user.username || user.name }}</span>
                  </td>
                  <td class="py-3">
                    <span class="text-secondary" style="font-size: 13px;">{{ user.email }}</span>
                  </td>
                  <td class="py-3">
                    <span class="badge rounded-pill px-3 py-1 fw-semibold"
                      [ngClass]="{
                        'text-bg-warning': user.plan === 'Pro',
                        'text-bg-secondary': user.plan === 'Standard',
                        'text-bg-dark': user.plan === 'Admin'
                      }"
                      style="font-size: 11px;">
                      {{ user.plan }}
                    </span>
                  </td>
                  <td class="py-3">
                    <span class="badge rounded-pill px-3 py-1 fw-semibold"
                      [ngClass]="user.role === 'admin' ? 'text-bg-primary' : 'bg-light text-dark border'"
                      style="font-size: 11px;">
                      {{ user.role | uppercase }}
                    </span>
                  </td>
                  <td class="text-end pe-4 py-3">
                    <div class="d-flex align-items-center justify-content-end gap-2">
                      <!-- ปุ่มดูโปรเจกต์ -->
                      <button class="btn btn-sm btn-outline-info rounded-3 d-inline-flex align-items-center gap-1 fw-semibold"
                        style="font-size: 12px;"
                        (click)="onViewProjects(user.id)">
                        <span class="material-symbols-outlined" style="font-size: 15px;">folder_open</span>
                        Projects
                      </button>

                      <!-- ปุ่ม Edit Plan -->
                      <button class="btn btn-sm btn-outline-primary rounded-3 d-inline-flex align-items-center gap-1 fw-semibold"
                        style="font-size: 12px;"
                        (click)="openEditPlanModal(user)"
                        *ngIf="user.id !== currentUserId">
                        <span class="material-symbols-outlined" style="font-size: 15px;">workspace_premium</span>
                        Plan
                      </button>

                      <!-- ปุ่มลบ -->
                      <button class="btn btn-sm btn-outline-danger rounded-3 d-inline-flex align-items-center gap-1 fw-semibold"
                        style="font-size: 12px;"
                        (click)="deleteUser(user)"
                        *ngIf="user.id !== currentUserId">
                        <span class="material-symbols-outlined" style="font-size: 15px;">delete</span>
                        ลบ
                      </button>

                      <span *ngIf="user.id === currentUserId" class="text-muted small">บัญชีของคุณ</span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredUsers.length === 0">
                  <td colspan="6" class="text-center py-5 text-muted">
                    <span class="material-symbols-outlined d-block mb-2" style="font-size: 36px; opacity: 0.3;">manage_accounts</span>
                    ไม่พบข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop สำหรับ Edit Plan Modal -->
    <div *ngIf="isEditPlanModalOpen" class="modal-backdrop fade show" style="z-index: 1040;" (click)="closeEditPlanModal()"></div>

    <!-- Modal เปลี่ยน Plan -->
    <div *ngIf="isEditPlanModalOpen" class="modal d-block" tabindex="-1" role="dialog"
      aria-labelledby="editPlanModalTitle" style="z-index: 1050;">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
          <!-- Header -->
          <div class="modal-header px-4 py-3 border-bottom"
            style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <h5 class="modal-title fw-bold d-flex align-items-center gap-2 mb-0 text-white" id="editPlanModalTitle">
              <span class="material-symbols-outlined" style="font-size: 24px;">workspace_premium</span>
              เปลี่ยน Plan ผู้ใช้งาน
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeEditPlanModal()"></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4" *ngIf="editPlanUser">
            <!-- ข้อมูล user -->
            <div class="d-flex align-items-center gap-3 p-3 rounded-3 mb-4"
              style="background: #f8f9ff; border: 1px solid #e0e7ff;">
              <div class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                style="width: 44px; height: 44px;">
                <span class="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <div class="fw-semibold text-dark" style="font-size: 14px;">{{ editPlanUser.username || editPlanUser.name }}</div>
                <div class="text-secondary" style="font-size: 12px;">{{ editPlanUser.email }}</div>
              </div>
              <span class="badge rounded-pill ms-auto px-3 py-1 fw-semibold"
                [ngClass]="{
                  'text-bg-warning': editPlanUser.plan === 'Pro',
                  'text-bg-secondary': editPlanUser.plan === 'Standard'
                }"
                style="font-size: 11px;">
                ปัจจุบัน: {{ editPlanUser.plan }}
              </span>
            </div>

            <!-- เลือก Plan -->
            <p class="text-secondary fw-medium mb-3" style="font-size: 13px;">เลือก Plan ที่ต้องการ:</p>
            <div class="d-flex gap-3">
              <!-- Standard -->
              <div class="flex-grow-1 rounded-3 border p-3 d-flex align-items-center gap-3"
                style="cursor: pointer; transition: all 0.15s;"
                [class.border-primary]="selectedPlan === 'Standard'"
                [class.bg-primary]="selectedPlan === 'Standard'"
                [class.bg-opacity-10]="selectedPlan === 'Standard'"
                (click)="selectedPlan = 'Standard'">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 36px; height: 36px; background: #e5e7eb;">
                  <span class="material-symbols-outlined text-secondary" style="font-size: 18px;">architecture</span>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold text-dark" style="font-size: 14px;">Standard</div>
                  <div class="text-secondary" style="font-size: 11px;">1 Project · PDF Export</div>
                </div>
                <span class="material-symbols-outlined text-primary" style="font-size: 20px;"
                  *ngIf="selectedPlan === 'Standard'">check_circle</span>
              </div>

              <!-- Pro -->
              <div class="flex-grow-1 rounded-3 border p-3 d-flex align-items-center gap-3"
                style="cursor: pointer; transition: all 0.15s;"
                [class.border-warning]="selectedPlan === 'Pro'"
                [class.bg-warning]="selectedPlan === 'Pro'"
                [class.bg-opacity-10]="selectedPlan === 'Pro'"
                (click)="selectedPlan = 'Pro'">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 36px; height: 36px; background: #fef3c7;">
                  <span class="material-symbols-outlined text-warning" style="font-size: 18px;">workspace_premium</span>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold text-dark" style="font-size: 14px;">Pro</div>
                  <div class="text-secondary" style="font-size: 11px;">Unlimited · PDF + Docs</div>
                </div>
                <span class="material-symbols-outlined text-warning" style="font-size: 20px;"
                  *ngIf="selectedPlan === 'Pro'">check_circle</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer bg-body-tertiary px-4 py-3 border-top gap-2">
            <button type="button" class="btn btn-outline-secondary px-4 fw-semibold rounded-3"
              (click)="closeEditPlanModal()" [disabled]="isSavingPlan">
              ยกเลิก
            </button>
            <button type="button"
              class="btn btn-primary px-4 fw-semibold rounded-3 d-inline-flex align-items-center gap-2"
              id="confirmChangePlanBtn"
              (click)="confirmChangePlan()"
              [disabled]="isSavingPlan || selectedPlan === editPlanUser?.plan">
              <span *ngIf="!isSavingPlan" class="material-symbols-outlined fs-6">check</span>
              <span *ngIf="isSavingPlan" class="spinner-border spinner-border-sm" role="status"></span>
              {{ isSavingPlan ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
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

  // Edit Plan Modal State
  isEditPlanModalOpen = false;
  editPlanUser: any = null;
  selectedPlan: 'Standard' | 'Pro' = 'Standard';
  isSavingPlan = false;

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
      error: () => {
        this.errorMessage = 'ไม่สามารถดึงข้อมูลได้';
        this.cdr.detectChanges();
      }
    });
  }

  openEditPlanModal(user: any) {
    this.editPlanUser = user;
    this.selectedPlan = user.plan === 'Pro' ? 'Pro' : 'Standard';
    this.isSavingPlan = false;
    this.isEditPlanModalOpen = true;
  }

  closeEditPlanModal() {
    this.isEditPlanModalOpen = false;
    this.editPlanUser = null;
  }

  confirmChangePlan() {
    if (!this.editPlanUser || this.isSavingPlan) return;
    if (this.selectedPlan === this.editPlanUser.plan) return;

    this.isSavingPlan = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.putAdminUserPlan(this.editPlanUser.id, this.selectedPlan, this.auth.getToken()).subscribe({
      next: (res) => {
        this.isSavingPlan = false;
        if (res.success) {
          this.successMessage = res.message;
          this.closeEditPlanModal();
          this.loadUsers();
        } else {
          this.errorMessage = res.message;
        }
        setTimeout(() => { this.successMessage = ''; this.errorMessage = ''; }, 4000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingPlan = false;
        this.errorMessage = err.error?.message || 'เกิดข้อผิดพลาดในการเปลี่ยน Plan';
        setTimeout(() => { this.errorMessage = ''; }, 4000);
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
