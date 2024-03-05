import { Component, OnInit, ViewChild, ElementRef, Input, Renderer2, EventEmitter, Output } from "@angular/core";
import axios from 'axios';
import { BracketsManager } from "brackets-manager";
import { getNearestPowerOfTwo } from "brackets-manager/dist/helpers";
import { InMemoryDatabase } from '../storage/memory';
import { BackendData, BracketManagerData, Dataset, DialogData, MatchInfo, MatchResult, ProcessData, Roster } from "../interfaces";
import { Id, Match, Result } from "brackets-model";
import { MatDialog } from "@angular/material/dialog";
import { MatchOverviewDialog } from "../dialog/dialog.components";
import { ErrorDialog } from "../error/error.components";
import { Router } from '@angular/router';
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  selector: 'bracket',
  templateUrl: 'bracket.component.html',
  styleUrls: ['bracket.component.scss'],
  imports: [ CommonModule ]
})
export class BracketComponent implements OnInit {
  @Input() type: string = '';
  @Input() tournament = '';
  TOURNAMENT_ID: number = 0;
  STAGE_ID: number = 0;
  @ViewChild('bracket') bracket!: ElementRef;
  @Output() bracketInfo = new EventEmitter<[BracketsManager, Dataset]>();
  bracketData!: [BracketsManager, Dataset];

  constructor(private dialog: MatDialog, private renderer: Renderer2, private router: Router) {}

  /**
   * Gets bracket data from backend and process that data using the brackets-manager and brackets-viewer libraries
   * Traverse through DOM and add onerror attribute onto img tags to hide player images that could not be found
   * Navigates user back to choosing tournaments page if no data for chosen tournament bracket
   */
  async ngOnInit(): Promise<void> {
    const bracketDataset: BackendData | null=await this.getBracketData();
    if(bracketDataset==null){
      this.navigateToChooseTournaments();
    }
    else{
      const title: string=bracketDataset['title'];
      const roster: Roster[]=bracketDataset['roster'];
      const results: MatchInfo[]=bracketDataset['results'];
      this.processBracketData(this.createDataForBracketViewer(roster, title), results).then(async (data: ProcessData) => {
        window.bracketsViewer.render(data.managerData);
        this.addHTMLAttributes();
      });
    }
  }
  
  /**
   * Gets bracket data based on specified tournament name from backend using axios
   * @returns Promise<BackendData | null>: Returns bracket data (or null if no data) from backend
   */
  async getBracketData(): Promise<BackendData | null> {
    let bracketData=null;
    await axios.get('http://localhost:8000/bracket', {
      params: {
        tournament: this.tournament
      }
    }).then((response) => {
      bracketData=response.data;
    })
    .catch(() => {
      this.dialog.open(ErrorDialog);
      this.navigateToChooseTournaments();
    });
    return bracketData;
  }

  /**
   * Create a tennis bracket using brackets-manager library and formatting data that can be usable by brackets-viewer library
   * @param dataset: backend data representing tennis bracket data for a tournament
   * @param matchResults: match information to update tennis bracket after initial matchups
   * @returns Promise<BracketManagerData>: data format usable by brackets-viewer library
   */
  async processBracketData(dataset: Dataset, matchResults: MatchInfo[]): Promise<ProcessData> {
    const db = new InMemoryDatabase();
    const manager = new BracketsManager(db);
  
    db.setData({
      participant: [],
      stage: [],
      group: [],
      round: [],
      match: [],
      match_game: [],
    });
  
    await manager.create.stage({
      name: dataset.title,
      tournamentId: this.TOURNAMENT_ID,
      type: dataset.type,
      seeding: this.createSeeding(dataset.roster),
      settings: {
        seedOrdering: ['natural'],
        size: getNearestPowerOfTwo(dataset.roster.length),
      },
    });
  
    // allow user to predict matches
    if(this.type=='create'){
      window.bracketsViewer.onMatchClicked = async (match: Match) => await this.openDialog(match, dataset.roster, this.dialog, manager);
    }
    
    // add images for players
    await window.bracketsViewer.setParticipantImages(this.createDataForPictures(dataset.roster));

    if(this.type=='view'){
      await this.updateMatches(matchResults, manager); 
    }
    
    const data = await manager.get.stageData(this.STAGE_ID);
    this.bracketData=[manager, dataset];
    
    const managerData: BracketManagerData = {
      stages: data.stage,
      matches: data.match,
      matchGames: data.match_game,
      participants: data.participant,
    };

    return {
      managerData: managerData,
      manager: manager,
    };
  }

