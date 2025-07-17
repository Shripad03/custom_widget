import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectMetricsDialog } from './select-metrics-dialog';

describe('SelectMetricsDialog', () => {
  let component: SelectMetricsDialog;
  let fixture: ComponentFixture<SelectMetricsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectMetricsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectMetricsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
