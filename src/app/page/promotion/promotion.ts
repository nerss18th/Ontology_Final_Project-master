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

  // Receipt Modal State
  isReceiptModalOpen = false;
  selectedReceiptFile: File | null = null;
  selectedReceiptPreview: string | null = null;
  isUploadingReceipt = false;
  receiptUploadError = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  selectPlan(planId: string) {
    this.selectedPlanId = planId;
  }

  onContinue() {
    if (this.selectedPlanId === 'Pro') {
      // เปิด Modal ให้อัปโหลดสลิปก่อน
      this.openReceiptModal();
    } else {
      // Standard: อัปเดต plan แล้วไป dashboard เลย
      this.updatePlanAndNavigate();
    }
  }

  openReceiptModal() {
    this.selectedReceiptFile = null;
    this.selectedReceiptPreview = null;
    this.receiptUploadError = '';
    this.isReceiptModalOpen = true;
  }

  closeReceiptModal() {
    this.isReceiptModalOpen = false;
  }

  onReceiptFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.receiptUploadError = 'กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG, GIF, WebP) หรือ PDF เท่านั้น';
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.receiptUploadError = 'ขนาดไฟล์เกิน 10 MB กรุณาเลือกไฟล์ใหม่';
      event.target.value = '';
      return;
    }

    this.receiptUploadError = '';
    this.selectedReceiptFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedReceiptPreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      // PDF - show placeholder
      this.selectedReceiptPreview = null;
    }
  }

  confirmReceiptUpload() {
    if (!this.selectedReceiptFile || this.isUploadingReceipt) return;
    this.isUploadingReceipt = true;
    this.receiptUploadError = '';

    // อัปโหลดสลิปก่อน
    this.authService.uploadReceipt(this.selectedReceiptFile).subscribe({
      next: (uploadRes) => {
        // ไม่ว่าสลิปจะสำเร็จหรือไม่ ให้อัปเดต plan ต่อ
        this.updatePlanAndNavigate();
      },
      error: () => {
        this.isUploadingReceipt = false;
        this.receiptUploadError = 'เกิดข้อผิดพลาดในการอัปโหลดสลิป กรุณาลองใหม่';
        this.cdr.detectChanges();
      }
    });
  }

  skipReceiptUpload() {
    // ข้ามการอัปโหลดสลิป
    this.closeReceiptModal();
    this.updatePlanAndNavigate();
  }

  private updatePlanAndNavigate() {
    this.authService.updateUserPlan(this.selectedPlanId).subscribe({
      next: () => {
        this.isUploadingReceipt = false;
        this.closeReceiptModal();
        this.router.navigate(['/dashboard'], { queryParams: { tab: 'profile' } });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingReceipt = false;
        console.error('Failed to save plan:', err);
        this.closeReceiptModal();
        this.router.navigate(['/dashboard'], { queryParams: { tab: 'profile' } });
        this.cdr.detectChanges();
      },
    });
  }
}
