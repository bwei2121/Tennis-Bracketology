import { Component } from "@angular/core";
import { BracketComponent } from "../bracket/bracket.component";
import { ActivatedRoute } from "@angular/router";
import { BracketsManager } from "brackets-manager";
import { Dataset } from "../interfaces";
import axios from "axios";
import { Match, ParticipantResult } from "brackets-model";

@Component({
    standalone: true,
    selector: 'predict-bracket',
    templateUrl: 'predict-bracket.component.html',
    styleUrls: ['predict-bracket.component.scss'],
    imports: [BracketComponent]
})
export class PredictBracketComponent {
  type: string = 'predict';
  tournament: string = '';
  manager!: BracketsManager;
  tournamentData!: Dataset;
  TOURNAMENT_ID: number = 1;

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

  /**
   * Get bracket information necessary for storing bracket data in database from BracketComponent
   * @param bracketData: tuple of BracketsManager object and bracket dataset
   */
  async getBracketInfo(bracketData: [BracketsManager, Dataset]) {
    this.manager=bracketData[0];
    this.tournamentData=bracketData[1];
    await this.getAllMatchData();
  }

  /**
   * Get filtered bracket information and sends to database
   */
  async getAllMatchData() {
    const data=await this.manager.get.tournamentData(this.TOURNAMENT_ID);
    await axios.post('http://localhost:8000/bracket', this.filterBracketMatches(data.match), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Filters only necessary information of matches for database
   * @param matches: array of match data
   * @returns filtered information of bracket
   */
  filterBracketMatches(matches: Match[]) {
    let filterMatches=[];
    for(const match of matches){
      const roundNumber=Number(match.round_id)+1;
      const id=match.id;
      const matchInfo={'matchId': id,
                       'player1': this.filterPlayer(match.opponent1), 
                       'player2': this.filterPlayer(match.opponent2),
                       'roundNumber': roundNumber};
      filterMatches.push(matchInfo);
    }
    let roster=[];
    for(const player of this.tournamentData.roster){
      if(player!=null && player.playerId==null && player.playerName==null){
        roster.push(null)
      }
      else{
        roster.push(player)
      }
    }
    return {'title': this.tournamentData.title, 'matches': filterMatches, 'roster': roster};
  }
 
  /**
   * Filters only necessary information of player
   * @param player: data of player in match or null 
   * @returns necessary information of player or null 
   */
  filterPlayer(player: ParticipantResult | null){
    if(player==null){
      return null;
    }
    else{
      return {
        'playerId': player.id, 
        'score': player.score, 
        'result': player.result
      }
    }
  }
}