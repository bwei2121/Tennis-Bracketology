import { Match, MatchGame, Participant, Stage, StageType } from "brackets-model";

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
}