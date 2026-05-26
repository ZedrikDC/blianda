import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.html'
})
export class AlertsComponent implements OnInit {
  expiredItems: any[] = [];
  criticalItems: any[] = [];

  // Agregamos ChangeDetectorRef aquí también
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.apiService.getInventory().subscribe({
      next: (data) => {
        const hoy = new Date();

        const processedData = data.map((item: any) => {
          const expDate = new Date(item.expiry);
          const diffTime = expDate.getTime() - hoy.getTime();
          item.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return item;
        });

        this.expiredItems = processedData.filter((item: any) => item.daysLeft < 0);
        this.criticalItems = processedData.filter((item: any) => item.daysLeft >= 0 && item.daysLeft <= 7);

        // Forzamos a Angular a actualizar la vista de Inmediato
        this.cdr.detectChanges(); 
      }
    });
  }
}