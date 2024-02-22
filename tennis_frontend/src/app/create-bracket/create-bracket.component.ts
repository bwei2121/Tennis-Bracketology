import { Component } from "@angular/core";
import { BracketComponent } from "../bracket/bracket.component";
import { ActivatedRoute } from "@angular/router";

@Component({
    standalone: true,
    selector: 'create-bracket',
    templateUrl: 'create-bracket.component.html',
    styleUrls: ['create-bracket.component.scss'],
    imports: [BracketComponent]
})
export class CreateBracketComponent {
  type: string = 'create';
  tournament: string = '';

  constructor(private route: ActivatedRoute) {}

  /**
   * Get tournament name from url
   */
  async ngOnInit() {
    const tournament=this.route.snapshot.paramMap.get('name');
    if(tournament!=null){
      this.tournament=tournament;
    }
  }
}