  /**
   * Take bracket data from backend and reformat the data such that it is useable by brackets-manager library
   * @param roster: players in the tournament
   * @param title: name of tournament 
   * @returns Dataset: data format usable by brackets-manager library
   */
  createDataForBracketViewer(roster: Roster[], title: string): Dataset {
    return ({
      title: title,
      type: "single_elimination",
      roster: roster
    })
  }

  /**
   * Create participant array usable for brackets-manager library
   * @param roster: players in the tournament including byes (reprsented as null)
   * @returns array that represents participants in the tournament usable for brackets-manager library
   */
  createSeeding(roster: Roster[]) {
    const players=[];
    for(const player of roster){
      if(player==null){
        players.push(null); // represents a bye
      }
      else{
        players.push(player.name);
      }
    }
    return players;
  }

  /**
   * Updates the bracket matches in the BracketsManager object
   * @param matchResults: list of match results for the tournament 
   * @param manager: BracketsManager object, gives the matches that can be updated on the bracket
   * @returns void: matches will be updated with the list of matches in matchResults
   */
  async updateMatches(matchResults: MatchInfo[], manager: BracketsManager) {
    let matchesToUpdate: Match[]=await manager.get.currentMatches(this.STAGE_ID);
    let prevMatchesToUpdate: Match[]=[];
    while(JSON.stringify(prevMatchesToUpdate)!=JSON.stringify(matchesToUpdate)){ // there is still a match to update
      for(const match of matchesToUpdate) {
        for(const playerMatch of matchResults){
          if(this.checkToUpdateMatch(match, playerMatch)){
            await manager.update.match({
              id: match.id,
              opponent1: playerMatch.opponent1,
              opponent2: playerMatch.opponent2,
            });  
            break;
          }
        }
      }
      prevMatchesToUpdate=matchesToUpdate;
      matchesToUpdate=await manager.get.currentMatches(this.STAGE_ID);
    }
  }

  /**
   * Returns boolean that represents if a specific match can be updated
   * @param match: match from BracketsManager object to be updated 
   * @param playerMatch: a match to be updated created from the web scraper 
   * @returns boolean: if the match can be updated 
   */
  checkToUpdateMatch(match: Match, playerMatch: MatchInfo){
    return (match.status!=4 && 
           (match.opponent1?.id==playerMatch.id1 && match.opponent2?.id==playerMatch.id2 || 
           match.opponent1?.id==playerMatch.id2 && match.opponent2?.id==playerMatch.id1) && 
           playerMatch.opponent1.score!=null && playerMatch.opponent2.score!=null);
  }

  /**
   * Creates list of player pictures to be used in tennis bracket
   * @param roster: list of players and corresponding ids 
   * @returns list of player ids and corresponding url images
   */
  createDataForPictures(roster: Roster[]) {
    const imageData=[];
    for(const player of roster){
      if(player!=null && player.id!=null && player.name!=null){
        imageData.push({
          participantId: player.id,
          imageUrl: this.getImageUrl(player.name)
        });
      }
    }
    return imageData;
  }
  
