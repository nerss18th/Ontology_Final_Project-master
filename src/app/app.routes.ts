import { Routes } from '@angular/router';
import { Home } from './page/home/home';
import { Signup } from './page/signup/signup';
import { Login } from './page/login/login';
import { Promotion } from './page/promotion/promotion';
import { Dashboard } from './page/dashboard/dashboard';
import { ProjectDetail } from './page/project-detail/project-detail';
import { DiagramEditor } from './page/diagram-editor/diagram-editor';
import { UseCaseForm } from './page/use-case-form/use-case-form';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'promotion', component: Promotion },
  { path: 'dashboard', component: Dashboard },
  { path: 'dashboard/project/1/edit', component: DiagramEditor },
  { path: 'dashboard/project/1/use-case/add', component: UseCaseForm },
  { path: 'dashboard/project/1/use-case/edit', component: UseCaseForm },
  { path: 'dashboard/project/1', component: ProjectDetail },
];
