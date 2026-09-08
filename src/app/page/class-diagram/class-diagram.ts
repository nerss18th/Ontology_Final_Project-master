import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  type: string; // 'Class' | 'Abstract class' | 'Interface'
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
  public classDiagramImage = 'ex-class-diagram.png';
  public isAddClassModalOpen = false;
  public isViewClassModalOpen = false;
  public selectedClassDetail: ClassItem | null = null;

  public newClassItem: ClassItem = {
    id: 'CL-02',
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

  public classItems: ClassItem[] = [
    {
      id: 'CL-01',
      reference: 'REF-01',
      name: 'BaseEntity',
      type: 'Abstract class',
      description: 'Abstract base class for system entities',
      extendToClass: 'None',
      extendToClassId: '',
      implementsInterfaces: [],
      attributes: [
        {
          name: 'id',
          encapsulation: 'protected',
          dataType: 'String',
          dataSize: '36',
          description: 'Unique entity identifier',
          exampleFormat: 'UUID-v4',
        },
      ],
      methods: [
        {
          type: 'Method',
          encapsulation: 'public',
          name: 'getId',
          description: 'Returns the entity ID',
          returnValue: 'id',
          returnDataType: 'String',
          returnDescription: 'Entity ID',
          parameters: [],
        },
      ],
    },
    {
      id: 'CL-02',
      reference: 'REF-01',
      name: 'User',
      type: 'Class',
      description: 'System user representation',
      extendToClass: 'BaseEntity',
      extendToClassId: 'CL-01',
      implementsInterfaces: [
        { className: 'Authenticatable', classId: 'CL-03' },
      ],
      attributes: [
        {
          name: 'username',
          encapsulation: 'private',
          dataType: 'String',
          dataSize: '50',
          description: 'User login name',
          exampleFormat: 'john_doe',
        },
      ],
      methods: [
        {
          type: 'Method',
          encapsulation: 'public',
          name: 'login',
          description: 'Authenticates user credentials',
          returnValue: 'successStatus',
          returnDataType: 'boolean',
          returnDescription: 'True if login succeeded',
          parameters: [
            { name: 'password', dataType: 'String', description: 'User password' },
          ],
        },
      ],
    },
    {
      id: 'CL-03',
      reference: 'REF-02',
      name: 'Authenticatable',
      type: 'Interface',
      description: 'Interface for authentication contract',
      extendToClass: 'None',
      extendToClassId: '',
      implementsInterfaces: [],
      attributes: [],
      methods: [
        {
          type: 'Abstract Method',
          encapsulation: 'public',
          name: 'authenticate',
          description: 'Contract for authentication check',
          returnValue: 'result',
          returnDataType: 'boolean',
          returnDescription: 'Auth status',
          parameters: [
            { name: 'token', dataType: 'String', description: 'Auth token' },
          ],
        },
      ],
    },
  ];

  ngOnInit(): void {
    const savedClassImg = localStorage.getItem('class_diagram_image');
    if (savedClassImg) {
      this.classDiagramImage = savedClassImg;
    }
  }

  deleteClassItem(id: string): void {
    this.classItems = this.classItems.filter((item) => item.id !== id);
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
      encapsulation: 'public',
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
      return;
    }
    this.classItems.push(JSON.parse(JSON.stringify(this.newClassItem)));
    this.closeAddClassModal();
  }
}
