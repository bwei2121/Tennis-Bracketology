import { Component, OnInit } from "@angular/core";
import axios from 'axios';
import { BracketsManager } from "brackets-manager";
import { getNearestPowerOfTwo } from "brackets-manager/dist/helpers";
import { InMemoryDatabase } from "brackets-memory-db";
import { BackendData, BracketManagerData, Dataset, Roster } from "../interfaces";

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
    this.processBracketData(this.createDataForBracketViewer(roster, title)).then((data: BracketManagerData) => window.bracketsViewer.render(data));
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
   * Create participant arrray usable for brackets-manager library
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
   * Create a tennis bracket using brackets-manager library and formatting data that can be usable by brackets-viewer library
   * @param dataset: backend data representing tennis bracket data for a tournament
   * @returns Promise<BracketManagerData>: data format usable by brackets-viewer library
   */
  async processBracketData(dataset: Dataset): Promise<BracketManagerData> {
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
  
    const data = await manager.get.stageData(0);
  
    return {
      stages: data.stage,
      matches: data.match,
      matchGames: data.match_game,
      participants: data.participant,
    };
  }
}