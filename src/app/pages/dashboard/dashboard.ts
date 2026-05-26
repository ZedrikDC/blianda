import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  totalInventory = 0;
  expiringSoon = 0;
  expiredItems = 0;
  priorityBatches: any[] = [];

 
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
   
    this.apiService.getInventory().subscribe({
      next: (data) => {
        const hoy = new Date();

        
        const processedData = data.map((item: any) => {
          const expDate = new Date(item.expiry);
          const diffTime = expDate.getTime() - hoy.getTime();
          item.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return item;
        });

       
        this.totalInventory = processedData.length;
        this.expiredItems = processedData.filter((item: any) => item.daysLeft < 0).length;
        this.expiringSoon = processedData.filter((item: any) => item.daysLeft >= 0 && item.daysLeft <= 7).length;

       
        this.priorityBatches = processedData.filter((item: any) => item.daysLeft <= 7);

       
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar el dashboard:', error);
      }
    });
  }
}