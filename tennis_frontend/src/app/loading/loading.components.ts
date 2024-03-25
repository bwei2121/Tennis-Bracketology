import { Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  standalone: true,
  selector: 'loading',
  templateUrl: 'loading.component.html',
  styleUrls: ['loading.component.scss'],
  imports: [
    MatProgressBarModule
  ],
})
export class LoadingComponent {
  @Input() text: string = "Loading..."; // loading text
}
