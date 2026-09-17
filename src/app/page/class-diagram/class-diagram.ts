import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BackendApiService } from '../../services/backend-api.service';
import { AuthService } from '../../services/auth.service';

export interface ImplementInterfaceItem {
  className: string;
  classId: string;
}

export interface AttributeItem {
  name: string;
  encapsulation: 'private' | 'public' | 'protected';
  dataType: string;
  dataSize?: string;
  description?: string;
  exampleFormat?: string;
}

export interface MethodParameterItem {
  name: string;
  dataType: string;
  description?: string;
}

export interface MethodItem {
  type: 'Constructor/Overload' | 'Method' | 'Abstract Method';
  encapsulation: 'private' | 'public' | 'protected';
  name: string;
  description?: string;
  returnValue?: string;
  returnDataType?: string;
  returnDescription?: string;
  parameters: MethodParameterItem[];
}

export interface ClassItem {
  id: string;
  reference?: string;
  name: string;
  type: string;
  description: string;
  extendToClass?: string;
  extendToClassId?: string;
  implementsInterfaces: ImplementInterfaceItem[];
  attributes: AttributeItem[];
  methods: MethodItem[];
}

@Component({
  selector: 'app-class-diagram',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './class-diagram.html',
  styleUrl: './class-diagram.css',
})
export class ClassDiagram implements OnInit {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  @Input() projectId!: string | number;
  public token: string | null = null;
  public classDiagramImage = 'ex-class-diagram.png';
  public diagramFileName: string | null = null;

  public isAddClassModalOpen = false;
  public isViewClassModalOpen = false;
  public isEditMode = false;
  public selectedClassDetail: ClassItem | null = null;

  public newClassItem: ClassItem = {
    id: 'CL-01',
    reference: 'None',
    name: '',
    type: 'Class',
    description: '',
    extendToClass: 'None',
    extendToClassId: '',
    implementsInterfaces: [],
    attributes: [],
    methods: [],
  };

  public classItems: ClassItem[] = [];
  public useCaseItems: any[] = [];

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

