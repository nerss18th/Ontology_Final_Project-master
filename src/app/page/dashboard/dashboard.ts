import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';
import { Observable } from 'rxjs';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AdminUsers } from '../admin/admin-users/admin-users';
import { AdminUserProjects } from '../admin/admin-user-projects/admin-user-projects';

interface ProjectItem {
  id: string;
  name: string;
  detail: string;
  link?: string;
  created_by?: number | string;
  owner_name?: string;
  role?: string;
  isOwner?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminUsers, AdminUserProjects],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  public currentUser$: Observable<any>;
  public activeTab = 'projects';
  public isAddProjectModalOpen = false;
  public selectedAdminUserId: string | number | null = null;

  // Edit Profile Modal State
  public isEditProfileModalOpen = false;
  public editName = '';
  public editPhone = '';
  public editEmail = '';
  public editDescription = '';
  public selectedProfilePic: File | null = null;
  public selectedProfilePicPreview: string | null = null;
  public isSavingProfile = false;

  // Receipt Upload Modal State
  public isReceiptUploadModalOpen = false;
  public selectedReceiptFile: File | null = null;
  public selectedReceiptPreview: string | null = null;
  public isUploadingReceipt = false;
  public receiptUploadError = '';
  public receiptUploadSuccess = '';

  public newProject: ProjectItem = {
    id: '',
    name: '',
    detail: '',
  };

  public isSavingProject = false;
  public isDeletingProject = false;

  public projects: ProjectItem[] = [];

  constructor(
    private authService: AuthService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser$ = this.authService.currentUser$;
    
    // Read query params to set initial tab if provided
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  /**
   * ดึงรายการโปรเจกต์ทั้งหมดของผู้ใช้งานจาก API
   */
  loadProjects(): void {
    const token = this.authService.getToken();
    let currentUserId: any = null;
    let currentUserName = '';
    this.currentUser$.subscribe(user => {
      if (user) {
        currentUserId = user.id;
        currentUserName = user.name || user.username || user.email || '';
      }
    }).unsubscribe();

    this.backendApi.getProjects(token).subscribe({
      next: (res) => {
        if (res.success && res['projects']) {
          if (currentUserId === null) {
            this.currentUser$.subscribe(user => {
              if (user) {
                currentUserId = user.id;
                currentUserName = user.name || user.username || user.email || '';
              }
            }).unsubscribe();
          }

          this.projects = res['projects'].map((p: any) => {
            const isOwner = p.role === 'Owner' ||
              (currentUserId !== null && p.created_by !== undefined && Number(p.created_by) === Number(currentUserId));
            return {
              id: p.id.toString(),
              name: p.name,
              detail: p.detail,
              link: `/dashboard/project/${p.id}`,
              created_by: p.created_by,
              owner_name: p.owner_name || (isOwner ? currentUserName : 'Unknown'),
              role: p.role || (isOwner ? 'Owner' : 'Member'),
              isOwner: isOwner
            };
          });
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load projects', err);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * เปลี่ยนแถบเมนู (Tab) ปัจจุบันที่แสดงผล
   */
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      fragment: tab === 'profile' ? 'my-profile' : ''
    });
  }

  viewUserProjects(userId: string | number) {
    this.selectedAdminUserId = userId;
    this.activeTab = 'admin-user-projects';
  }

  public isUpgradeModalOpen = false;
  
  // Error Modal State
  public isErrorModalOpen = false;
  public errorMessage = '';

  // Delete Confirm Modal State
  public isDeleteConfirmModalOpen = false;
  public projectToDeleteId: string | null = null;

  /**
   * เปิดหน้าต่างป๊อปอัปสร้างโปรเจกต์ใหม่ (พร้อมตรวจสอบขีดจำกัดแพ็กเกจ Standard/Pro)
   * นับเฉพาะโปรเจกต์ที่ตนเองเป็น Owner เท่านั้น ไม่นับรวมโปรเจกต์ที่ถูกเพิ่มเข้าทีม
   */
  openAddProjectModal(): void {
    let currentUserPlan = 'Standard';
    let currentUserId: any = null;
    let currentUserRole = 'user';
    this.currentUser$.subscribe(user => {
      if (user) {
        currentUserPlan = user.plan || 'Standard';
        currentUserId = user.id;
        currentUserRole = user.role || 'user';
      }
    }).unsubscribe();

    // นับเฉพาะโปรเจกต์ที่ตนเองเป็น Owner เท่านั้น (ไม่นับโปรเจกต์ของทีมที่ถูกเชิญเข้าร่วม)
    const ownedProjectsCount = this.projects.filter(p => {
      if (p.isOwner) return true;
      if (p.role === 'Owner') return true;
      if (currentUserId !== null && p.created_by !== undefined && Number(p.created_by) === Number(currentUserId)) return true;
      return false;
    }).length;

    if (currentUserPlan !== 'Pro' && currentUserPlan !== 'Admin' && currentUserRole !== 'admin' && ownedProjectsCount >= 1) {
      this.isUpgradeModalOpen = true;
      return;
    }

    const nextId = `${this.projects.length + 1}`;
    this.newProject = {
      id: nextId,
      name: '',
      detail: '',
    };
    this.isAddProjectModalOpen = true;
  }

  closeUpgradeModal(): void {
    this.isUpgradeModalOpen = false;
  }

  closeErrorModal(): void {
    this.isErrorModalOpen = false;
  }

  closeAddProjectModal(): void {
    this.isAddProjectModalOpen = false;
    this.newProject = { id: '', name: '', detail: '' };
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * บันทึกข้อมูลเพื่อสร้างโปรเจกต์ใหม่
   */
  saveProject(): void {
    if (!this.newProject.name.trim() || this.isSavingProject) return;
    this.isSavingProject = true;

    const token = this.authService.getToken();
    this.backendApi.postProject({
      name: this.newProject.name.trim(),
      detail: this.newProject.detail.trim()
    }, token).subscribe({
      next: (res) => {
        this.isSavingProject = false;
        if (res.success) {
          this.closeAddProjectModal();
          this.loadProjects();
        } else {
          alert(res.message || 'Failed to create project');
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingProject = false;
        alert(err.error?.message || 'Failed to create project');
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteConfirmModal(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.projectToDeleteId = id;
    this.isDeleteConfirmModalOpen = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  closeDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.projectToDeleteId = null;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * ดำเนินการลบโปรเจกต์ที่เลือกลงฐานข้อมูลผ่าน API
   */
  confirmDeleteProject(): void {
    if (this.isDeletingProject || !this.projectToDeleteId) return;
    
    const id = this.projectToDeleteId;
    this.isDeletingProject = true;
    const token = this.authService.getToken();
    
    // ปิด Modal และลบการ์ดโปรเจกต์ออกจากหน้าจอทันที ไม่ต้องรอนาน
    this.closeDeleteConfirmModal();
    this.projects = this.projects.filter(p => p.id !== id);
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    this.backendApi.deleteProject(id, token).subscribe({
      next: (res) => {
        this.isDeletingProject = false;
        if (!res.success) {
          this.errorMessage = res.message || 'Failed to delete project';
          this.isErrorModalOpen = true;
          this.loadProjects();
        } else {
          this.loadProjects();
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDeletingProject = false;
        this.errorMessage = err.error?.message || 'Failed to delete project';
        this.isErrorModalOpen = true;
        this.loadProjects();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  openEditProfileModal(user: any): void {
    this.editName = user?.name || user?.username || '';
    this.editPhone = user?.phone && user.phone !== '-' ? user.phone : '';
    this.editEmail = user?.email || '';
    this.editDescription = user?.description || '';
    this.selectedProfilePic = null;
    this.selectedProfilePicPreview = user?.pic ? 'http://localhost:3000' + user.pic : null;
    this.isEditProfileModalOpen = true;
  }

  onProfilePicSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพเกิน 5 MB กรุณาเลือกไฟล์ใหม่');
        event.target.value = ''; // Reset input
        return;
      }
      this.selectedProfilePic = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedProfilePicPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  closeEditProfileModal(): void {
    this.isEditProfileModalOpen = false;
  }

  saveProfile(): void {
    if (!this.editName.trim()) return;
    this.isSavingProfile = true;
    
    // Save profile details
    this.authService.updateProfile(this.editName.trim(), this.editPhone.trim(), this.editEmail.trim(), this.editDescription.trim()).subscribe({
      next: () => {
        // If there is a picture to upload, do it after saving text details
        if (this.selectedProfilePic) {
          this.authService.uploadProfilePic(this.selectedProfilePic).subscribe({
            next: () => {
              this.isSavingProfile = false;
              this.closeEditProfileModal();
            },
            error: () => {
              this.isSavingProfile = false;
              this.closeEditProfileModal();
            }
          });
        } else {
          this.isSavingProfile = false;
          this.closeEditProfileModal();
        }
      },
      error: () => {
        this.isSavingProfile = false;
        this.closeEditProfileModal();
      }
    });
  }

  // Receipt Upload Methods
  openReceiptUploadModal(): void {
    this.selectedReceiptFile = null;
    this.selectedReceiptPreview = null;
    this.receiptUploadError = '';
    this.receiptUploadSuccess = '';
    this.isReceiptUploadModalOpen = true;
  }

  closeReceiptUploadModal(): void {
    this.isReceiptUploadModalOpen = false;
  }

  onReceiptFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.receiptUploadError = 'ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น (JPG, PNG, GIF, WebP)';
      this.selectedReceiptFile = null;
      this.selectedReceiptPreview = null;
      event.target.value = '';
      this.cdr.detectChanges();
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.receiptUploadError = 'ขนาดไฟล์เกิน 10 MB กรุณาเลือกไฟล์ใหม่';
      this.selectedReceiptFile = null;
      this.selectedReceiptPreview = null;
      event.target.value = '';
      this.cdr.detectChanges();
      return;
    }
    this.receiptUploadError = '';
    this.selectedReceiptFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedReceiptPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  uploadReceipt(): void {
    if (!this.selectedReceiptFile || this.isUploadingReceipt) return;
    if (!this.selectedReceiptFile.type.startsWith('image/')) {
      this.receiptUploadError = 'ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น';
      return;
    }
    this.isUploadingReceipt = true;
    this.receiptUploadError = '';
    this.receiptUploadSuccess = '';

    this.authService.uploadReceipt(this.selectedReceiptFile).subscribe({
      next: (res) => {
        this.isUploadingReceipt = false;
        if (res.success) {
          this.receiptUploadSuccess = 'อัปโหลดสลิปสำเร็จแล้ว';
          this.closeReceiptUploadModal();
        } else {
          this.receiptUploadError = res.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingReceipt = false;
        this.receiptUploadError = err.error?.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป';
        this.cdr.detectChanges();
      }
    });
  }
}
