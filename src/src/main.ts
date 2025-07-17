import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { CustomWidgetBoardComponent } from './app/custom-widget-board/custom-widget-board.component';

@Component({
  selector: 'app-root',
  template: `<app-custom-widget-board></app-custom-widget-board>`,
  standalone: true,
  imports: [CustomWidgetBoardComponent]
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideAnimations(),
    provideHttpClient()
  ]
});