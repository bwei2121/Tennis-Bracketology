import { Component, OnInit, ViewChild, ElementRef, Input, Renderer2, EventEmitter, Output } from "@angular/core";
import axios from 'axios';
import { BracketsManager } from "brackets-manager";
import { getNearestPowerOfTwo } from "brackets-manager/dist/helpers";
import { InMemoryDatabase } from '../storage/memory';
import { BackendData, BracketManagerData, Dataset, DialogData, FrontendPredictionUpdate, MatchInfo, MatchResult, PredictionRate, ProcessData, Roster } from "../interfaces";
import { Id, Match, Result } from "brackets-model";
import { MatDialog } from "@angular/material/dialog";
import { MatchOverviewDialog } from "../match-dialog/match-dialog.components";
import { ErrorDialog } from "../error/error.components";
import { Router } from '@angular/router';
import { CommonModule } from "@angular/common";
import { LoadingComponent } from "../loading/loading.components";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FormsModule } from "@angular/forms";
import { HeaderComponent } from "../header/header.component";

@Component({
    standalone: true,
    selector: 'bracket',
    templateUrl: 'bracket.component.html',
    styleUrls: ['bracket.component.scss'],
    imports: [CommonModule, LoadingComponent, MatFormFieldModule, MatSelectModule, MatOptionModule, FormsModule, HeaderComponent]
})
export class BracketComponent implements OnInit {
  @Input() type: string = '';
  @Input() tournament = '';
  TOURNAMENT_ID: number = 0;
  STAGE_ID: number = 0;
  GROUP_ID: number = 0;
  @ViewChild('bracket') bracket!: ElementRef;
  @Output() bracketInfo = new EventEmitter<[BracketsManager, Dataset]>();
  bracketData!: [BracketsManager, Dataset];
  loadingText: string = "Loading bracket...";
  loadedBracketData: boolean = false;
  seededPlayers!: Roster[];
  selectedPlayer!: Roster;
  isEnabledViewQF: boolean = true;
  managerQF!: BracketsManager;
  viewQF: boolean = false;
  correctPredictions: number = 0;
  totalPredictions: number = 0;

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
      const method: string=bracketDataset['method'];
      const predictionRate: PredictionRate | null=bracketDataset['predictionRate'];
      const updatePredictionsFrontend: FrontendPredictionUpdate[] | null=bracketDataset['updatePredictionsFrontend'];
      this.processBracketData(this.createDataForBracketViewer(roster, title), results, method, predictionRate).then(async (data: ProcessData) => {
        this.loadedBracketData=true;
        window.bracketsViewer.render(data.managerData);
        this.addHTMLAttributes();
        // update user predictions on frontend to show which predictions are correct/inccorect
        if(updatePredictionsFrontend){
          this.updateFrontendUserPredictions(this.bracketData[0], updatePredictionsFrontend);
        }
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
        tournament: this.tournament,
        type: this.type
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
   * Create BracketsManger object which stores tennis bracket data for tournament (either full bracket or QF+ bracket)
   * @param dataset: backend data representing tennis bracket data for a tournament 
   * @param roster: player roster for bracket 
   * @param bracketType: type of bracket (full bracket or QF+ bracket) 
   * @returns BracketsManager object for bracket
   */
  async createBracketDatabase(dataset: Dataset, roster: Roster[], bracketType: string): Promise<BracketsManager> {
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
      name: `${dataset.title} ${bracketType}`,
      tournamentId: 1,
      type: 'single_elimination',
      seeding: this.createSeeding(roster),
      settings: {
        seedOrdering: ['natural'],
        size: getNearestPowerOfTwo(roster.length),
      },
    });

    return manager;
  }

