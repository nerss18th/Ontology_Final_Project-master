import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BackendApiService } from '../../services/backend-api.service';
import { AuthService } from '../../services/auth.service';

export interface UseCase {
  id: string;
  type: string;
  caption: string;
  description: string;
}

@Component({
  selector: 'app-use-case-diagram',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './use-case-diagram.html',
  styleUrl: './use-case-diagram.css',
})
export class UseCaseDiagram implements OnInit {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  @Input() projectId!: string | number;
  public token: string | null = null;
  public useCaseDiagramImage = 'ex-diagram.png'; // Fallback
  public diagramFileName: string | null = null;

  public isAddModalOpen = false;
  public isViewModalOpen = false;
  public isEditMode = false;

  public selectedUseCaseForView: UseCase | null = null;
  public newUseCase: UseCase = {
    id: 'UC-01',
    type: 'Use Case',
    caption: '',
    description: '',
  };

  public useCases: UseCase[] = [];

  constructor(
    private backendApi: BackendApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.authService.getToken();

    this.route.parent?.params.subscribe((params) => {
      if (params['id']) {
        this.projectId = Number(params['id']) || 1;
      }
    });

    this.loadUseCases();
    this.loadDiagramMetadata();
  }

  loadDiagramMetadata(): void {
    this.backendApi.getDiagramByType(this.projectId, 'use-case', this.token).subscribe({
      next: (res) => {
        if (res.success && res['diagram']) {
          const diag = res['diagram'];
          if (diag.image_path) {
            this.useCaseDiagramImage = 'http://localhost:3000' + diag.image_path;
            this.diagramFileName = diag.file_name;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  loadUseCases(): void {
    this.backendApi.getUseCases(this.projectId, this.token).subscribe({
      next: (res) => {
        const list = res['useCases'];
        if (res.success && Array.isArray(list)) {
          this.useCases = list;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load use cases', err);
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
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

  openEditModal(item: UseCase): void {
    this.isEditMode = true;
    this.newUseCase = { ...item };
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.cdr.detectChanges();
  }

  openViewModal(item: UseCase): void {
    this.selectedUseCaseForView = item;
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedUseCaseForView = null;
  }

  saveUseCase(): void {
    if (!this.newUseCase.caption.trim()) {
      return;
    }

    const payload = { ...this.newUseCase };
    this.backendApi.saveUseCase(this.projectId, payload, this.token).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.isEditMode) {
            const idx = this.useCases.findIndex((u) => u.id === payload.id);
            if (idx !== -1) {
              this.useCases[idx] = payload;
            }
          } else {
            this.useCases.push(payload);
          }
          this.cdr.detectChanges();
          this.closeAddModal();
        } else {
          alert(res.message || 'Failed to save use case');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save use case');
        this.cdr.detectChanges();
        this.closeAddModal();
      }
    });
  }

  // Diagram Image Upload
  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพเกิน 5 MB กรุณาเลือกไฟล์ใหม่');
      input.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('type', 'use-case');
    formData.append('image', file);
    
    this.backendApi.postUploadDiagramImage(formData, this.token).subscribe({
      next: (res) => {
        if (res.success && res['imagePath']) {
          const imagePath = res['imagePath'];
          
          this.backendApi.postUploadDiagram({
            projectId: this.projectId,
            type: 'use-case',
            fileName: file.name,
            imagePath: imagePath
          }, this.token).subscribe({
            next: (saveRes) => {
              if (saveRes.success) {
                this.useCaseDiagramImage = 'http://localhost:3000' + imagePath;
                this.diagramFileName = file.name;
                this.cdr.detectChanges();
              }
            }
          });
        } else {
          alert(res.message || 'Upload failed');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Upload failed');
      }
    });
  }

  removeImage(): void {
    if (confirm('ต้องการลบรูปภาพแผนภาพใช่หรือไม่?')) {
      this.backendApi.postUploadDiagram({
        projectId: this.projectId,
        type: 'use-case',
        fileName: '',
        imagePath: ''
      }, this.token).subscribe({
        next: (res) => {
          if (res.success) {
            this.useCaseDiagramImage = 'ex-diagram.png';
            this.diagramFileName = null;
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  deleteUseCase(id: string): void {
    if (confirm(`คุณต้องการลบ Use Case ${id} ใช่หรือไม่?`)) {
      this.backendApi.deleteUseCase(this.projectId, id, this.token).subscribe({
        next: (res) => {
          if (res.success) {
            this.useCases = this.useCases.filter((useCase) => useCase.id !== id);
            this.cdr.detectChanges();
          } else {
            alert(res.message || 'Failed to delete');
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete');
          this.cdr.detectChanges();
        }
      });
    }
  }
}
