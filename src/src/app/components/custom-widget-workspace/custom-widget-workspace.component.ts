import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { WidgetComponent } from '../widget/widget.component';
import { CustomWidgetService } from '../../services/custom-widget.service';
import { Widget, WidgetTemplate } from '../../models/widget.model';
import { Observable, Subscription } from 'rxjs';
import { WidgetToolbarComponent } from '../widget-toolbar/widget-toolbar.component';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-custom-widget-workspace',
  standalone: true,
  imports: [CommonModule, DragDropModule, WidgetComponent, WidgetToolbarComponent],
  templateUrl: './custom-widget-workspace.component.html',
  styleUrls: ['./custom-widget-workspace.component.css'],
  animations: [
    trigger('slideInOut', [
      state('void', style({ transform: 'translateX(100%)' })),  // hidden (offscreen right)
      state('*', style({ transform: 'translateX(0%)' })),       // shown
      transition('void => *', [
        animate('200ms ease-in')
      ]),
      transition('* => void', [
        animate('200ms ease-out')
      ])
    ])
  ]
})

export class CustomWidgetWorkspaceComponent implements OnInit, OnDestroy {
  widgets: Widget[] = [];
  isDragOver = false;
  showSidebar = false;

  private customWidgetSubscription!: Subscription;
  currentCustomWidget$: Observable<any>;

  constructor(private customWidgetService: CustomWidgetService) {
    this.currentCustomWidget$ = this.customWidgetService.currentCustomWidget$;
  }

  ngOnInit(): void {
    this.customWidgetSubscription = this.currentCustomWidget$.subscribe(customWidget => {
      this.widgets = customWidget?.widgets ?? [];
    });
  }

  ngOnDestroy(): void {
    this.customWidgetSubscription?.unsubscribe();
  }

  onWidgetDrop(event: CdkDragDrop<any[]>): void {
    this.isDragOver = false;

    if (event.previousContainer !== event.container) {
      if (event.previousContainer.id === 'widget-library') {
        const widgetTemplate = event.item.data as WidgetTemplate;
        this.customWidgetService.replaceWidget(widgetTemplate);
      }
    } else {
      moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
    }
  }

  onDragEnter(): void {
    this.isDragOver = true;
  }

  onDragExit(): void {
    this.isDragOver = false;
  }

  trackByWidgetId(_: number, widget: Widget): string {
    return widget.id;
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }
}
