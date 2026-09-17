import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';
import { Observable } from 'rxjs';
import { RouterLink, ActivatedRoute } from '@angular/router';

interface ProjectItem {
  id: string;
  name: string;
  detail: string;
  link?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  public currentUser$: Observable<any>;
  public activeTab = 'projects';
  public isAddProjectModalOpen = false;

  // Edit Profile Modal State
  public isEditProfileModalOpen = false;
  public editName = '';
  public editPhone = '';
  public editEmail = '';
  public editDescription = '';
  public selectedProfilePic: File | null = null;
  public selectedProfilePicPreview: string | null = null;
  public isSavingProfile = false;

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

  loadProjects(): void {
    const token = this.authService.getToken();
    this.backendApi.getProjects(token).subscribe({
      next: (res) => {
        if (res.success && res['projects']) {
          this.projects = res['projects'].map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            detail: p.detail,
            link: `/dashboard/project/${p.id}`
          }));
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load projects', err);
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  public isUpgradeModalOpen = false;

  openAddProjectModal(): void {
    let currentUserPlan = 'Standard';
    this.currentUser$.subscribe(user => {
      if (user) {
        currentUserPlan = user.plan || 'Standard';
      }
    }).unsubscribe();

    if (currentUserPlan !== 'Pro' && this.projects.length >= 1) {
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

  closeAddProjectModal(): void {
    this.isAddProjectModalOpen = false;
    this.newProject = { id: '', name: '', detail: '' };
    this.cdr.detectChanges();
  }

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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingProject = false;
        alert(err.error?.message || 'Failed to create project');
        this.cdr.detectChanges();
      }
    });
  }

  deleteProject(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isDeletingProject) return;

    if (confirm('คุณต้องการลบโปรเจกต์นี้ใช่หรือไม่? ข้อมูลภายในโปรเจกต์ทั้งหมดจะถูกลบ')) {
      this.isDeletingProject = true;
      const token = this.authService.getToken();
      this.backendApi.deleteProject(id, token).subscribe({
        next: (res) => {
          this.isDeletingProject = false;
          if (res.success) {
            // อัปเดต UI ให้หายไปทันทีโดยไม่ต้องรอโหลดใหม่
            this.projects = this.projects.filter(p => p.id !== id);
            // โหลดใหม่เผื่อความชัวร์ (เป็น background)
            this.loadProjects();
          } else {
            alert(res.message || 'Failed to delete project');
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isDeletingProject = false;
          alert(err.error?.message || 'Failed to delete project');
          this.cdr.detectChanges();
        }
      });
    }
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
}
