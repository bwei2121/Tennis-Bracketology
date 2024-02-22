import { Component } from "@angular/core";
import { BracketComponent } from "../bracket/bracket.component";
import { ActivatedRoute } from "@angular/router";

@Component({
    standalone: true,
    selector: 'view-bracket',
    templateUrl: 'view-bracket.component.html',
    styleUrls: ['view-bracket.component.scss'],
    imports: [BracketComponent]
})
export class ViewBracketComponent {
  type: string = 'view';
  tournament: string = '';

  constructor(private route: ActivatedRoute) {}

  /**
   * Get tournament name from url
   */
  ngOnInit() {
    const tournament=this.route.snapshot.paramMap.get('name');
    if(tournament!=null){
      this.tournament=tournament;
    }
  }
}