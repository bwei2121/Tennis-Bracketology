import { Match, MatchGame, Participant, Result, Stage, StageType } from "brackets-model";

export interface Dataset {
  title: string;
  type: StageType;
  roster: Roster[];
}

export interface Roster {
  id: number;
  name: string;
}

export interface BracketManagerData {
  stages: Stage[];
  matches: Match[];
  matchGames: MatchGame[];
  participants: Participant[];
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