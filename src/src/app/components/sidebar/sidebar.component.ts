import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CustomWidgetService,  } from '../../services/custom-widget.service';
import { WidgetHelper, WidgetTemplate } from '../../models/widget.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  customWidgets$: Observable<WidgetHelper[]>;
  currentCustomWidget$: Observable<WidgetHelper | null>;
  widgetTemplates$: Observable<WidgetTemplate[]>;
  collapsed = false;

  constructor(private customWidgetService: CustomWidgetService) {
    this.customWidgets$ = this.customWidgetService.customWidgets$;
    this.currentCustomWidget$ = this.customWidgetService.currentCustomWidget$;
    this.widgetTemplates$ = this.customWidgetService.widgetTemplates$;
  }
  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
  ngOnInit(): void {
    // Future logic (if needed)
  }

  selectCustomWidget(widgets: WidgetHelper): void {
    this.customWidgetService.selectCustomWidget(widgets);
  }

}
