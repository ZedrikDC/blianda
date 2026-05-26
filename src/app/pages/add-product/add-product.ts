import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router'; 
import { ApiService } from '../../services/api'; 

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html'
})
export class AddProductComponent {
  productData = {
    name: '',
    category: 'Antibióticos',
    batch: '',
    sku: '',
    stock: 0,
    unit: 'Pieza', // <-- Cambiado a Pieza por defecto
    mfgDate: '',
    expDate: '',
    supplier: 'Distribuidora Global',
    refNo: ''
  };

  formSubmitted = false; 

  constructor(private apiService: ApiService, private router: Router) {}

  saveProduct() {
    this.formSubmitted = true; 

    // Verificamos si hay campos vacíos o stock inválido
    if (!this.productData.name || !this.productData.sku || !this.productData.batch || 
        this.productData.stock <= 0 || !this.productData.mfgDate || !this.productData.expDate) {
      return; // Detenemos el guardado silenciosamente, el HTML mostrará el rojo
    }

    console.log('Enviando al backend...', this.productData);
    this.apiService.saveProduct(this.productData).subscribe({
      next: (response: any) => {
        alert('✅ ¡Producto guardado exitosamente!');
        this.router.navigate(['/inventory']);
      },
      error: (err: any) => {
       
        const errorReal = err.error?.detail || err.message || "Error desconocido";
        alert('❌ La Base de Datos rechazó el registro:\n\n' + errorReal);
      }
    });
  }
}