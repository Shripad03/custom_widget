import { Component } from '@angular/core';
import { WidgetTemplate } from '../../models/widget.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { CustomWidgetService } from '../../services/custom-widget.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-widget-toolbar',
  imports: [CommonModule, DragDropModule],
  standalone: true,
  templateUrl: './widget-toolbar.component.html',
  styleUrls: ['./widget-toolbar.component.css']
})
export class WidgetToolbarComponent {
  widgetTemplates$: Observable<WidgetTemplate[]>;

  constructor(private customWidgetService: CustomWidgetService) {
    this.widgetTemplates$ = this.customWidgetService.widgetTemplates$;
  }
  
  onDragStart(_: WidgetTemplate): void {
    document.body.classList.add('dragging');
  }

  onDragEnd(): void {
    document.body.classList.remove('dragging');
  }
}
