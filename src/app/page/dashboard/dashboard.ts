import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';

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
export class Dashboard {
  public currentUser$: Observable<any>;
  public activeTab = 'projects';
  public isAddProjectModalOpen = false;

  public newProject: ProjectItem = {
    id: '',
    name: '',
    detail: '',
  };

  public projects: ProjectItem[] = [
    {
      id: '1',
      name: 'Project 1',
      detail: 'Example System',
      link: '/dashboard/project/1',
    }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  openAddProjectModal(): void {
    const nextId = `${this.projects.length + 1}`;
    this.newProject = {
      id: nextId,
      name: '',
      detail: '',
    };
    this.isAddProjectModalOpen = true;
  }

  closeAddProjectModal(): void {
    this.isAddProjectModalOpen = false;
  }

  saveProject(): void {
    if (!this.newProject.name.trim()) return;

    this.projects.push({
      id: this.newProject.id,
      name: this.newProject.name.trim(),
      detail: this.newProject.detail.trim() || 'Empty Project',
    });

    this.closeAddProjectModal();
  }
}
