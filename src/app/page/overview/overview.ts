import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
export class Overview implements OnInit, OnChanges, OnDestroy {
  @Input() projectId!: any;
  @Input() projectName: string = 'Project 1';
  @Input() projectDetail: string = 'Example System';
  @Output() navigateSection = new EventEmitter<string>();

  public useCases: any[] = [];
  public classes: any[] = [];
  public activityDiagrams: any[] = [];
  public isLoading = true;
  public hasSavedPositions = false;

  // Semantic Data
  public ontologyGraph: any[] = [];
  public validationIssues: any[] = [];
  public traceabilityMatrix: any[] = [];
  public semanticStats = { fullyRealized: 0, warnings: 0 };

  // Edge click info panel
  public selectedEdgeInfo: { label: string; from: string; to: string; color: string } | null = null;

  // Node click info panel
  public selectedNodeInfo: { id: string; name: string; type: string; typeColor: string; typeLabel: string; description?: string } | null = null;

  // vis.Network instance
  public network: any = null;

  // Diagram References filter tab
  public selectedRefDiagram: 'all' | 'use-case' | 'class' | 'activity' = 'all';

  get useCaseTraceList(): any[] {
    return this.traceabilityMatrix.filter(r => r.type === 'use-case');
  }

  get classTraceList(): any[] {
    return this.traceabilityMatrix.filter(r => r.type === 'class');
  }

