import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  signupForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^[a-zA-Z0-9]+$/),
    ]),
    name: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/),
    ]),
    otp: new FormControl(''),
  });
  isLoading = false;
  isSendingOtp = false;
  otpSent = false;
  verificationToken: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  sendOtp() {
    const emailControl = this.signupForm.get('email');
    if (emailControl?.valid && emailControl.value) {
      this.isSendingOtp = true;
      this.errorMessage = null;
      this.cdr.detectChanges();

      this.authService.sendOtp(emailControl.value).subscribe({
        next: (res) => {
          this.isSendingOtp = false;
          if (res.success && res.verificationToken) {
            this.otpSent = true;
            this.verificationToken = res.verificationToken;
            
            // เพิ่ม Validator ให้กับฟิลด์ OTP
            const otpControl = this.signupForm.get('otp');
            otpControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{6}$/)]);
            otpControl?.updateValueAndValidity();
          } else {
            this.errorMessage = res.message || 'เกิดข้อผิดพลาดในการส่ง OTP';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSendingOtp = false;
          this.errorMessage = err.error?.error || err.error?.message || 'เกิดข้อผิดพลาดในการส่ง OTP';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSubmit() {
    if (this.signupForm.valid) {
      if (!this.otpSent || !this.verificationToken) {
        this.errorMessage = 'กรุณาส่งและยืนยัน OTP ก่อนทำการสมัครสมาชิก';
        return;
      }

      this.isLoading = true;
      this.errorMessage = null;
      const { email, password, username, name, otp } = this.signupForm.value;

      // ตรวจสอบ OTP ก่อนสมัครสมาชิก
      this.authService.verifyOtp(this.verificationToken, otp!).subscribe({
        next: (verifyRes) => {
          if (verifyRes.success) {
            // ถ้ายืนยัน OTP สำเร็จ ให้ทำการสมัครสมาชิกต่อ
            this.authService.signUp(email!, password!, name!, username!).subscribe({
              next: (res) => {
                this.isLoading = false;
                if (res.success) {
                  console.log('Signup success:', res.message);
                  this.router.navigate(['/promotion']);
                } else {
                  this.errorMessage = res.message;
                }
                this.cdr.detectChanges();
              },
              error: (err) => {
                this.isLoading = false;
                if (err.error && err.error.message) {
                  this.errorMessage = err.error.message;
                } else {
                  this.errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
                }
                this.cdr.detectChanges();
              },
            });
          } else {
            // กรณียืนยัน OTP ไม่สำเร็จ
            this.isLoading = false;
            this.errorMessage = verifyRes.message || 'รหัส OTP ไม่ถูกต้อง';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'ตรวจสอบ OTP ไม่สำเร็จ';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
