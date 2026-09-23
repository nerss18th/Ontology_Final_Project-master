import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="d-flex min-vh-100 bg-light">
      <!-- Sidebar -->
      <div class="bg-dark text-white p-3 shadow" style="width: 250px; position: fixed; top: 0; bottom: 0; left: 0; z-index: 1000; padding-top: 80px !important;">
        <h5 class="mb-4 text-center text-white-50 fw-bold">ADMIN PANEL</h5>
        <ul class="nav flex-column gap-2">
          <li class="nav-item">
            <a class="nav-link text-white rounded d-flex align-items-center gap-2" 
               routerLink="/dashboard" [queryParams]="{tab: 'profile'}">
              <span class="material-symbols-outlined">person</span> My Profile
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link text-white rounded d-flex align-items-center gap-2" 
               routerLink="/admin/users" routerLinkActive="bg-primary">
              <span class="material-symbols-outlined">group</span> User Management
            </a>
          </li>
        </ul>
      </div>

      <!-- Main Content -->
      <div class="flex-grow-1" style="margin-left: 250px; padding-top: 70px;">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class AdminDashboard {}
