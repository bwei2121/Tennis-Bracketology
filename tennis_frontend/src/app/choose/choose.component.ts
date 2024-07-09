import { Component, OnInit, ViewChild } from "@angular/core";
import axios from "axios";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { Tournament } from "../interfaces";
import { LoadingComponent } from "../loading/loading.components";
import { HeaderComponent } from "../header/header.component";

@Component({
    standalone: true,
    selector: 'choose-tournament',
    templateUrl: 'choose.component.html',
    styleUrls: ['choose.component.scss'],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        RouterModule,
        MatRadioModule,
        FormsModule,
        LoadingComponent,
        HeaderComponent
    ]
})
export class ChooseTournament implements OnInit {
  displayedColumns: string[] = ['title'];
  tournaments: Tournament[]=[];
  dataSource: MatTableDataSource<Tournament> = new MatTableDataSource(this.tournaments);
  bracketChoice: string = "view";
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  loaded: boolean = false;
  loadingText: string = "Loading tournaments...";
  
  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      // will set radio button to most recent bracketChoice if user comes back to choose tournaments page
      if(event instanceof NavigationStart){
        sessionStorage.setItem("bracketChoice", this.bracketChoice)
      }
    })
  }

  /**
   * Gets all tournaments from backend, setup MatTable to display tournament names to user, and store bracketChoice in sessionStorage
   */
  async ngOnInit(): Promise<void> {
    const bracketChoice=sessionStorage.getItem("bracketChoice");
    if(bracketChoice){
      this.bracketChoice=bracketChoice;
    }
    else{
      sessionStorage.setItem("bracketChoice", "view");
    }
    await this.getAllTournaments();
    this.loaded = true;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Gets all tournaments from the backend, adds tournament titles to MatTable dataSource
   * Store all tournaments into sessionStorage, easily display tournaments after initial retrieval of tournaments
   * @returns Promise<void>: tournaments titles will be loaded into MatTable dataSource
   */
  async getAllTournaments(): Promise<void> {
    const tournaments=sessionStorage.getItem("tournaments");
    if(tournaments){
      this.tournaments=JSON.parse(tournaments);
    }
    else{
      const data=(await axios.get('http://localhost:8000/tournaments')).data;
      this.tournaments=JSON.parse(JSON.stringify(data))['tournaments'];
      sessionStorage.setItem("tournaments", JSON.stringify(this.tournaments));
    }
    this.dataSource=new MatTableDataSource(this.tournaments);
  }

  /**
   * Sorts what tournaments to display based on user input
   * @param event: event data related to user pressing a key in input 
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Navigate to credits page
   */
  navigateToCredits() {
    this.router.navigate(['/credits']);
  }
}