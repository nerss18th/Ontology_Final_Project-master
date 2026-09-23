import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-project-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sidebar.html',
  styleUrl: './project-sidebar.css',
})
export class ProjectSidebar {
  @Input() projectName: string = 'Project 1';
  @Input() activeSection: string = 'overview';
  @Input() isViewer: boolean = false;
  @Input() isEditMode: boolean = false;

  @Output() sectionChange = new EventEmitter<string>();
  @Output() editProjectClick = new EventEmitter<void>();

  onSelectSection(section: string): void {
    if (this.isEditMode && section !== this.activeSection) {
      return;
    }
    this.sectionChange.emit(section);
  }

  onOpenEditProject(): void {
    this.editProjectClick.emit();
  }
}
