import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-diagram-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './diagram-editor.html',
  styleUrl: './diagram-editor.css',
})
export class DiagramEditor {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  public fileName = 'use_case_v1.png';
  public lastModified = '2 mins ago';
  public previewUrl: string | null = null;
  public searchTerm = '';

  constructor(private router: Router) {}

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileName = file.name;
    this.lastModified = 'just now';
    this.previewUrl = URL.createObjectURL(file);
  }

  saveChanges(): void {
    this.router.navigate(['/dashboard/project/1']);
  }

  cancel(): void {
    this.router.navigate(['/dashboard/project/1']);
  }

  openFullScreen(): void {
    const preview = document.querySelector('.diagram-preview');
    if (preview instanceof HTMLElement) {
      preview.requestFullscreen?.();
    }
  }
}
