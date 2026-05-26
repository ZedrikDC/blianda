import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  // Método para obtener las alertas
  getDashboardAlerts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/inventory/alerts`);
  }

  // Método para guardar un producto nuevo
  saveProduct(productData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/inventory/products`, productData);
  }
  
  getInventory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/inventory/products`);
  }
  
}