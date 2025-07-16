import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { CustomWidgetWorkspaceComponent } from '../components/custom-widget-workspace/custom-widget-workspace.component';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-custom-widget-board',
  standalone: true,
  imports: [CommonModule, SidebarComponent, CustomWidgetWorkspaceComponent, HeaderComponent],
  templateUrl: './custom-widget-board.component.html',
  styleUrls: ['./custom-widget-board.component.css']
})
export class CustomWidgetBoardComponent {
  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}