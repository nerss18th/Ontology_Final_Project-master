import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { BackendApiService } from '../../services/backend-api.service';

declare var vis: any;

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit, OnChanges {
  @Input() projectId!: any;
  @Input() projectName: string = 'Project 1';
  @Input() projectDetail: string = 'Example System';
  @Output() navigateSection = new EventEmitter<string>();

  public useCases: any[] = [];
  public classes: any[] = [];
  public activityDiagrams: any[] = [];
  public isLoading = true;

  // Semantic Data
  public ontologyGraph: any[] = [];
  public validationIssues: any[] = [];
  public traceabilityMatrix: any[] = [];
  public semanticStats = { fullyRealized: 0, warnings: 0 };

  constructor(
    private authService: AuthService,
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange && this.projectId) {
      this.loadData();
    }
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
      if (loadedCount === 5) { // Updated to 5
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    };

    // Ontology Data
    this.backendApi.getOntologyExport(this.projectId, token).subscribe({
      next: (res) => {
        if (res['@graph']) {
          this.ontologyGraph = res['@graph'];
          this.buildTraceabilityMatrix();
          setTimeout(() => this.initVisGraph(), 500);
        }
        checkDone();
      },
      error: () => checkDone()
    });

    // Validation Issues
    this.backendApi.getOntologyValidate(this.projectId, token).subscribe({
      next: (res) => {
        if (res.success && res.issues) {
          this.validationIssues = res.issues.map((issue: any) => {
            let el = issue.element || '';
            let msg = issue.message || '';

            // 1. เปลี่ยน se:realizes ให้เป็น reference
            msg = msg.replace(/se:realizes/g, 'reference');
            
            // 2. ลบ prefix (เช่น project1:, se:) ออกจากรหัส
            // โดยหาคำที่มีตัวอักษร/ตัวเลข/ขีดล่าง/ขีดกลาง นำหน้าและตามด้วย : 
            el = el.replace(/[\w]+:([A-Za-z0-9_-]+)/g, '$1');
            msg = msg.replace(/[\w]+:([A-Za-z0-9_-]+)/g, '$1');

            // 3. ปรับรูปประโยค "อ้างอิงไปยัง reference ที่ไม่มีอยู่จริง: UC-01" เป็น "อ้างอิงไปยัง UC-01 ที่ไม่มีอยู่จริง"
            msg = msg.replace(/อ้างอิงไปยัง reference ที่ไม่มีอยู่จริง:\s*(.+)/g, 'อ้างอิงไปยัง $1 ที่ไม่มีอยู่จริง');

            return {
              ...issue,
              element: el,
              message: msg
            };
          });
          this.semanticStats.warnings = this.validationIssues.length;
        }
        checkDone();
      },
      error: () => checkDone()
    });

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

  buildTraceabilityMatrix(): void {
    const useCases = this.ontologyGraph.filter(n => n['@type'] === 'se:UseCase');
    const classes = this.ontologyGraph.filter(n => n['@type'] === 'se:Class');
    const activities = this.ontologyGraph.filter(n => n['@type'] === 'se:ActivityDiagram');
    


    this.traceabilityMatrix = [];

    const formatNode = (node: any) => {
      const id = node['@id'].split(':').pop();
      const label = node['rdfs:label'] || '';
      const typeLabel = node['@type'] === 'se:UseCase' ? '[UC]' : node['@type'] === 'se:Class' ? '[Class]' : '[Activity]';
      return `${typeLabel} ${id} ${label}`.trim();
    };

    // 1. Process Use Cases
    useCases.forEach(uc => {
      const ucId = uc['@id'];
      const isRelated = (entity: any, targetId: string) => {
        const rel = entity['se:realizes'];
        if (!rel) return false;
        if (Array.isArray(rel)) return rel.some((r: any) => r['@id'] === targetId);
        return rel['@id'] === targetId;
      };

      const relatedClasses = classes.filter(c => isRelated(c, ucId));
      const relatedActivities = activities.filter(a => isRelated(a, ucId));
      
      let status = 'Valid';
      
      const allRelated = [...relatedClasses, ...relatedActivities];

      this.traceabilityMatrix.push({
        idCol: formatNode(uc),
        refToCol: '-', // Use Cases are targeted, they don't refer to others in this relation
        refByCol: allRelated.length > 0 ? allRelated.map(n => formatNode(n)).join(', ') : '-',
        statusCol: status,
        type: 'use-case'
      });
    });

    const processEntity = (entity: any) => {
      const realizesUc = entity['se:realizes'];
      let targets: string[] = [];
      let hasMissing = false;
      let hasValid = false;

      if (realizesUc) {
        const relArray = Array.isArray(realizesUc) ? realizesUc : [realizesUc];
        relArray.forEach((rel: any) => {
          const targetUc = useCases.find(uc => uc['@id'] === rel['@id']);
          if (targetUc) {
            targets.push(formatNode(targetUc));
            hasValid = true;
          }
          else {
            targets.push(`<span class="text-danger fw-bold">[Missing] ${rel['@id'].split(':').pop()}</span>`);
            hasMissing = true;
          }
        });
      }
      let rowType = 'use-case';
      if (entity['@type'] === 'se:Class') rowType = 'class';
      if (entity['@type'] === 'se:ActivityDiagram') rowType = 'activity';
      
      this.traceabilityMatrix.push({
        idCol: formatNode(entity),
        refToCol: targets.length > 0 ? targets.join(', ') : '-',
        refByCol: '-', // Classes/Activities point to UCs, they aren't targeted
        // ตรวจสอบว่ามี Missing target ไหม หรือถ้าไม่ได้ ref ใครเลย ก็เป็น Valid/Missing ขึ้นอยู่กับ requirement
        // เดิมคือ targets.length > 0 ? 'Valid' : 'Missing'
        statusCol: hasMissing ? 'Missing' : (targets.length > 0 ? 'Valid' : 'Missing'),
        // กำหนด Type ของแต่ละแถวเพื่อใช้เป็น Link สำหรับ Navigate ไปยังหน้า Diagram อื่นๆ
        type: rowType
      });
    };

    // 2. Process Classes
    classes.forEach(processEntity);

    // 3. Process Activities
    activities.forEach(processEntity);
    
    this.semanticStats.fullyRealized = this.traceabilityMatrix.filter(r => r.statusCol === 'Valid').length;
  }

  initVisGraph(): void {
    const container = document.getElementById('semantic-network');
    if (!container || typeof vis === 'undefined' || this.ontologyGraph.length === 0) return;

    const nodes: any[] = [
      // โหนดหลัก "Ontology" ที่เป็นศูนย์กลางของทุก Diagram
      { id: 'MASTER_ONTOLOGY', label: 'Ontology', color: '#ff7f50', shape: 'circle', font: { size: 24, bold: true, color: '#ffffff' }, title: 'Ontology Root' },
      { id: 'GROUP_UC', label: 'UC\nDiagram', color: '#7BE141', shape: 'circle', font: { size: 16, bold: true }, title: 'Use Case Diagram (Group)' },
      { id: 'GROUP_CL', label: 'CL\nDiagram', color: '#97C2FC', shape: 'circle', font: { size: 16, bold: true }, title: 'Class Diagram (Group)' },
      { id: 'GROUP_AC', label: 'AC\nDiagram', color: '#FFC107', shape: 'circle', font: { size: 16, bold: true }, title: 'Activity Diagram (Group)' }
    ];
    const edges: any[] = [
      // เชื่อมโยงแต่ละ Diagram เข้ากับโหนดศูนย์กลาง MASTER_ONTOLOGY
      { from: 'GROUP_UC', to: 'MASTER_ONTOLOGY', color: { color: '#ff7f50' }, dashes: true, width: 2 },
      { from: 'GROUP_CL', to: 'MASTER_ONTOLOGY', color: { color: '#ff7f50' }, dashes: true, width: 2 },
      { from: 'GROUP_AC', to: 'MASTER_ONTOLOGY', color: { color: '#ff7f50' }, dashes: true, width: 2 }
    ];

    this.ontologyGraph.forEach(node => {
      if (['se:UseCase', 'se:Class', 'se:ActivityDiagram'].includes(node['@type'])) {
        let color = '#97C2FC'; // default blue (Class)
        let shape = 'circle';
        let groupNodeId = 'GROUP_CL';
        
        if (node['@type'] === 'se:UseCase') { 
          color = '#7BE141'; 
          shape = 'circle'; 
          groupNodeId = 'GROUP_UC';
        } // green
        
        if (node['@type'] === 'se:ActivityDiagram') { 
          color = '#FFC107'; 
          shape = 'circle'; 
          groupNodeId = 'GROUP_AC';
        } // yellow
        
        const shortId = node['@id'].split(':').pop();
        const labelName = node['rdfs:label'] || '';
        
        const typeName = node['@type'].split(':').pop();

        nodes.push({
          id: node['@id'],
          label: shortId,
          color: color,
          shape: shape,
          title: `ID: ${shortId}\nName: ${labelName || '-'}\nType: ${typeName}`
        });

        if (node['se:realizes']) {
          const relArray = Array.isArray(node['se:realizes']) ? node['se:realizes'] : [node['se:realizes']];
          relArray.forEach((rel: any) => {
            edges.push({
              from: node['@id'],
              to: rel['@id'],
              label: 'references',
              arrows: 'to',
              font: { align: 'middle' },
              color: { color: '#000000' }
            });
          });
        }
        
        // Connect to its group node
        edges.push({
          from: node['@id'],
          to: groupNodeId,
          arrows: '',
          color: { color: '#aaaaaa' },
          dashes: true,
          label: 'isA',
          font: { size: 10, align: 'middle', color: '#888888' }
        });
      }
    });

    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options = {
      // ล็อค randomSeed ให้ค่าคงที่ เพื่อให้ทุกครั้งที่เปิดมากราฟจะอยู่ที่เดิม ไม่สลับซ้ายขวาไปมา
      layout: { randomSeed: 1337 }, 
      physics: { 
        solver: 'barnesHut',
        barnesHut: {
          springLength: 150, // ลดความยาวของเส้นลงให้พอดี
          nodeDistance: 120, // ลดระยะห่างผลักกันของแต่ละ node
          avoidOverlap: 0.1
        },
        // สั่งให้คำนวณ Physics ในฉากหลังให้เสร็จสมบูรณ์ก่อนที่จะเรนเดอร์กราฟออกมา เพื่อให้กราฟนิ่งตั้งแต่เริ่มต้น
        stabilization: { enabled: true, iterations: 200 } 
      },
      edges: { 
        color: '#000000', 
        smooth: false,
        font: { 
          background: 'white', // ใส่พื้นหลังให้ตัวอักษรเพื่อไม่ให้เส้นตัดทับข้อความ
          strokeWidth: 0
        }
      } 
    };

    new vis.Network(container, data, options);
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
