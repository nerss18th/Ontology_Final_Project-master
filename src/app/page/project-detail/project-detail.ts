import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserPlanService } from '../../services/user-plan.service';
import { Subscription } from 'rxjs';
import { ProjectSidebar } from '../project-sidebar/project-sidebar';
import { UseCaseDiagram } from '../use-case-diagram/use-case-diagram';
import { ClassDiagram } from '../class-diagram/class-diagram';
import { Overview } from '../overview/overview';

interface TeamMember {
  email: string;
  name?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
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
    Overview,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit, OnDestroy {
  // Navigation & Project State
  public activeSection = 'overview';
  public projectName = 'Project 1';
  public projectDetail = 'Example System';

  // Project Edit Modal State
  public isEditProjectModalOpen = false;
  public editProjectName = '';
  public editProjectDetail = '';

  // Auth & Team State
  public currentUser: any = null;
  public isProUser = true;
  private authSub?: Subscription;

  public teamMembers: TeamMember[] = [
    { email: 'pro@gmail.com', name: 'Pro User (Owner)', role: 'Owner' },
  ];
  public newMemberEmail = '';
  public newMemberRole: 'Editor' | 'Viewer' = 'Editor';

  constructor(
    private authService: AuthService,
    private userPlanService: UserPlanService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isProUser = this.userPlanService.canAccessTeamMembers(user);
    });

    this.route.queryParams.subscribe((params) => {
      if (params['section']) {
        this.activeSection = params['section'];
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
      case 'overview':
        return 'Overview';
      case 'use-case':
        return 'Use case Diagram';
      case 'class':
        return 'Class Diagram';
      case 'activity':
        return 'Activity Diagram';
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