    this.loadClasses();
    this.loadDiagramMetadata();
    this.loadUseCases();
  }

  loadUseCases(): void {
    this.backendApi.getUseCases(this.projectId, this.token).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res['useCases'])) {
          this.useCaseItems = res['useCases'];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load use cases', err);
      }
    });
  }

  loadDiagramMetadata(): void {
    this.backendApi.getDiagramByType(this.projectId, 'class', this.token).subscribe({
      next: (res) => {
        if (res.success && res['diagram']) {
          const diag = res['diagram'];
          if (diag.image_path) {
            this.classDiagramImage = 'http://localhost:3000' + diag.image_path;
            this.diagramFileName = diag.file_name;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  loadClasses(): void {
    this.backendApi.getClasses(this.projectId, this.token).subscribe({
      next: (res) => {
        const list = res['classes'];
        if (res.success && Array.isArray(list)) {
          this.classItems = list;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load classes', err);
        this.cdr.detectChanges();
      }
    });
  }

  deleteClassItem(id: string): void {
    if (confirm(`คุณต้องการลบ Class ${id} ใช่หรือไม่?`)) {
      this.backendApi.deleteClass(this.projectId, id, this.token).subscribe({
        next: (res) => {
          if (res.success) {
            this.classItems = this.classItems.filter((item) => item.id !== id);
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

  openViewClassModal(item: ClassItem): void {
    this.selectedClassDetail = item;
    this.isViewClassModalOpen = true;
  }

  closeViewClassModal(): void {
    this.isViewClassModalOpen = false;
    this.selectedClassDetail = null;
  }

  openAddClassModal(): void {
    this.isEditMode = false;
    const nextNum = this.classItems.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    this.newClassItem = {
      id: `CL-${padded}`,
      reference: 'None',
      name: '',
      type: 'Class',
      description: '',
      extendToClass: 'None',
      extendToClassId: '',
      implementsInterfaces: [],
      attributes: [],
      methods: [],
    };
    this.isAddClassModalOpen = true;
  }

  openEditClassModal(item: ClassItem): void {
    this.isEditMode = true;
    this.newClassItem = JSON.parse(JSON.stringify(item));
    this.isAddClassModalOpen = true;
  }

  closeAddClassModal(): void {
    this.isAddClassModalOpen = false;
  }

  onExtendToChange(): void {
    if (this.newClassItem.extendToClass === 'None' || !this.newClassItem.extendToClass) {
      this.newClassItem.extendToClassId = '';
      return;
    }
    const matched = this.classItems.find((c) => c.name === this.newClassItem.extendToClass);
    this.newClassItem.extendToClassId = matched ? matched.id : '';
  }

  addImplementInterface(): void {
    this.newClassItem.implementsInterfaces.push({ className: '', classId: '' });
  }

  removeImplementInterface(index: number): void {
    this.newClassItem.implementsInterfaces.splice(index, 1);
  }

  onImplementClassNameChange(item: ImplementInterfaceItem): void {
    const matched = this.classItems.find((c) => c.name === item.className);
    item.classId = matched ? matched.id : '';
  }

  addAttribute(): void {
    this.newClassItem.attributes.push({
      name: '',
      encapsulation: 'private',
      dataType: 'String',
      dataSize: '',
      description: '',
      exampleFormat: '',
    });
  }

  removeAttribute(index: number): void {
    this.newClassItem.attributes.splice(index, 1);
  }

  addMethod(): void {
    this.newClassItem.methods.push({
      type: 'Method',
      encapsulation: 'public',
      name: '',
      description: '',
      returnValue: '',
      returnDataType: 'void',
      returnDescription: '',
      parameters: [],
    });
  }

  removeMethod(index: number): void {
    this.newClassItem.methods.splice(index, 1);
  }

  addMethodParameter(method: MethodItem): void {
    method.parameters.push({
      name: '',
      dataType: 'String',
      description: '',
    });
  }

  removeMethodParameter(method: MethodItem, paramIndex: number): void {
    method.parameters.splice(paramIndex, 1);
  }

  saveClassItem(): void {
    if (!this.newClassItem.name.trim()) {
      alert('กรุณากรอก Class Name');
      return;
    }

    const payload = JSON.parse(JSON.stringify(this.newClassItem));
    this.backendApi.saveClass(this.projectId, payload, this.token).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.isEditMode) {
            const idx = this.classItems.findIndex((c) => c.id === payload.id);
            if (idx !== -1) {
              this.classItems[idx] = payload;
            }
          } else {
            this.classItems.push(payload);
          }
          this.cdr.detectChanges();
          this.closeAddClassModal();
        } else {
          alert(res.message || 'Failed to save class');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save class');
        this.cdr.detectChanges();
        this.closeAddClassModal();
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
    formData.append('type', 'class');
    formData.append('image', file);
    
    this.backendApi.postUploadDiagramImage(formData, this.token).subscribe({
      next: (res) => {
        if (res.success && res['imagePath']) {
          const imagePath = res['imagePath'];
          
          this.backendApi.postUploadDiagram({
            projectId: this.projectId,
            type: 'class',
            fileName: file.name,
            imagePath: imagePath
          }, this.token).subscribe({
            next: (saveRes) => {
              if (saveRes.success) {
                this.classDiagramImage = 'http://localhost:3000' + imagePath;
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
        type: 'class',
        fileName: '',
        imagePath: ''
      }, this.token).subscribe({
        next: (res) => {
          if (res.success) {
            this.classDiagramImage = 'ex-class-diagram.png';
            this.diagramFileName = null;
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  exportClassDiagram(): void {
    if (!this.projectId) {
      alert('ไม่พบ Project ID');
      return;
    }

    this.backendApi.getExportClassDiagram(this.projectId, this.token).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ClassDiagram_${this.projectId}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('Export Error:', err);
        alert('เกิดข้อผิดพลาดในการ Export ไฟล์เอกสาร');
      }
    });
  }
}
