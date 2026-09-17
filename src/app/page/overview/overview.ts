import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  @Input() projectId!: any;
  @Input() projectName: string = 'Project 1';
  @Input() projectDetail: string = 'Example System';
  @Output() navigateSection = new EventEmitter<string>();

  public useCases: any[] = [];
  public classes: any[] = [];
  public activityDiagrams: any[] = [];
  public isLoading = true;

  constructor(
    private authService: AuthService,
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    if (!this.projectId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const token = this.authService.getToken();
    
    // Fetch all diagram types
    let loadedCount = 0;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount === 3) {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    };

    // Use Cases
    this.backendApi.getUseCases(this.projectId, token).subscribe({
      next: (res) => {
        if (res.success && (res['data'] || res['useCases'])) {
          this.useCases = res['data'] || res['useCases'] || [];
        }
        checkDone();
      },
      error: () => checkDone()
    });

    // Classes
    this.backendApi.getClasses(this.projectId, token).subscribe({
      next: (res) => {
        if (res.success && (res['data'] || res['classes'])) {
          this.classes = res['data'] || res['classes'] || [];
        }
        checkDone();
      },
      error: () => checkDone()
    });

    // Activity Diagrams
    this.backendApi.getActivityDiagrams(this.projectId, token).subscribe({
      next: (res) => {
        if (res.success && (res['data'] || res['activityDiagrams'])) {
          this.activityDiagrams = res['data'] || res['activityDiagrams'] || [];
        }
        checkDone();
      },
      error: () => checkDone()
    });
  }

  goToSection(section: string): void {
    this.navigateSection.emit(section);
  }

  public selectedEntity: any = null;
  public selectedEntityType: 'use-case' | 'class' | 'activity' | null = null;
  public isEntityModalOpen = false;

  openEntityModal(type: 'use-case' | 'class' | 'activity', entity: any): void {
    this.selectedEntityType = type;
    this.selectedEntity = entity;
    this.isEntityModalOpen = true;
  }

  closeEntityModal(): void {
    this.isEntityModalOpen = false;
    this.selectedEntity = null;
    this.selectedEntityType = null;
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:image')) return path;
    return 'http://localhost:3000' + path;
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      // Adding a slight delay or just scrolling directly
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
