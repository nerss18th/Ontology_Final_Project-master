import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  public useCaseDiagramImage = 'ex-diagram.png';
  public isAddModalOpen = false;

  public newUseCase: UseCase = {
    id: 'UC-02',
    type: 'Use Case',
    caption: '',
    description: '',
  };

  public useCases: UseCase[] = [
    {
      id: 'UC-01',
      type: 'Actor',
      caption: 'Actor',
      description: 'Example Actor',
    },
  ];

  ngOnInit(): void {
    const savedUseCaseImg = localStorage.getItem('use_case_diagram_image');
    if (savedUseCaseImg) {
      this.useCaseDiagramImage = savedUseCaseImg;
    }
  }

  openAddModal(): void {
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

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  saveUseCase(): void {
    if (!this.newUseCase.caption.trim()) {
      return;
    }
    this.useCases.push({ ...this.newUseCase });
    this.closeAddModal();
  }

  deleteUseCase(id: string): void {
    this.useCases = this.useCases.filter((useCase) => useCase.id !== id);
  }
}
