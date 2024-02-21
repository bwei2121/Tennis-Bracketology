import { Component } from "@angular/core";
import { BracketComponent } from "../bracket/bracket.component";

@Component({
    standalone: true,
    selector: 'create-bracket',
    templateUrl: 'create-bracket.component.html',
    styleUrls: ['create-bracket.component.scss'],
    imports: [BracketComponent]
})
export class CreateBracketComponent {
  type: string = 'create';
}