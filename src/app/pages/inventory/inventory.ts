import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './inventory.html'
})
export class InventoryComponent implements OnInit {
  totalItems = 0;
  criticalExpiry = 0;
  lowStock = 0;
  systemHealth = 100;
  
  allProducts: any[] = []; // <-- Lista Maestra 
  products: any[] = [];    // <-- Lista Visible (La que mostramos y filtramos)

  // Variables para los filtros
  searchTerm: string = '';
  statusFilter: string = 'TODOS';

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.apiService.getInventory().subscribe({
      next: (data) => {
        const hoy = new Date();

        const processedData = data.map((item: any) => {
          const expDate = new Date(item.expiry);
          const diffTime = expDate.getTime() - hoy.getTime();
          item.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (item.status === 'OK') item.statusTranslated = 'EN STOCK';
          else if (item.status === 'CRITICAL' || item.status === 'WARNING') item.statusTranslated = 'POR CADUCAR';
          else if (item.status === 'EXPIRED') item.statusTranslated = 'CADUCADO';
          else item.statusTranslated = item.status;

          return item;
        });

        
        this.allProducts = processedData;
        this.products = processedData;

        this.totalItems = this.allProducts.length;
        this.criticalExpiry = this.allProducts.filter((p: any) => p.statusTranslated === 'POR CADUCAR').length;
        const expiredItems = this.allProducts.filter((p: any) => p.statusTranslated === 'CADUCADO').length;

        const itemsEnRiesgo = this.criticalExpiry + expiredItems;
        if (this.totalItems === 0) {
          this.systemHealth = 100;
        } else {
          this.systemHealth = Math.round(((this.totalItems - itemsEnRiesgo) / this.totalItems) * 100);
        }

        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al cargar el inventario:', err)
    });
  }


  applyFilters() {
    this.products = this.allProducts.filter(item => {
      
      const searchMatch = item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      
      const statusMatch = this.statusFilter === 'TODOS' || item.statusTranslated === this.statusFilter;

      return searchMatch && statusMatch;
    });
  }
}