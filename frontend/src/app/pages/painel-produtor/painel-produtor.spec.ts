import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelProdutor } from './painel-produtor';

describe('PainelProdutor', () => {
  let component: PainelProdutor;
  let fixture: ComponentFixture<PainelProdutor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelProdutor],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelProdutor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