  get activityTraceList(): any[] {
    return this.traceabilityMatrix.filter(r => r.type === 'activity');
  }



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
    if (this.projectId) {
      const savedStr = localStorage.getItem(`ontology_graph_positions_${this.projectId}`);
      this.hasSavedPositions = !!(savedStr && savedStr.length > 2);
    }
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
      return `${id} ${label}`.trim();
    };

    const formatNodeLink = (node: any) => {
      const id = node['@id'].split(':').pop();
      const label = node['rdfs:label'] || '';
      const text = `${id} ${label}`.trim();
      let section = 'use-case';
      if (node['@type'] === 'se:Class') {
        section = 'class';
      } else if (node['@type'] === 'se:ActivityDiagram') {
        section = 'activity';
      }
      return `<a href="/dashboard/project/${this.projectId}?section=${section}" target="_blank" rel="noopener noreferrer" class="text-dark text-decoration-underline fw-semibold" style="color: #000000 !important;">${text}</a>`;
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
        refByCol: allRelated.length > 0 ? allRelated.map(n => formatNodeLink(n)).join(', ') : '-',
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
            targets.push(formatNodeLink(targetUc));
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
      
      let extendsCol = '-';
      let implementsCol = '-';

      if (entity['@type'] === 'se:Class') {
        // Extends
        if (entity['se:extends']) {
          const extArray = Array.isArray(entity['se:extends']) ? entity['se:extends'] : [entity['se:extends']];
          const extList = extArray.map((ext: any) => {
            const targetCls = classes.find(c => c['@id'] === ext['@id']);
            if (targetCls) return formatNodeLink(targetCls);
            const short = ext['@id'].split(':').pop();
            const fallback = this.classes.find(c => c.class_id === short || c.id === short);
            if (fallback) {
              const text = `${short} ${fallback.class_name || ''}`.trim();
              return `<a href="/dashboard/project/${this.projectId}?section=class" target="_blank" rel="noopener noreferrer" class="text-dark text-decoration-underline fw-semibold" style="color: #000000 !important;">${text}</a>`;
            }
            return `<span class="text-danger fw-bold">[Missing] ${short}</span>`;
          });
          if (extList.length > 0) extendsCol = extList.join(', ');
        }

        // Implements
        if (entity['se:implementsInterface']) {
          const implArray = Array.isArray(entity['se:implementsInterface'])
            ? entity['se:implementsInterface']
            : [entity['se:implementsInterface']];
          const implList = implArray.map((impl: any) => {
            const targetCls = classes.find(c => c['@id'] === impl['@id']);
            if (targetCls) return formatNodeLink(targetCls);
            const short = impl['@id'].split(':').pop();
            const fallback = this.classes.find(c => c.class_id === short || c.id === short);
            if (fallback) {
              const text = `${short} ${fallback.class_name || ''}`.trim();
              return `<a href="/dashboard/project/${this.projectId}?section=class" target="_blank" rel="noopener noreferrer" class="text-dark text-decoration-underline fw-semibold" style="color: #000000 !important;">${text}</a>`;
            }
            return `<span class="text-danger fw-bold">[Missing] ${short}</span>`;
          });
          if (implList.length > 0) implementsCol = implList.join(', ');
        }

        // Fallback ไปยัง this.classes
        const classObj = this.classes.find(c => c.id === entity['@id'].split(':').pop() || c.class_id === entity['@id'].split(':').pop());
        if (extendsCol === '-' && classObj && classObj.extendToClass && classObj.extendToClass !== 'None') {
          const text = `${classObj.extendToClassId ? classObj.extendToClassId + ' ' : ''}${classObj.extendToClass}`.trim();
          extendsCol = `<a href="/dashboard/project/${this.projectId}?section=class" target="_blank" rel="noopener noreferrer" class="text-dark text-decoration-underline fw-semibold" style="color: #000000 !important;">${text}</a>`;
        }
        if (implementsCol === '-' && classObj && classObj.implementsInterfaces && classObj.implementsInterfaces.length > 0) {
          implementsCol = classObj.implementsInterfaces.map((i: any) => {
            const text = `${i.classId ? i.classId + ' ' : ''}${i.className}`.trim();
            return `<a href="/dashboard/project/${this.projectId}?section=class" target="_blank" rel="noopener noreferrer" class="text-dark text-decoration-underline fw-semibold" style="color: #000000 !important;">${text}</a>`;
          }).join(', ');
        }
      }

      this.traceabilityMatrix.push({
        idCol: formatNode(entity),
        refToCol: targets.length > 0 ? targets.join(', ') : '-',
        refByCol: '-',
        extendsCol: extendsCol,
        implementsCol: implementsCol,
        statusCol: hasMissing ? 'Missing' : (hasValid ? 'Valid' : 'Missing'),
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

    if (this.network) {
      this.network.destroy();
      this.network = null;
    }

    // ตรวจสอบพิกัดของโหนดที่เคยบันทึกไว้ใน localStorage
    let savedPositions: { [nodeId: string]: { x: number; y: number } } | null = null;
    const storageKey = `ontology_graph_positions_${this.projectId}`;
    const savedStr = localStorage.getItem(storageKey);
    if (savedStr) {
      try {
        savedPositions = JSON.parse(savedStr);
      } catch (e) {
        console.error('Failed to parse saved graph positions', e);
      }
    }
    this.hasSavedPositions = !!(savedPositions && Object.keys(savedPositions).length > 0);

    const getPos = (id: string, defaultX: number, defaultY: number) => {
      if (savedPositions && savedPositions[id]) {
        return { x: savedPositions[id].x, y: savedPositions[id].y };
      }
      return { x: defaultX, y: defaultY };
    };

    const posMaster = getPos('MASTER_ONTOLOGY', 0, 0);
    const posUC = getPos('GROUP_UC', 285, -210);
    const posCL = getPos('GROUP_CL', -285, -210);
    const posAC = getPos('GROUP_AC', 0, 340);

    const nodes: any[] = [
      // โหนดหลัก "Ontology" ที่เป็นศูนย์กลางของทุก Diagram (ตรึงไว้ที่จุดกึ่งกลาง + mass สูงเพื่อผลักไม่ให้โหนดอื่นลอยมาทับ)
      { id: 'MASTER_ONTOLOGY', label: 'Ontology', color: '#ff7f50', shape: 'circle', font: { size: 24, bold: true, color: '#ffffff' }, title: 'Ontology Root', x: posMaster.x, y: posMaster.y, fixed: true, mass: 6 },
      // กลุ่ม Use Case อยู่ขวาบน (ลดระยะลง 25%)
      { id: 'GROUP_UC', label: 'UC\nDiagram', color: '#7BE141', shape: 'circle', font: { size: 16, bold: true }, title: 'Use Case Diagram (Group)', x: posUC.x, y: posUC.y, fixed: true, mass: 3 },
      // กลุ่ม Class อยู่ซ้ายบน (ลดระยะลง 25%)
      { id: 'GROUP_CL', label: 'CL\nDiagram', color: '#97C2FC', shape: 'circle', font: { size: 16, bold: true }, title: 'Class Diagram (Group)', x: posCL.x, y: posCL.y, fixed: true, mass: 3 },
      // กลุ่ม Activity Diagram อยู่ด้านล่าง (ลดระยะลง 25%)
      { id: 'GROUP_AC', label: 'AC\nDiagram', color: '#FFC107', shape: 'circle', font: { size: 16, bold: true }, title: 'Activity Diagram (Group)', x: posAC.x, y: posAC.y, fixed: true, mass: 3 }
    ];
    const edges: any[] = [
      // เชื่อมโยงแต่ละ Diagram เข้ากับโหนดศูนย์กลาง MASTER_ONTOLOGY (ลดความยาวเส้นลง 25% เหลือ 340)
      { from: 'GROUP_UC', to: 'MASTER_ONTOLOGY', color: { color: '#ff7f50', hover: '#b83b0a', highlight: '#b83b0a' }, dashes: true, width: 2, length: 340 },
      { from: 'GROUP_CL', to: 'MASTER_ONTOLOGY', color: { color: '#ff7f50', hover: '#b83b0a', highlight: '#b83b0a' }, dashes: true, width: 2, length: 340 },
      { from: 'GROUP_AC', to: 'MASTER_ONTOLOGY', color: { color: '#ff7f50', hover: '#b83b0a', highlight: '#b83b0a' }, dashes: true, width: 2, length: 340 }
    ];

    this.ontologyGraph.forEach(node => {
      if (['se:UseCase', 'se:Class', 'se:ActivityDiagram'].includes(node['@type'])) {
        let color = '#97C2FC'; // default blue (Class)
        let shape = 'circle';
        let groupNodeId = 'GROUP_CL';
        
        // กำหนดพิกัดเริ่มต้นให้อยู่โซนด้านนอกของแต่ละกลุ่ม เพื่อไม่ให้โหนดลอยเข้ามาทับเส้นแกนกลาง Ontology
        let initX = 0;
        let initY = 0;
        if (node['@type'] === 'se:Class') {
          initX = -380 - (Math.random() * 80);
          initY = -260 - (Math.random() * 80);
        }
        
        if (node['@type'] === 'se:UseCase') { 
          color = '#7BE141'; 
          shape = 'circle'; 
          groupNodeId = 'GROUP_UC';
          initX = 380 + (Math.random() * 80);
          initY = -260 - (Math.random() * 80);
        } // green
        
        if (node['@type'] === 'se:ActivityDiagram') { 
          color = '#FFC107'; 
          shape = 'circle'; 
          groupNodeId = 'GROUP_AC';
          initX = (Math.random() - 0.5) * 160;
          initY = 440 + (Math.random() * 80);
        } // yellow
        
        const shortId = node['@id'].split(':').pop();
        const labelName = node['rdfs:label'] || '';
        const typeName = node['@type'].split(':').pop();
        const nodePos = getPos(node['@id'], initX, initY);

        nodes.push({
          id: node['@id'],
          label: shortId,
          x: nodePos.x,
          y: nodePos.y,
          color: color,
          shape: shape,
          title: `ID: ${shortId}\nName: ${labelName || '-'}\nType: ${typeName}`,
          // เก็บข้อมูลเพิ่มเติมสำหรับ click panel
          nodeType: node['@type'],
          shortId: shortId,
          labelName: labelName,
          typeName: typeName,
          rawNode: node
        });

        // เส้น "references" (Class/Activity → UseCase)
        if (node['se:realizes']) {
          const relArray = Array.isArray(node['se:realizes']) ? node['se:realizes'] : [node['se:realizes']];
          relArray.forEach((rel: any) => {
            edges.push({
              id: `ref-${node['@id']}-${rel['@id']}`,
              from: node['@id'],
              to: rel['@id'],
              relLabel: 'references',
              arrows: 'to',
              color: { color: '#475569', hover: '#0f172a', highlight: '#0f172a' },
              width: 1.5
            });
          });
        }

        // เส้น "extends" (Class → Parent Class) — เส้นทึบสีม่วง ลูกศรกลวง
        if (node['@type'] === 'se:Class' && node['se:extends']) {
          edges.push({
            id: `ext-${node['@id']}`,
            from: node['@id'],
            to: node['se:extends']['@id'],
            relLabel: 'extends',
            arrows: { to: { enabled: true, type: 'triangle' } },
            color: { color: '#7B2FBE', hover: '#3B0764', highlight: '#3B0764' },
            dashes: false,
            width: 2
          });
        }

        // เส้น "implements" (Class → Interface) — เส้นประสีแดงส้ม ลูกศรกลวง
        if (node['@type'] === 'se:Class' && node['se:implementsInterface']) {
          const implArray = Array.isArray(node['se:implementsInterface'])
            ? node['se:implementsInterface']
            : [node['se:implementsInterface']];
          implArray.forEach((impl: any) => {
            edges.push({
              id: `impl-${node['@id']}-${impl['@id']}`,
              from: node['@id'],
              to: impl['@id'],
              relLabel: 'implements',
              arrows: { to: { enabled: true, type: 'triangle' } },
              color: { color: '#0891B2', hover: '#0e4e5e', highlight: '#0e4e5e' },
              dashes: [6, 3],
              width: 2
            });
          });
        }
        

        // Connect to its group node
        edges.push({
          id: `isA-${node['@id']}`,
          from: node['@id'],
          to: groupNodeId,
          relLabel: 'isA',
          arrows: '',
          color: { color: '#aaaaaa', hover: '#444444', highlight: '#444444' },
          dashes: true,
          length: 90
        });
      }
    });

    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options: any = {
      // ล็อค randomSeed ให้ค่าคงที่ เพื่อให้ทุกครั้งที่เปิดมากราฟจะอยู่ที่เดิม ไม่สลับซ้ายขวาไปมา
      layout: { randomSeed: 1337 },
      nodes: {
        chosen: {
          node: true,
          label: false // ไม่เปลี่ยนตัวอักษรเป็นตัวหนาเมื่อ hover หรือคลิกโหนด
        }
      },
      edges: {
        smooth: false,
        // ปิด label บน edge ทั้งหมด
        font: { size: 0 },
        selectionWidth: 3,
        hoverWidth: (width: number) => width + 1
      },
      interaction: {
        hover: true,
        selectConnectedEdges: false
      }
    };

    if (this.hasSavedPositions) {
      // เมื่อมีตำแหน่งที่บันทึกไว้ ให้ปิด physics ทันที เพื่อให้โหนดคงอยู่ที่พิกัดเดิมเป๊ะๆ โดยไม่ถูกแรง Physics ขยับ
      options.physics = { enabled: false };
    } else {
      options.physics = {
        solver: 'barnesHut',
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.01,
          springLength: 90,
          springConstant: 0.05,
          nodeDistance: 120,
          avoidOverlap: 1
        },
        // สั่งให้คำนวณ Physics ในฉากหลังให้เสร็จสมบูรณ์ก่อนที่จะเรนเดอร์กราฟออกมา เพื่อให้กราฟนิ่งตั้งแต่เริ่มต้น
        stabilization: { enabled: true, iterations: 250 }
      };
    }

    this.network = new vis.Network(container, data, options);

    if (!this.hasSavedPositions) {
      // ปิด Physics ทันทีหลังจากคำนวณตำแหน่งเริ่มต้นเสร็จ เพื่อไม่ให้มีแรงดึงดูดหรือสปริงเด้งเวลาลากขยับโหนด
      this.network.once('stabilizationIterationsDone', () => {
        this.network.setOptions({ physics: { enabled: false } });
      });
      this.network.once('stabilized', () => {
        this.network.setOptions({ physics: { enabled: false } });
      });
    }

    // บันทึกตำแหน่งของโหนดเมื่อผู้ใช้ลากย้ายตำแหน่งเสร็จ
    this.network.on('dragEnd', (params: any) => {
      if (params && params.nodes && params.nodes.length > 0) {
        const currentPositions = this.network.getPositions();
        if (currentPositions && this.projectId) {
          const sanitizedPositions: { [key: string]: { x: number; y: number } } = {};
          for (const key of Object.keys(currentPositions)) {
            sanitizedPositions[key] = {
              x: Math.round(currentPositions[key].x),
              y: Math.round(currentPositions[key].y)
            };
          }
          localStorage.setItem(`ontology_graph_positions_${this.projectId}`, JSON.stringify(sanitizedPositions));
          this.hasSavedPositions = true;
          this.cdr.detectChanges();
        }
      }
    });

    // ---- Click handler: Node หรือ Edge ----
    this.network.on('click', (params: any) => {
      // --- คลิ๊ก Node ---
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = nodes.find((n: any) => n.id === nodeId);
        // เปิด edge panel
        this.selectedEdgeInfo = null;

        if (!nodeData || !nodeData.nodeType) {
          // เป็น group hub / root ไม่ต้องแสดง detail
          this.selectedNodeInfo = null;
          this.cdr.detectChanges();
          return;
        }

        const typeColorMap: any = {
          'se:UseCase':        { color: '#15803D', label: 'Use Case' },
          'se:Class':          { color: '#1D4ED8', label: 'Class' },
          'se:ActivityDiagram':{ color: '#B45309', label: 'Activity' }
        };
        const typeInfo = typeColorMap[nodeData.nodeType] || { color: '#555', label: nodeData.typeName };

        // หา description จาก ontologyGraph หรือ data เพิ่มเติม
        const raw = nodeData.rawNode;
        const desc = raw['rdfs:comment'] || raw['se:description'] || '';

        this.selectedNodeInfo = {
          id:        nodeData.shortId,
          name:      nodeData.labelName || nodeData.shortId,
          type:      nodeData.nodeType,
          typeColor: typeInfo.color,
          typeLabel: typeInfo.label,
          description: desc
        };
        this.cdr.detectChanges();
        return;
      }

      // --- คลิ๊ก Edge ---
      if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edgeData = edges.find((e: any) => e.id === edgeId);
        if (!edgeData) return;
        // เปิด node panel
        this.selectedNodeInfo = null;

        const fromNode  = nodes.find((n: any) => n.id === edgeData.from);
        const toNode    = nodes.find((n: any) => n.id === edgeData.to);
        const fromLabel = fromNode?.label?.replace('\n', ' ') || edgeData.from;
        const toLabel   = toNode?.label?.replace('\n', ' ')   || edgeData.to;

        const relLabel = edgeData.relLabel || 'connected';
        const colorMap: any = {
          references:     '#1E293B',
          extends:        '#7B2FBE',
          implements:     '#0891B2',
          isA:            '#888888'
        };

        this.selectedEdgeInfo = {
          label: relLabel,
          from:  fromLabel,
          to:    toLabel,
          color: colorMap[relLabel] || '#555'
        };
        this.cdr.detectChanges();
        return;
      }

      // --- คลิ๊กที่ว่าง → ปิดทั้งคู่ ---
      this.selectedEdgeInfo = null;
      this.selectedNodeInfo = null;
      this.cdr.detectChanges();
    });
  }

  closeEdgeInfo(): void {
    this.selectedEdgeInfo = null;
  }

  closeNodeInfo(): void {
    this.selectedNodeInfo = null;
  }

  resetOntologyPosition(): void {
    if (!this.network) return;
    this.network.focus('MASTER_ONTOLOGY', {
      scale: 0.95,
      animation: {
        duration: 800,
        easingFunction: 'easeInOutQuad'
      }
    });
  }

  resetNodePositions(): void {
    if (!this.projectId) return;
    if (confirm('คุณต้องการรีเซ็ตตำแหน่งโหนดทั้งหมดของกราฟกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      localStorage.removeItem(`ontology_graph_positions_${this.projectId}`);
      this.hasSavedPositions = false;
      this.initVisGraph();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
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
