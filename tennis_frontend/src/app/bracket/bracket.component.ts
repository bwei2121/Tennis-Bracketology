import { Component, OnInit } from "@angular/core";
import axios from 'axios';
import { BracketsManager } from "brackets-manager";
import { getNearestPowerOfTwo } from "brackets-manager/dist/helpers";
import { InMemoryDatabase } from "brackets-memory-db";
import { BackendData, BracketManagerData, Dataset, MatchInfo, Roster } from "../interfaces";
import { Match } from "brackets-model";

@Component({
  standalone: true,
  selector: 'bracket',
  templateUrl: 'bracket.component.html',
  styleUrls: ['bracket.component.scss'],
  imports: []
})
export class BracketComponent implements OnInit {
  TOURNAMENT_ID: number = 0;

  /**
   * Gets bracket data from backend and process that data using the brackets-manager and brackets-viewer libraries
   */
  async ngOnInit(): Promise<void> {
    const bracketDataset: BackendData=await this.getBracketData();
    const title: string=bracketDataset['title'];
    const roster: Roster[]=bracketDataset['roster'];
    const results: MatchInfo[]=bracketDataset['results'];
    this.processBracketData(this.createDataForBracketViewer(roster, title), results).then((data: BracketManagerData) => window.bracketsViewer.render(data));
  }

  /**
   * Gets bracket data from backend using axios
   * @returns Promise<BackendData>: Returns bracket data from backend
   */
  async getBracketData(): Promise<BackendData> {
    const bracketData=(await axios.get('http://localhost:8000/bracket')).data;
    return bracketData;
  }

  /**
   * Create a tennis bracket using brackets-manager library and formatting data that can be usable by brackets-viewer library
   * @param dataset: backend data representing tennis bracket data for a tournament
   * @returns Promise<BracketManagerData>: data format usable by brackets-viewer library
   */
  async processBracketData(dataset: Dataset, matchResults: MatchInfo[]): Promise<BracketManagerData> {
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
  
    // add images for players
    await window.bracketsViewer.setParticipantImages(this.createDataForPictures(dataset.roster));

    await this.updateMatches(matchResults, manager); 
    
    const data = await manager.get.stageData(0);
  
    return {
      stages: data.stage,
      matches: data.match,
      matchGames: data.match_game,
      participants: data.participant,
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
    let matchesToUpdate: Match[]=await manager.get.currentMatches(0);
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
      matchesToUpdate=await manager.get.currentMatches(0);
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
}