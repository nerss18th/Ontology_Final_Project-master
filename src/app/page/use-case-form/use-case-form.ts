import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-use-case-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './use-case-form.html',
  styleUrl: './use-case-form.css',
})
export class UseCaseForm {
  public useCaseId = 'UC-001';
  public useCaseType = 'system';
  public useCaseName = 'User Authentication and Login Flow';
  public description = 'The process by which a user verifies their identity to gain access to protected areas of the system. This includes credential entry, multi-factor verification, and session management initialization.';

  constructor(private router: Router) {}

  get isEditMode(): boolean {
    return this.router.url.endsWith('/use-case/edit');
  }

  cancel(): void {
    this.router.navigate(['/dashboard/project/1']);
  }

  addUseCase(): void {
    this.router.navigate(['/dashboard/project/1']);
  }
}
