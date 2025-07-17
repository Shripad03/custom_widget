import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetToolbar } from './widget-toolbar.component';

describe('WidgetToolbar', () => {
  let component: WidgetToolbar;
  let fixture: ComponentFixture<WidgetToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetToolbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WidgetToolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
