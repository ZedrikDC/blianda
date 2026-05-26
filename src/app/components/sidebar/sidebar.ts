import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // <-- 1. Importamos las herramientas de navegación

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], // <-- 2. Le decimos a Angular que las use aquí
  templateUrl: './sidebar.html'
})
export class SidebarComponent { }