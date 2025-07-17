import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { WidgetComponent } from '../widget/widget.component';
import { CustomWidgetService } from '../../services/custom-widget.service';
import { Widget, WidgetTemplate } from '../../models/widget.model';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap, takeWhile, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
  private pollingSubscription!: Subscription;
  private isPolling = true;
  currentCustomWidget$: Observable<any>;
 
  // Configure your API endpoint here
  private readonly API_ENDPOINT = 'http://localhost:3000/api/users'; // Replace with your actual API endpoint
 
  constructor(
    private customWidgetService: CustomWidgetService,
    private http: HttpClient
  ) {
    this.currentCustomWidget$ = this.customWidgetService.currentCustomWidget$;
  }
 
  ngOnInit(): void {
    this.customWidgetSubscription = this.currentCustomWidget$.subscribe(customWidget => {
      this.widgets = customWidget?.widgets ?? [];
    });
 
    // Start polling the API
    this.startApiPolling();
  }
 
  ngOnDestroy(): void {
    this.customWidgetSubscription?.unsubscribe();
    this.pollingSubscription?.unsubscribe();
    this.isPolling = false;
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
 
  /**
   * Starts polling the Node API every 2 seconds
   */
  private startApiPolling(): void {
    this.pollingSubscription = interval(8000) // Poll every 2 seconds
      .pipe(
        takeWhile(() => this.isPolling), // Continue polling while component is active
        switchMap(() => this.pollApi()),
        catchError(error => {
          console.error('API polling error:', error);
          return of(null); // Continue polling even if there's an error
        })
      )
      .subscribe(data => {
        if (data) {
          console.log('API polling received data:', data);
          // You can add additional logic here to handle the received data
          this.handleApiData(data);
        }
      });
  }
 
  /**
   * Makes the actual API call
   */
  private pollApi(): Observable<any> {
    return this.http.get(this.API_ENDPOINT).pipe(
      catchError(error => {
        // Log error but don't stop polling
        console.warn('API call failed:', error);
        return of(null);
      })
    );
  }
 
  /**
   * Handles the data received from the API
   * You can customize this method to process the data as needed
   */
  private handleApiData(data: any): void {
    console.log('Processing API data:', data);
    // Add your custom logic here to handle the received data
    // For example, you might want to update widgets or trigger other actions
  }
 
  /**
   * Stops the API polling
   */
  stopPolling(): void {
    this.isPolling = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
 
  /**
   * Restarts the API polling
   */
  startPolling(): void {
    if (!this.isPolling) {
      this.isPolling = true;
      this.startApiPolling();
    }
  }
 
  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }
}