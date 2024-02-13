import { Component } from "@angular/core";
import { BracketComponent } from "../bracket/bracket.component";

@Component({
    standalone: true,
    selector: 'view-bracket',
    templateUrl: 'view-bracket.component.html',
    styleUrls: ['view-bracket.component.scss'],
    imports: [BracketComponent]
})
export class ViewBracketComponent {
  type: string = 'view';
}