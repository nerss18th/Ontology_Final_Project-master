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

    if (!file.type.startsWith('image/')) {
      this.receiptUploadError = 'ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น (JPG, PNG, GIF, WebP)';
      this.selectedReceiptFile = null;
      this.selectedReceiptPreview = null;
      event.target.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.receiptUploadError = 'ขนาดไฟล์เกิน 10 MB กรุณาเลือกไฟล์ใหม่';
      this.selectedReceiptFile = null;
      this.selectedReceiptPreview = null;
      event.target.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.receiptUploadError = '';
    this.selectedReceiptFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedReceiptPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  confirmReceiptUpload() {
    if (!this.selectedReceiptFile || this.isUploadingReceipt) return;

    if (!this.selectedReceiptFile.type.startsWith('image/')) {
      this.receiptUploadError = 'ไฟล์หลักฐานต้องเป็นรูปภาพเท่านั้น';
      return;
    }

    this.isUploadingReceipt = true;
    this.receiptUploadError = '';

    // อัปโหลดสลิป
    this.authService.uploadReceipt(this.selectedReceiptFile).subscribe({
      next: (uploadRes) => {
        if (!uploadRes.success) {
          this.isUploadingReceipt = false;
          this.receiptUploadError = uploadRes.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป';
          this.cdr.detectChanges();
          return;
        }
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
