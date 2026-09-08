import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview {
  @Input() projectName: string = 'Project 1';
  @Input() projectDetail: string = 'Example System';
  @Output() navigateSection = new EventEmitter<string>();

  public stats = [
    { title: 'Total Diagrams', count: 2, icon: 'account_tree', color: 'primary' },
    { title: 'Use Cases', count: 1, icon: 'description', color: 'success' },
    { title: 'Classes', count: 3, icon: 'schema', color: 'info' },
    { title: 'Team Members', count: 1, icon: 'group', color: 'warning' },
  ];

  goToSection(section: string): void {
    this.navigateSection.emit(section);
  }
}
