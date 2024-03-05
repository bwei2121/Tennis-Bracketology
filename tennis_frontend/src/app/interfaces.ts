import { BracketsManager } from "brackets-manager";
import { Match, MatchGame, Participant, Result, Stage, StageType } from "brackets-model";

export interface Dataset {
  title: string;
  type: StageType;
  roster: Roster[];
}

export interface Roster {
  playerId: number;
  playerName: string;
}

export interface BracketManagerData {
  stages: Stage[];
  matches: Match[];
  matchGames: MatchGame[];
  participants: Participant[];
}

export interface ProcessData {
  managerData: BracketManagerData,
  manager: BracketsManager
}

export interface BackendData {
  title: string;
  roster: Roster[];
  results: MatchInfo[];
}

export interface MatchInfo {
  id1: number;
  id2: number;
  opponent1: MatchResult;
  opponent2: MatchResult;
}

export interface MatchResult {
  score: number;
  result?: Result;
}

export interface DialogData {
  winner: number;
  loser: number;
  player1: Roster;
  player2: Roster;
  playerWinner: string;
}

export interface Tournament {
  title: string; 
  url: string;
  recent: boolean;
}