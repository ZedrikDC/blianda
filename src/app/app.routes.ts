import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard';
import { InventoryComponent } from './pages/inventory/inventory';
import { AlertsComponent } from './pages/alerts/alerts';
import { AddProductComponent } from './pages/add-product/add-product';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'alerts', component: AlertsComponent },
  { path: 'add-product', component: AddProductComponent }
];