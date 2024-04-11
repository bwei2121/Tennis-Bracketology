import { Routes } from '@angular/router';
import { ViewBracketComponent } from './view-bracket/view-bracket.component';
import { PredictBracketComponent } from './predict-bracket/predict-bracket.component';
import { ChooseTournament } from './choose/choose.component';
import { CreditsComponent } from './credits/credits.components';

export const routes: Routes = [
  { path: 'view/:name', component: ViewBracketComponent },
  { path: 'predict/:name', component: PredictBracketComponent },
  { path: 'choose', component: ChooseTournament },
  { path: 'credits', component: CreditsComponent},
  { path: '', redirectTo: 'choose', pathMatch: 'full'},
  { path: '**', redirectTo: 'choose'} // no match to user entered route
];
