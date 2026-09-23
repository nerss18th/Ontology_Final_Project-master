import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackendApiService } from '../../../services/backend-api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-user-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="w-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <a href="javascript:void(0)" (click)="goBack.emit()" class="text-decoration-none text-secondary me-2 hover-primary" style="vertical-align: middle;">
            <span class="material-symbols-outlined align-middle fs-3">arrow_back</span>
          </a>
          <span class="align-middle">โปรเจกต์ของ User #{{ userId }}</span>
        </h2>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Project ID</th>
                  <th>ชื่อโปรเจกต์</th>
                  <th>รายละเอียด</th>
                  <th class="text-end pe-4">ลบ Project</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let project of projects">
                  <td class="ps-4">#{{ project.id }}</td>
                  <td class="fw-medium text-dark">
                    <a [routerLink]="['/dashboard/project', project.id]" target="_blank" class="text-decoration-none fw-medium text-primary" style="cursor: pointer;" title="คลิกเพื่อดูโปรเจกต์">
                      {{ project.name }}
                    </a>
                  </td>
                  <td class="text-secondary text-truncate" style="max-width: 300px;">{{ project.detail || '-' }}</td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-danger" (click)="deleteProject(project.id, project.name)">
                      <span class="material-symbols-outlined fs-6 align-middle">delete</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="projects.length === 0 && !isLoading">
                  <td colspan="4" class="text-center py-5 text-muted">ผู้ใช้นี้ยังไม่ได้เป็นเจ้าของโปรเจกต์ใดๆ</td>
                </tr>
                <tr *ngIf="isLoading">
                  <td colspan="4" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminUserProjects implements OnInit, OnChanges {
  @Input() userId: string | number | null = null;
  @Output() goBack = new EventEmitter<void>();

  projects: any[] = [];
  errorMessage = '';
  successMessage = '';
  isLoading = true;

  constructor(
    private api: BackendApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadProjects();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange && this.userId) {
      this.loadProjects();
    }
  }

  loadProjects() {
    this.isLoading = true;
    this.api.getAdminUserProjects(this.userId!, this.auth.getToken()).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.projects = res['projects'];
        } else {
          this.errorMessage = res.message || 'ไม่สามารถโหลดข้อมูลได้';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
        this.cdr.detectChanges();
      }
    });
  }

  deleteProject(projectId: number | string, projectName: string) {
    if(confirm(`ยืนยันการลบโปรเจกต์ "${projectName}" อย่างถาวร?`)) {
      this.api.deleteProject(projectId, this.auth.getToken()).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = 'ลบโปรเจกต์เรียบร้อยแล้ว';
            this.loadProjects(); // โหลดข้อมูลใหม่
          } else {
            this.errorMessage = res.message || 'ไม่สามารถลบโปรเจกต์ได้';
          }
          setTimeout(() => this.successMessage = '', 3000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'เกิดข้อผิดพลาดในการลบโปรเจกต์';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
