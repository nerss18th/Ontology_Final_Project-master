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
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/),
    ]),
  });
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      const { email, password, name } = this.signupForm.value;

      this.authService.signUp(email!, password!, name!).subscribe({
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
          this.errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
          console.error('Signup error:', err);
          this.cdr.detectChanges();
        },
      });
    }
  }
}