  /**
   * Get the url of player photo using the player name
   * @param name: player name 
   * @returns string: url of player photo
   */
  getImageUrl(name: string): string {
    let nameList: string[]=name.split(" ");
    if(nameList[0].includes("(") && nameList[0].includes(")")){ // check if name has seeding included
      nameList.splice(0, 1);
    }
    for(let i=0; i<nameList.length; i++){
      const name=nameList[i]
      const newName=name.charAt(0).toLowerCase().concat(name.slice(1));
      nameList[i]=newName;
    }
    const nameUrl=nameList.join("_");
    return `https://www.tennisabstract.com/photos/${nameUrl}-sirobi.jpg`;
  }

  /**
   * Finds all img tags in the html to add onerror attributes or finds specific match html of interest
   * if given matchId parameter
   * @param matchId: optional parameter specifying which match to update
   * @returns HTMLDivElement | null: returns html of match in interest or null 
   */
  addHTMLAttributes(matchId?: string): HTMLDivElement | null {
    const bracketHTML: HTMLElement=this.bracket.nativeElement.children[0];
    if(bracketHTML){
      const roundsHTML: HTMLCollection=bracketHTML.children[1].children[0].children;
      for(let roundIndex=0; roundIndex<roundsHTML.length; roundIndex++){
        const round: HTMLCollection | undefined=roundsHTML.item(roundIndex)?.children;
        if(round){
          for(let matchIndex=0; matchIndex<round.length; matchIndex++){
            const match: Element | null=round.item(matchIndex);
            if(match && match.children.length!=0){
              if(matchId){
                const dataMatchId=(match as HTMLDivElement).dataset["matchId"]
                if(dataMatchId && dataMatchId==matchId){
                  return (match as HTMLDivElement)
                }
              }
              this.addOnErrorAttribute((match as HTMLElement), 1);
              this.addOnErrorAttribute((match as HTMLElement), 2);
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Adds onerror attribute to img tags that hide player images that do not exist
   * @param match: HTML element that contains information about a match 
   * @param index: index number that represents the first player or second player in the match 
   * @returns void: all img tags will have onerror attribute
   */
  addOnErrorAttribute(match: HTMLElement, index: number): void {
    const player=match.children[0].children[index].children[0];
    if(player.children.length==1){
      this.renderer.setAttribute(player.children[0], 'onerror', "this.style.visibility = 'hidden'");
    }
    else if(player.children.length==2){ 
      this.renderer.setAttribute(player.children[1], 'onerror', "this.style.visibility = 'hidden'");
    }
  }

  /**
   * Opens dialog to allow user to predict and updates bracket based on prediction
   * @param match: match in bracket to predict
   * @param roster: roster of players in bracket 
   * @param dialog: dialog to show to user for predicting the match 
   * @param manager: BracketsManager object that stores the bracket 
   * @returns Promise<void>: updates bracket if user makes prediction on match
   */
  async openDialog(match: Match, roster: Roster[], dialog: MatDialog, manager: BracketsManager): Promise<void> {
    if(match.status!=4 && match.status!=5 && match.opponent1?.id!=null && match.opponent2?.id!=null){
      const player1=this.findPlayerFromID(match.opponent1.id, roster);
      const player2=this.findPlayerFromID(match.opponent2.id, roster);
  
      const dialogRef = dialog.open(MatchOverviewDialog, {
        data: {player1: player1, player2: player2}
      });

      dialogRef.afterClosed().subscribe(async (result: DialogData) => {
        if(result){
          if(result.playerWinner && player1.name==result.playerWinner){
            await this.updateMatchInBracket(result, 1, manager, match);
            await this.updateMatchonFrontend(match, manager, player1, result, 1, 2);
          }
          else{
            await this.updateMatchInBracket(result, 2, manager, match);
            await this.updateMatchonFrontend(match, manager, player2, result, 2, 1);
          }
        }
      });
    }
  }

  /**
   * Updates the match in BracketsManager and BracketsViewer objects
   * @param result: result from dialog that are used to update bracket 
   * @param playerWinner: 1 or 2, representing opponent1 or opponent 2 winning respectively 
   * @param manager: BracketsManager object that stores bracket 
   * @param match: match to update
   * @returns Promise<void>: promises to update match in BracketsManager and BracketsViewer objects
   */
  async updateMatchInBracket(result: DialogData, playerWinner: number, manager: BracketsManager, match: Match): Promise<void> {
    const resultMatch: Result='win';
    // ensures avoiding situations where tennis scores where loser wins first set
    const winnerManager: MatchResult={ score: Number(`1${result.winner}`), result: resultMatch };
    const winnerViewer: MatchResult={ score: result.winner, result: resultMatch };
    const loser: MatchResult={ score: result.loser };
    // playerWinner==1
    let opponent1Manager: MatchResult=winnerManager;
    let opponent2Manager: MatchResult=loser;
    let opponent1Viewer: MatchResult=winnerViewer;
    let opponent2Viewer: MatchResult=loser;
    if(playerWinner==2){
      opponent1Manager=loser;
      opponent2Manager=winnerManager;
      opponent1Viewer=loser;
      opponent2Viewer=winnerViewer;
    }
    await manager.update.match({
      id: match.id, 
      status: 4,
      opponent1: opponent1Manager,
      opponent2: opponent2Manager,
    });
    await window.bracketsViewer.updateMatch({
      id: match.id, 
      status: 4,
      opponent1: opponent1Viewer,
      opponent2: opponent2Viewer,
    });
  }

  /**
   * Updates relevant matches after match prediction on the frontend of tennis bracket
   * @param match: match to update 
   * @param manager: BracketsManager object used to find next match for winning player 
   * @param playerWinner: information of winning player 
   * @param result: results from dialog that user used for prediction 
   * @param winPlayerNumber: 1 or 2, represent winning player 
   * @param losePlayerNumber: 1 or 2, represent losing player 
   */
  async updateMatchonFrontend(match: Match, manager: BracketsManager, playerWinner: Roster, result: DialogData, winPlayerNumber: number, losePlayerNumber: number): Promise<void> {
    // current predicted match to update
    const matchContainer = this.addHTMLAttributes(`${match.id}`);
    if(matchContainer){
      const result1 = matchContainer.children[0].children[winPlayerNumber];
      if(result1){
        result1.classList.add('win');
      }
      const result2 = matchContainer.children[0].children[losePlayerNumber];
      if(result2){
        result2.classList.add('loss');
      }
      const nextMatch: Match = (await manager.find.nextMatches(match.id, playerWinner.id))[0];
      // next match of player winner to update
      const nextMatchContainer = this.addHTMLAttributes(`${nextMatch.id}`);
      if(nextMatchContainer){
        if(nextMatch.opponent1?.id==playerWinner.id){
          const name1 = nextMatchContainer.children[0].children[1].children[0];
          if (name1){
            name1.innerHTML = `<img src="${this.getImageUrl(playerWinner.name)}" onerror="this.style.visibility = 'hidden'">${result.playerWinner}`;
          }
        }
        else{
          const name2 = nextMatchContainer.children[0].children[2].children[0];
          if (name2){
            name2.innerHTML = `<img src="${this.getImageUrl(playerWinner.name)}" onerror="this.style.visibility = 'hidden'">${result.playerWinner}`;
          } 
        }
      }
    }
  }

  /**
   * Gets the player name from the playerID given
   * @param playerID: id of player, might be null 
   * @param roster: roster of players and corresponding ids 
   * @returns Roster: player id and player name of interest
   */
  findPlayerFromID(playerID: Id | null, roster: Roster[]): Roster {
    if(playerID!=null){
      for(const player of roster){
        if(player!=null && player.id==playerID){
          return player;
        }
      }
    }
    return {id: -1, name: ""}; // playerID not found
  }

  /**
   * Sends user to choosing tournaments page
   */
  navigateToChooseTournaments() {
    this.router.navigate(['/choose']);
  }

  /**
   * Sends bracket information to CreateBracketComponent, which will send bracket data to store in database
   * Function is called when user presses "Save Bracket" button
   */
  sendBracketInfo() {
    this.bracketInfo.emit(this.bracketData);
  }
}