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
  matchId?: number; // match id of first round for player
  alignment?: ScrollLogicalPosition; // alignment used to scroll to player on bracket
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
  method: string;
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

export interface MatchInfoDialog {
  player: string;
  playerParsed: string;
  opponent: string;
  h2h: number; // head to head wins
  h2hOpp: number; // opponent's head to head wins
  rank: number;
  tourType: string;
}

export interface H2H {
  wins: number;
  losses: number;
}

export interface PlayersData {
  h2hData: H2H;
  playerRank: number;
  opponentRank: number;
  tourType: string;
}

export interface License {
  title: string;
  licenseName: string;
  copyright: string;
  licenseText: string;
}