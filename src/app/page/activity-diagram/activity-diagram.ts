import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BackendApiService } from '../../services/backend-api.service';
import { AuthService } from '../../services/auth.service';

export interface Swimlane {
  id?: number;
  laneNo: string;
  type: string;
  caption: string;
  referenceId: string;
}

export interface StartPoint {
  id?: number;
  fromLaneNo: string;
  toAction: string;
}

export interface EndPoint {
  id?: number;
  laneNo: string;
  fromType: string;
  fromNo: string;
  endState: 'Success' | 'Unsuccess';
}

export interface ActivityAction {
  id?: number;
  actionNo: string;
  laneNo: string;
  caption: string;
  description: string;
}

export interface DecisionCriteria {
  id?: number;
  criteriaNo: string;
  detail: string;
  referenceId: string;
}

export interface DecisionNode {
  id?: number;
  decisionNo: string;
  laneNo: string;
  fromActionNo: string;
  caption: string;
  criteria: DecisionCriteria[];
}

export interface ActivityDiagramItem {
  id?: number;
  projectId?: number;
  activityId: string;
  activityName: string;
  useCaseRef: string;
  preliminaryActivityId: string;
  description: string;
  imagePath: string | null;
  fileName: string | null;
  hasSwimlane: 'Yes' | 'No';
  swimlanes: Swimlane[];
  startPoint: StartPoint;
  endPoints: EndPoint[];
  actions: ActivityAction[];
  decisionNodes: DecisionNode[];
}

@Component({
  selector: 'app-activity-diagram',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-diagram.html',
  styleUrl: './activity-diagram.css',
})
export class ActivityDiagram implements OnInit {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  @Input() projectId!: string | number;
  public token: string | null = null;
  public activityDiagramImage = 'ex-diagram.png';
  public diagramFileName: string | null = null;
  @ViewChild('mainFileInput') private mainFileInput?: ElementRef<HTMLInputElement>;

  public activityDiagrams: ActivityDiagramItem[] = [];

  public selectedDiagramForEdit: ActivityDiagramItem | null = null;
  public selectedDiagramForView: ActivityDiagramItem | null = null;

  public isAddModalOpen = false;
  public isViewModalOpen = false;
  public isEditMode = false;

