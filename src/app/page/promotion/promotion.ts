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
      description: 'Ideal for individuals starting out with diagram design.',
      features: [
        'Up to 3 active diagrams',
        'Standard export options (PNG, PDF)',
        'Basic sharing links',
        'Community support',
      ],
      icon: 'architecture',
    },
    {
      id: 'Pro',
      name: 'Professional',
      price: '149 Bahts',
      period: 'per month',
      description: 'Perfect for professionals and freelancers needing advanced tools.',
      features: [
        'Unlimited active diagrams',
        'High-resolution exports (SVG, PDF, HTML)',
        'Real-time collaborative editing',
        'Priority customer support',
        'Custom template builder',
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
  ) {}

  selectPlan(planId: string) {
    this.selectedPlanId = planId;
  }

  onContinue() {
    console.log('Selected plan:', this.selectedPlanId);
    this.authService.updateUserPlan(this.selectedPlanId).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save plan:', err);
        this.router.navigate(['/dashboard']);
        this.cdr.detectChanges();
      },
    });
  }
}