  /**
   * Create a tennis bracket using brackets-manager library and formatting data that can be usable by brackets-viewer library
   * @param dataset: backend data representing tennis bracket data for a tournament
   * @param matchResults: match information to update tennis bracket after initial matchups
   * @param method: method of retrieving bracket data (either through webscraping or database)
   * @param predictionRate: user prediction rate for predicted brackets only
   * @returns Promise<BracketManagerData>: data format usable by brackets-viewer library
   */
  async processBracketData(dataset: Dataset, matchResults: MatchInfo[], method: string, predictionRate: PredictionRate | null): Promise<ProcessData> {
    // bracketType used to be "(Full Bracket)", change to "" so title of stored brackets are just name of tournament
    const manager=await this.createBracketDatabase(dataset, dataset.roster, "");
  
    // choose seeded player's pov to view bracket
    this.seededPlayers=this.findSeededPlayers(dataset.roster);

    // allow user to predict matches
    if(this.type=='predict'){
      window.bracketsViewer.onMatchClicked = async (match: Match) => await this.openDialog(match, dataset.roster, this.dialog, manager);
    }

    // show user prediction rate for user predicted brackets
    if(predictionRate){
      this.correctPredictions=predictionRate?.correctPredictions;
      this.totalPredictions=predictionRate?.totalPredictions;
    }
    
    // add images for players
    await window.bracketsViewer.setParticipantImages(this.createDataForPictures(dataset.roster));

    // fill in all matches if user wants to 'view' full bracket or restore bracket to last saved user bracket from database
    if(this.type=='view' || method=='database'){
      await this.updateMatches(matchResults, manager); 
    }
    
    // create bracket from Quarterfinals+
    const totalRounds=Math.log(getNearestPowerOfTwo(dataset.roster.length))/Math.log(2);
    this.isEnabledViewQF=await this.checkForQFView(manager, totalRounds-2, dataset);

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
        players.push(player.playerName);
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
      if(player!=null && player.playerId!=null && player.playerName!=null){
        imageData.push({
          participantId: player.playerId,
          imageUrl: this.getImageUrl(player.playerName)
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
  
      if(!(player1.playerName.includes("Qualifer") || player2.playerName.includes("Qualifer"))){
        const dialogRef = dialog.open(MatchOverviewDialog, {
          data: {player1: player1, player2: player2}
        });
  
        dialogRef.afterClosed().subscribe(async (result: DialogData) => {
          if(result){
            if(result.playerWinner && player1.playerName==result.playerWinner){
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
      const nextMatch: Match = (await manager.find.nextMatches(match.id, playerWinner.playerId))[0];
      // next match of player winner to update
      const nextMatchContainer = this.addHTMLAttributes(`${nextMatch.id}`);
      if(nextMatchContainer){
        if(nextMatch.opponent1?.id==playerWinner.playerId){
          const name1 = nextMatchContainer.children[0].children[1].children[0];
          if (name1){
            name1.innerHTML = `<img src="${this.getImageUrl(playerWinner.playerName)}" onerror="this.style.visibility = 'hidden'">${result.playerWinner}`;
          }
        }
        else{
          const name2 = nextMatchContainer.children[0].children[2].children[0];
          if (name2){
            name2.innerHTML = `<img src="${this.getImageUrl(playerWinner.playerName)}" onerror="this.style.visibility = 'hidden'">${result.playerWinner}`;
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
        if(player!=null && player.playerId==playerID){
          return player;
        }
      }
    }
    return {playerId: -1, playerName: ""}; // playerID not found
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

  /**
   * Finds the seeded players in the tournament bracket, used for easily finding top players on bracket
   * @param roster: roster of tournament players 
   * @returns array of seeded tournament players
   */
  findSeededPlayers(roster: Roster[]): Roster[] {
    const totalPlayers=roster.length;
    const totalTopPlayers=totalPlayers/4; // 1/4 of all players are seeded players
    let topPlayersArray: Roster[] = [];
    roster[0]['matchId']=0;
    roster[0]['alignment']='start';
    topPlayersArray.push(roster[0]);
    for(let index=1; index<totalTopPlayers/2; index++){
      const playerSeeding=index*8;
      const firstMatchId=Math.trunc((playerSeeding-1)/2);
      const secondMatchId=Math.trunc(playerSeeding/2);
      roster[playerSeeding-1]['matchId']=firstMatchId;
      roster[playerSeeding-1]['alignment']='end';
      roster[playerSeeding]['matchId']=secondMatchId;
      roster[playerSeeding]['alignment']='start';
      topPlayersArray.push(roster[playerSeeding-1]);
      topPlayersArray.push(roster[playerSeeding]);
    }
    roster[totalPlayers-1]['matchId']=Math.trunc((totalPlayers-1)/2);
    roster[totalPlayers-1]['alignment']='end';
    topPlayersArray.push(roster[totalPlayers-1]);
    return topPlayersArray;
  }

  /**
   * Scrolls to player on the tournament bracket and briefly highlights the player name for user
   */
  scrollToTopPlayer() {
    const matchHTML=this.addHTMLAttributes(`${this.selectedPlayer.matchId}`);
    matchHTML?.scrollIntoView({block: this.selectedPlayer.alignment});
    // this.selectedPlayer.alignment=="start"
    let playerHTML=matchHTML?.children[0].children[1];
    if(this.selectedPlayer.alignment=="end"){
      playerHTML=matchHTML?.children[0].children[2];
    }
    playerHTML?.classList.add('playerHighlight');
    this.renderer.listen(playerHTML, 'animationend', () => {
      playerHTML?.classList.remove('playerHighlight');
    });
  }

  /**
   * Switches tournament bracket presented to user
   * Either shows full bracket or QF+ bracket
   */
  async switchBracketView() {
    // QF+ bracket
    let data = await this.managerQF.get.stageData(this.STAGE_ID);
    if(this.viewQF){ // full bracket
      data = await this.bracketData[0].get.stageData(this.STAGE_ID);
    }
    const managerData: BracketManagerData = {
      stages: data.stage,
      matches: data.match,
      matchGames: data.match_game,
      participants: data.participant,
    };
    // erases current bracket displayed
    this.renderer.setProperty(this.bracket.nativeElement, 'innerHTML', ''); 
    // displays new bracket
    window.bracketsViewer.render(managerData);
    this.viewQF=!this.viewQF;
  }

  /**
   * Checks if a QF+ bracket should be created for the user
   * @param manager: BracketsManager object for full bracket
   * @param roundQF: round number of the quarterfinals in the full bracket 
   * @param dataset: dataset (includes player roster) for full bracket 
   * @returns boolean: if full bracket has reached QF round or not
   */
  async checkForQFView(manager: BracketsManager, roundQF: number, dataset: Dataset): Promise<boolean> {
    const farthestRoundCompleted=(await manager.get.currentRound(this.STAGE_ID))?.number;
    if(farthestRoundCompleted!=null && farthestRoundCompleted<roundQF){
      return false;
    }
    let matches: MatchInfo[]=[];
    let players: Roster[]=[];
    // quarterfinals matches
    for(let matchesQF=1; matchesQF<=4; matchesQF++){
      const match=await manager.find.match(this.GROUP_ID, roundQF, matchesQF);
      const playerId1=match.opponent1?.id;
      if(playerId1!=null){
        players.push(this.mapPlayerIdToPlayerObject(playerId1, dataset.roster));
      }
      const playerId2=match.opponent2?.id;
      if(playerId2!=null){
        players.push(this.mapPlayerIdToPlayerObject(playerId2, dataset.roster));
      }
      matches.push(this.convertMatchtoMatchInfo(match, players));
    }
    // semifinals matches
    for(let matchesSF=1; matchesSF<=2; matchesSF++){
      const match=await manager.find.match(this.GROUP_ID, roundQF+1, matchesSF);
      matches.push(this.convertMatchtoMatchInfo(match, players));
    }
    // finals match
    const match=await manager.find.match(this.GROUP_ID, roundQF+2, 1);
    matches.push(this.convertMatchtoMatchInfo(match, players));

    this.managerQF=await this.createBracketDatabase(dataset, players, "(QF+ Bracket)");

    await this.updateMatches(matches, this.managerQF); 

    return true;
  }

  /**
   * Gets player object (contains player id and player name) from playerId input
   * @param playerId: id of player 
   * @param roster: player roster in tournament
   * @returns Roster: player object from roster parameter that contains playerId
   */
  mapPlayerIdToPlayerObject(playerId: Id, roster: Roster[]): Roster {
    for(const playerObject of roster){
      if(playerObject!=null && playerObject.playerId==playerId){
        return playerObject;
      }
    }
    return {playerId: -1, playerName: ''}; // should not reach this statement
  }

  /**
   * Gets new player id for QF+ bracket based on old player id from full bracket
   * @param playerId: id of player
   * @param roster: roster of players in tournaent 
   * @returns Id: new player id for QF+ bracket
   */
  mapPlayerIdToNewPlayerId(playerId: Id | null | undefined, roster: Roster[]): Id {
    for(const [newPlayerId, playerObject] of roster.entries()){
      if(playerObject!=null && playerObject.playerId==playerId){
        return newPlayerId;
      }
    }
    return -1; // should not reach this statement
  }

  /**
   * Converts Match object from full bracket to MatchInfo object that contains match information for QF+ bracket
   * @param match: match information from full bracket 
   * @param roster: player roster from QF+ bracket
   * @returns MatchInfo: creates match information to display on QF+ bracket
   */
  convertMatchtoMatchInfo(match: Match, roster: Roster[]): MatchInfo {
    const id1: number=Number(this.mapPlayerIdToNewPlayerId(match.opponent1?.id, roster));
    const id2: number=Number(this.mapPlayerIdToNewPlayerId(match.opponent2?.id, roster));
    let opponent1: MatchResult = {score: match.opponent1?.score, result: match.opponent1?.result};
    let opponent2: MatchResult = {score: match.opponent2?.score, result: match.opponent2?.result};
    return {
      id1: id1,
      id2: id2,
      opponent1: opponent1,
      opponent2: opponent2,
    }
  }

  /**
   * Updates predicted matches on frontend, shows if user predicted matches correctly/incorrectly
   * @param manager: BracketsManager object containing predicted bracket 
   * @param updatePredictionsFrontend: contains predicted matches to be updated on frontend, showing if user predicted match correctly/incorrectly  
   * @returns Promise<void>
   */
  async updateFrontendUserPredictions(manager: BracketsManager, updatePredictionsFrontend: FrontendPredictionUpdate[]): Promise<void> {
    for(const match of updatePredictionsFrontend){
      const matchContainer=this.addHTMLAttributes(`${match.matchId}`);
      if(match.result=="correct"){ // name highlighted with var(--win-color)
        this.renderer.addClass(matchContainer?.children[0].children[match.playerNumber].children[0], 'correctPrediction');
      }
      else{ // name highlighted with var(--loss-color) and struck through
        this.renderer.addClass(matchContainer?.children[0].children[match.playerNumber].children[0], 'incorrectPrediction');
        this.updateFutureIncorrectPredictions(manager, match.playerId, match.matchId);
      }
    }
  }

  /**
   * Updates future predicted matches with winners that are impossible to happen on frontend, adds to totalPredictions variable in user prediction rate
   * @param manager: BracketsManager object containing predicted bracket 
   * @param playerId: id of predicted winning player 
   * @param matchId: id of predicted match
   * @returns Promise<void>
   */
  async updateFutureIncorrectPredictions(manager: BracketsManager, playerId: number, matchId: number): Promise<void> {
    let updateMoreGames=true;
    let newMatchId=matchId;
    while(updateMoreGames){
      const match=await manager.find.nextMatches(newMatchId);
      if(match[0].opponent1?.id==playerId && match[0].opponent1?.result=="win"){
        newMatchId=Number(match[0].id);
        const matchContainer=this.addHTMLAttributes(`${newMatchId}`);
        this.renderer.addClass(matchContainer?.children[0].children[1].children[0], 'incorrectPrediction');
        this.totalPredictions+=1; // original totalPredictions variable does not account for future matches that are impossible to happen
      }
      else if(match[0].opponent2?.id==playerId && match[0].opponent2?.result=="win"){
        newMatchId=Number(match[0].id);
        const matchContainer=this.addHTMLAttributes(`${newMatchId}`);
        this.renderer.addClass(matchContainer?.children[0].children[2].children[0], 'incorrectPrediction');
        this.totalPredictions+=1; // original totalPredictions variable does not account for future matches that are impossible to happen
      }
      else{
        updateMoreGames=false;
      }
    }
  }
}
