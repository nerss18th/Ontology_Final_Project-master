import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserPlanService } from '../../services/user-plan.service';
import { Subscription } from 'rxjs';

interface UseCase {
  id: string;
  type: string;
  caption: string;
  description: string;
}

interface TeamMember {
  email: string;
  name?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit, OnDestroy {
  public activeSection = 'use-case';
  public isAddModalOpen = false;
  public isEditProjectModalOpen = false;

  public projectName = 'Project 1';
  public projectDetail = 'Example System';
  public editProjectName = '';
  public editProjectDetail = '';

  public currentUser: any = null;
  public isProUser = true;
  private authSub?: Subscription;

  public teamMembers: TeamMember[] = [
    { email: 'pro@gmail.com', name: 'Pro User (Owner)', role: 'Owner' },
  ];
  public newMemberEmail = '';
  public newMemberRole: 'Editor' | 'Viewer' = 'Editor';

  public newUseCase: UseCase = {
    id: 'UC-02',
    type: 'Use Case',
    caption: '',
    description: '',
  };

  public useCases: UseCase[] = [
    {
      id: 'UC-01',
      type: 'Actor',
      caption: 'Actor',
      description: 'Example Actor',
    }
  ];

  constructor(
    private authService: AuthService,
    private userPlanService: UserPlanService
  ) { }

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isProUser = this.userPlanService.canAccessTeamMembers(user);
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  deleteUseCase(id: string): void {
    this.useCases = this.useCases.filter((useCase) => useCase.id !== id);
  }

  openAddModal(): void {
    const nextNum = this.useCases.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    this.newUseCase = {
      id: `UC-${padded}`,
      type: 'Use Case',
      caption: '',
      description: '',
    };
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  saveUseCase(): void {
    if (!this.newUseCase.caption.trim()) {
      return;
    }
    this.useCases.push({ ...this.newUseCase });
    this.closeAddModal();
  }

  openEditProjectModal(): void {
    this.editProjectName = this.projectName;
    this.editProjectDetail = this.projectDetail;
    this.isEditProjectModalOpen = true;
  }

  closeEditProjectModal(): void {
    this.isEditProjectModalOpen = false;
  }

  saveProjectDetails(): void {
    if (!this.editProjectName.trim()) return;
    this.projectName = this.editProjectName.trim();
    this.projectDetail = this.editProjectDetail.trim();
    this.closeEditProjectModal();
  }

  addTeamMember(): void {
    const email = this.newMemberEmail.trim();
    if (!email) return;
    const exists = this.teamMembers.some((m) => m.email.toLowerCase() === email.toLowerCase());
    if (exists) return;

    this.teamMembers.push({
      email,
      name: email.split('@')[0],
      role: this.newMemberRole,
    });
    this.newMemberEmail = '';
  }

  removeTeamMember(email: string): void {
    this.teamMembers = this.teamMembers.filter((m) => m.email.toLowerCase() !== email.toLowerCase());
  }
}
