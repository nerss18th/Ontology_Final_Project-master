import { Routes } from '@angular/router';
import { Home } from './page/home/home';
import { Signup } from './page/signup/signup';
import { Login } from './page/login/login';
import { Promotion } from './page/promotion/promotion';
import { Dashboard } from './page/dashboard/dashboard';
import { ProjectDetail } from './page/project-detail/project-detail';
import { DiagramEditor } from './page/diagram-editor/diagram-editor';
import { AdminDashboard } from './page/admin/admin-dashboard/admin-dashboard';
import { AdminUsers } from './page/admin/admin-users/admin-users';
import { adminGuard } from './services/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'promotion', component: Promotion },
  { path: 'dashboard', component: Dashboard },
  { path: 'dashboard/project/:id/edit', component: DiagramEditor },
  { path: 'dashboard/project/:id', component: ProjectDetail },
  { 
    path: 'admin', 
    component: AdminDashboard, 
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: AdminUsers },
      { path: 'users/:id/projects', loadComponent: () => import('./page/admin/admin-user-projects/admin-user-projects').then(m => m.AdminUserProjects) }
    ]
  },
];
