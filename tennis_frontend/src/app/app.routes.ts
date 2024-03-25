import { Routes } from '@angular/router';
import { ViewBracketComponent } from './view-bracket/view-bracket.component';
import { CreateBracketComponent } from './create-bracket/create-bracket.component';
import { ChooseTournament } from './choose/choose.component';

export const routes: Routes = [
  { path: 'view/:name', component: ViewBracketComponent },
  { path: 'create/:name', component: CreateBracketComponent },
  { path: 'choose', component: ChooseTournament },
  { path: '', redirectTo: 'choose', pathMatch: 'full'},
  { path: '**', redirectTo: 'choose'} // no match to user entered route
];
