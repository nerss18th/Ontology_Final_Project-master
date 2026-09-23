import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  icon: string;
}

@Component({
  selector: 'app-promotion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promotion.html',
  styleUrl: './promotion.css',
})
export class Promotion {
  plans: Plan[] = [
    {
      id: 'free',
      name: 'STANDARD',
      price: 'Free',
      period: 'forever',
      description: '',
      features: [
        'Up to 1 Active Project',
        'Standard export options (PDF)',
      ],
      icon: 'architecture',
    },
    {
      id: 'Pro',
      name: 'Professional',
      price: '149 Bahts',
      period: 'per month',
      description: '',
      features: [
        'Unlimited active Project',
        'Pro export options (PDF, Docs)',
        'Team Management (Add Member)'
      ],
      isPopular: false,
      icon: 'workspace_premium',
    },
  ];

  selectedPlanId = 'Pro';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  selectPlan(planId: string) {
    this.selectedPlanId = planId;
  }

  onContinue() {
    console.log('Selected plan:', this.selectedPlanId);
    this.authService.updateUserPlan(this.selectedPlanId).subscribe({
      next: () => {
        this.router.navigate(['/dashboard'], { queryParams: { tab: 'profile' } });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save plan:', err);
        this.router.navigate(['/dashboard'], { queryParams: { tab: 'profile' } });
        this.cdr.detectChanges();
      },
    });
  }
}
