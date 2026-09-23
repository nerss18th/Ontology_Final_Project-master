import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';
import { UserPlanService } from '../../services/user-plan.service';
import { Subscription } from 'rxjs';
import { ProjectSidebar } from '../project-sidebar/project-sidebar';
import { UseCaseDiagram } from '../use-case-diagram/use-case-diagram';
import { ClassDiagram } from '../class-diagram/class-diagram';
import { ActivityDiagram } from '../activity-diagram/activity-diagram';
import { Overview } from '../overview/overview';

interface TeamMember {
  id?: number | string;
  email: string;
  name?: string;
  role: 'Owner' | 'Editor';
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ProjectSidebar,
    UseCaseDiagram,
    ClassDiagram,
    ActivityDiagram,
    Overview,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit, OnDestroy {
  // Navigation & Project State
  public projectId: number = 1;
  public activeSection = 'overview';
  public projectName = '';
  public projectDetail = '';

  // Project Edit Modal State
  public isEditProjectModalOpen = false;
  public editProjectName = '';
  public editProjectDetail = '';

  // Auth & Team State
  public currentUser: any = null;
  public isProUser = true;
  private authSub?: Subscription;

  public teamMembers: TeamMember[] = [];
  public newMemberEmail = '';
  public isViewer = false;

  constructor(
    private authService: AuthService,
    private backendApi: BackendApiService,
    private userPlanService: UserPlanService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isProUser = this.userPlanService.canAccessTeamMembers(user);
    });

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.projectId = params['id'];
        this.loadProjectDetails();
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (params['section']) {
        this.activeSection = params['section'];
      }
    });
  }

  /**
   * ดึงข้อมูลรายละเอียดของโปรเจกต์และรายชื่อสมาชิกจาก API
   */
  loadProjectDetails(): void {
    const token = this.authService.getToken();
    if (!this.projectId) return;

    this.backendApi.getProjectDetail(this.projectId, token).subscribe({
      next: (res) => {
        if (res.success && res['project']) {
          this.projectName = res['project'].name;
          this.projectDetail = res['project'].detail || '';
        }
        if (res.success && res['members']) {
          this.teamMembers = res['members'].map((m: any) => ({
            id: m.id,
            email: m.email,
            name: m.name || m.email.split('@')[0],
            role: m.role
          }));
          const myMember = this.teamMembers.find(m => m.email === this.currentUser?.email || (m.id && m.id === this.currentUser?.id));
          this.isViewer = false;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load project details', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  get activeDiagramTitle(): string {
    switch (this.activeSection) {
      case 'use-case':
        return 'Use case Diagram';
      case 'class':
        return 'Class Diagram';
      case 'activity':
        return 'Activity Diagram';
      case 'export':
        return 'Export Document';
      case 'overview':
        return 'Project Overview';
      default:
        return 'Overview';
    }
  }

  openEditProjectModal(): void {
    this.editProjectName = this.projectName;
    this.editProjectDetail = this.projectDetail;
    this.isEditProjectModalOpen = true;
  }

  closeEditProjectModal(): void {
    this.isEditProjectModalOpen = false;
  }

  /**
   * บันทึกการแก้ไขชื่อและรายละเอียดของโปรเจกต์
   */
  saveProjectDetails(): void {
    if (!this.editProjectName.trim()) return;
    
    const token = this.authService.getToken();
    this.backendApi.putProjectDetail(this.projectId, {
      name: this.editProjectName.trim(),
      detail: this.editProjectDetail.trim()
    }, token).subscribe({
      next: (res) => {
        if (res.success) {
          this.projectName = this.editProjectName.trim();
          this.projectDetail = this.editProjectDetail.trim();
          this.closeEditProjectModal();
          this.cdr.detectChanges();
        } else {
          alert(res.message || 'Failed to update project');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update project');
      }
    });
  }

  /**
   * เพิ่มสมาชิกใหม่ (Editor) เข้ามาในโปรเจกต์ (เฉพาะบัญชี Pro)
   */
  addTeamMember(): void {
    const email = this.newMemberEmail.trim();
    if (!email) return;
    const exists = this.teamMembers.some((m) => m.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      alert('มีสมาชิกนี้อยู่ในโปรเจกต์แล้ว');
      return;
    }

    const token = this.authService.getToken();
    this.backendApi.postProjectMember(this.projectId, { email, role: 'Editor' }, token).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadProjectDetails();
          this.newMemberEmail = '';
        } else {
          alert(res.message || 'Failed to add member');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add member');
      }
    });
  }

  /**
   * ลบสมาชิกออกจากโปรเจกต์
   */
  removeTeamMember(member: any): void {
    if (!member.id) return;
    if (confirm(`คุณต้องการลบสมาชิก ${member.email} ใช่หรือไม่?`)) {
      const token = this.authService.getToken();
      this.backendApi.deleteProjectMember(this.projectId, member.id, token).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadProjectDetails();
          } else {
            alert(res.message || 'Failed to remove member');
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to remove member');
        }
      });
    }
  }

  // ==========================================
  // EXPORT METHODS
  // ==========================================
  /**
   * ดาวน์โหลด (Export) แผนภาพ Use Case ออกมาเป็นไฟล์เอกสาร Word
   */
  exportUseCaseDoc(): void {
    const token = this.authService.getToken();
    this.backendApi.getExportUseCase(this.projectId, token).subscribe({
      next: (blob) => {
        const username = this.currentUser?.username || 'unknown';
        const randomNumber = Math.floor(Math.random() * 100000);
        const defaultFilename = `useCase_${username}_${this.projectId}_${randomNumber}.docx`;

        // ใช้ <a> tag สำหรับการดาวน์โหลดปกติ (ระบบเบราว์เซอร์จะไม่บล็อก)
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Export error:', err);
        alert('Failed to export Use Case Document');
      }
    });
  }

  exportClassDoc(): void {
    const token = this.authService.getToken();
    this.backendApi.getExportClassDiagram(this.projectId, token).subscribe({
      next: (blob) => {
        const username = this.currentUser?.username || 'unknown';
        const randomNumber = Math.floor(Math.random() * 100000);
        const defaultFilename = `classDiagram_${username}_${this.projectId}_${randomNumber}.docx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Export error:', err);
        alert('Failed to export Class Document');
      }
    });
  }

  exportActivityDoc(): void {
    const token = this.authService.getToken();
    this.backendApi.getExportActivityDiagram(this.projectId, token).subscribe({
      next: (blob) => {
        const username = this.currentUser?.username || 'unknown';
        const randomNumber = Math.floor(Math.random() * 100000);
        const defaultFilename = `activityDiagram_${username}_${this.projectId}_${randomNumber}.docx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Export error:', err);
        alert('Failed to export Activity Document');
      }
    });
  }
}
