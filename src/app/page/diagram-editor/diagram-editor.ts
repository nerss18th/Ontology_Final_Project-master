import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectSidebar } from '../project-sidebar/project-sidebar';

@Component({
  selector: 'app-diagram-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProjectSidebar],
  templateUrl: './diagram-editor.html',
  styleUrl: './diagram-editor.css',
})
export class DiagramEditor implements OnInit {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  public diagramType: 'use-case' | 'class' | 'activity' = 'use-case';
  public diagramTitle = 'Edit Use Case Diagram';
  public fileName = 'ex-diagram.png';
  public lastModified = '2 mins ago';
  public previewUrl: string | null = 'ex-diagram.png';
  public searchTerm = '';

  // Project Edit Modal State
  public projectName = 'Project 1';
  public projectDetail = 'Example System';
  public editProjectName = '';
  public editProjectDetail = '';
  public isEditProjectModalOpen = false;
  public currentUser: any = null;
  public isProUser = true;
  public teamMembers: Array<{ email: string; name?: string; role: string }> = [
    { email: 'pro@gmail.com', name: 'Pro User (Owner)', role: 'Owner' },
  ];
  public newMemberEmail = '';
  public newMemberRole = 'Editor';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['diagram'] === 'class') {
        this.diagramType = 'class';
        this.diagramTitle = 'Edit Class Diagram';
        this.fileName = localStorage.getItem('class_diagram_filename') || 'ex-class-diagram.png';
        this.previewUrl = localStorage.getItem('class_diagram_image') || 'ex-class-diagram.png';
      } else {
        this.diagramType = 'use-case';
        this.diagramTitle = 'Edit Use Case Diagram';
        this.fileName = localStorage.getItem('use_case_diagram_filename') || 'ex-diagram.png';
        this.previewUrl = localStorage.getItem('use_case_diagram_image') || 'ex-diagram.png';
      }
    });
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

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileName = file.name;
    this.lastModified = 'just now';

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.previewUrl = result;
    };
    reader.readAsDataURL(file);
  }

  saveChanges(): void {
    if (this.previewUrl) {
      if (this.diagramType === 'class') {
        localStorage.setItem('class_diagram_image', this.previewUrl);
        localStorage.setItem('class_diagram_filename', this.fileName);
      } else {
        localStorage.setItem('use_case_diagram_image', this.previewUrl);
        localStorage.setItem('use_case_diagram_filename', this.fileName);
      }
    }
    this.router.navigate(['/dashboard/project/1'], { queryParams: { section: this.diagramType } });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/project/1'], { queryParams: { section: this.diagramType } });
  }

  openFullScreen(): void {
    const preview = document.querySelector('.diagram-preview');
    if (preview instanceof HTMLElement) {
      preview.requestFullscreen?.();
    }
  }
}