  public useCaseOptions: string[] = ['UC-01 (Manage Users)', 'UC-02 (Manage Projects)', 'UC-03 (View Diagram)'];
  public isSaving = false;
  public saveMessage = '';

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
    this.loadActivityDiagrams();
    this.loadDiagramMetadata();
  }

  loadDiagramMetadata(): void {
    this.backendApi.getDiagramByType(this.projectId, 'activity', this.token).subscribe({
      next: (res) => {
        if (res.success && res['diagram']) {
          const diag = res['diagram'];
          if (diag.image_path) {
            this.activityDiagramImage = 'http://localhost:3000' + diag.image_path;
            this.diagramFileName = diag.file_name;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private createEmptyDiagram(activityIdStr: string): ActivityDiagramItem {
    return {
      activityId: activityIdStr,
      activityName: '',
      useCaseRef: '',
      preliminaryActivityId: '',
      description: '',
      imagePath: null,
      fileName: null,
      hasSwimlane: 'No',
      swimlanes: [
        { laneNo: 'L-01', type: 'User', caption: 'User Lane', referenceId: 'REF-01' }
      ],
      startPoint: { fromLaneNo: '', toAction: '' },
      endPoints: [
        { laneNo: '', fromType: 'Action', fromNo: '', endState: 'Success' }
      ],
      actions: [
        { actionNo: 'A-01', laneNo: '', caption: '', description: '' }
      ],
      decisionNodes: [
        {
          decisionNo: 'D-01',
          laneNo: '',
          fromActionNo: '',
          caption: '',
          criteria: [
            { criteriaNo: 'C-01', detail: '', referenceId: '' }
          ]
        }
      ]
    };
  }

  loadUseCases(): void {
    this.backendApi.getUseCases(this.projectId, this.token).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res['useCases'])) {
          this.useCaseOptions = res['useCases'].map((uc: any) => `${uc.id} (${uc.caption || 'No Caption'})`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load use cases', err);
      }
    });
  }

  loadActivityDiagrams(): void {
    this.backendApi.getActivityDiagrams(this.projectId, this.token).subscribe({
      next: (res) => {
        const list = res['activityDiagrams'];
        if (res.success && Array.isArray(list)) {
          this.activityDiagrams = list;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load activity diagrams', err);
        this.cdr.detectChanges();
      }
    });
  }

  // Modal Handlers
  openAddModal(): void {
    this.isEditMode = false;
    const nextNum = this.activityDiagrams.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    this.selectedDiagramForEdit = this.createEmptyDiagram(`ACT-${padded}`);
    this.isAddModalOpen = true;
  }

  openEditModal(item: ActivityDiagramItem): void {
    this.isEditMode = true;
    this.selectedDiagramForEdit = JSON.parse(JSON.stringify(item));
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.selectedDiagramForEdit = null;
    this.cdr.detectChanges();
  }

  openViewModal(item: ActivityDiagramItem): void {
    this.selectedDiagramForView = item;
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedDiagramForView = null;
  }

  deleteActivityItem(id?: number, activityIdStr?: string): void {
    if (confirm(`คุณต้องการลบ Activity Diagram ${activityIdStr || ''} ใช่หรือไม่?`)) {
      if (id) {
        this.backendApi.deleteActivityDiagram(this.projectId, id, this.token).subscribe({
          next: (res) => {
            if (res.success) {
              this.activityDiagrams = this.activityDiagrams.filter((item) => item.id !== id);
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
      } else {
        this.activityDiagrams = this.activityDiagrams.filter((item) => item.activityId !== activityIdStr);
        this.cdr.detectChanges();
      }
    }
  }

  // File Upload inside Modal
  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    if (!this.selectedDiagramForEdit) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพเกิน 5 MB กรุณาเลือกไฟล์ใหม่');
      input.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('type', 'activity');
    formData.append('image', file);
    
    this.backendApi.postUploadDiagramImage(formData, this.token).subscribe({
      next: (res) => {
        if (res.success && res['imagePath']) {
          if (this.selectedDiagramForEdit) {
            this.selectedDiagramForEdit.imagePath = res['imagePath'];
            this.selectedDiagramForEdit.fileName = file.name;
            this.cdr.detectChanges();
          }
        } else {
          alert(res.message || 'Upload failed');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Upload failed');
      }
    });
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:image')) return path;
    return 'http://localhost:3000' + path;
  }

  removeImage(): void {
    if (this.selectedDiagramForEdit) {
      this.selectedDiagramForEdit.imagePath = null;
      this.selectedDiagramForEdit.fileName = null;
      this.cdr.detectChanges();
    }
  }

  // Getters for dropdown options in Modal
  get preliminaryActivityOptions(): string[] {
    if (!this.selectedDiagramForEdit) return [];
    return this.activityDiagrams
      .filter((d) => d.activityId !== this.selectedDiagramForEdit?.activityId)
      .map((d) => d.activityId);
  }

  get swimlaneNoOptions(): string[] {
    if (!this.selectedDiagramForEdit) return [];
    return (this.selectedDiagramForEdit.swimlanes || []).map((s) => s.laneNo).filter((l) => !!l);
  }

  get actionNoOptions(): string[] {
    if (!this.selectedDiagramForEdit) return [];
    return (this.selectedDiagramForEdit.actions || []).map((a) => a.actionNo).filter((a) => !!a);
  }

  // Table Add / Remove Row Helpers inside Modal
  addSwimlane(): void {
    if (!this.selectedDiagramForEdit) return;
    const count = (this.selectedDiagramForEdit.swimlanes || []).length + 1;
    const padded = count < 10 ? `0${count}` : `${count}`;
    this.selectedDiagramForEdit.swimlanes.push({
      laneNo: `L-${padded}`,
      type: '',
      caption: '',
      referenceId: ''
    });
  }

  deleteSwimlane(index: number): void {
    this.selectedDiagramForEdit?.swimlanes.splice(index, 1);
  }

  addEndPoint(): void {
    this.selectedDiagramForEdit?.endPoints.push({
      laneNo: '',
      fromType: 'Action',
      fromNo: '',
      endState: 'Success'
    });
  }

  deleteEndPoint(index: number): void {
    this.selectedDiagramForEdit?.endPoints.splice(index, 1);
  }

  addAction(): void {
    if (!this.selectedDiagramForEdit) return;
    const count = (this.selectedDiagramForEdit.actions || []).length + 1;
    const padded = count < 10 ? `0${count}` : `${count}`;
    this.selectedDiagramForEdit.actions.push({
      actionNo: `A-${padded}`,
      laneNo: '',
      caption: '',
      description: ''
    });
  }

  deleteAction(index: number): void {
    this.selectedDiagramForEdit?.actions.splice(index, 1);
  }

  addDecisionNode(): void {
    if (!this.selectedDiagramForEdit) return;
    const count = (this.selectedDiagramForEdit.decisionNodes || []).length + 1;
    const padded = count < 10 ? `0${count}` : `${count}`;
    this.selectedDiagramForEdit.decisionNodes.push({
      decisionNo: `D-${padded}`,
      laneNo: '',
      fromActionNo: '',
      caption: '',
      criteria: [
        { criteriaNo: 'C-01', detail: '', referenceId: '' }
      ]
    });
  }

  deleteDecisionNode(index: number): void {
    this.selectedDiagramForEdit?.decisionNodes.splice(index, 1);
  }

  addCriteria(dn: DecisionNode): void {
    const count = (dn.criteria || []).length + 1;
    const padded = count < 10 ? `0${count}` : `${count}`;
    dn.criteria.push({
      criteriaNo: `C-${padded}`,
      detail: '',
      referenceId: ''
    });
  }

  deleteCriteria(dn: DecisionNode, cIndex: number): void {
    dn.criteria.splice(cIndex, 1);
  }

  // Save Activity Diagram
  saveActivityItem(): void {
    if (!this.selectedDiagramForEdit || !this.selectedDiagramForEdit.activityName.trim()) {
      alert('กรุณากรอก Activity Name');
      return;
    }

    const payload = this.selectedDiagramForEdit;
    this.isSaving = true;

    this.backendApi.saveActivityDiagram(this.projectId, payload, this.token).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          if (res['id']) {
            payload.id = res['id'];
          }
          if (this.isEditMode) {
            const idx = this.activityDiagrams.findIndex((item) => item.activityId === payload.activityId || item.id === payload.id);
            if (idx !== -1) {
              this.activityDiagrams[idx] = { ...payload };
            }
          } else {
            this.activityDiagrams.push({ ...payload });
          }
          this.cdr.detectChanges();
          this.closeAddModal();
        } else {
          alert(res.message || 'Failed to save activity diagram');
        }
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Failed to save activity diagram');
        this.cdr.detectChanges();
        this.closeAddModal();
      }
    });
  }


}
