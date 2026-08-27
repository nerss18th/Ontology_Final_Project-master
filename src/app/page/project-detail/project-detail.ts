import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface UseCase {
  id: string;
  name: string;
  actor: string;
  description: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail {
  public activeSection = 'use-case';
  public useCases: UseCase[] = [
    {
      id: 'UC-01',
      name: 'User Login',
      actor: 'Member',
      description: 'Allows registered users to access their accounts.',
    },
    {
      id: 'UC-02',
      name: 'Update Profile',
      actor: 'User',
      description: 'Enables users to modify their personal information.',
    },
    {
      id: 'UC-03',
      name: 'Reset Password',
      actor: 'User, System',
      description: "Sends a recovery link to the user's registered email.",
    },
  ];

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  deleteUseCase(id: string): void {
    this.useCases = this.useCases.filter((useCase) => useCase.id !== id);
  }
}
