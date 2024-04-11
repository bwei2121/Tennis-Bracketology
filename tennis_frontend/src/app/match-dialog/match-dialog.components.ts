import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, FormGroup, FormArray, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DialogData, H2H, MatchInfoDialog, PlayersData } from '../interfaces';
import axios from 'axios';
import { LoadingComponent } from "../loading/loading.components";

@Component({
    standalone: true,
    selector: 'match-overview-dialog',
    templateUrl: 'match-dialog.component.html',
    styleUrls: ['match-dialog.component.scss'],
    imports: [
        MatDialogClose,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatTableModule,
        ReactiveFormsModule,
        CommonModule,
        LoadingComponent
    ]
})
export class MatchOverviewDialog implements OnInit {
  displayedColumnsPrediction: string[] = ['Player', 'First Set', 'Second Set', 'Third Set'];
  displayedColumnsInformation: string[] = ['Player', 'Current Rank', 'Head to Head'];
  tennisScores: FormGroup = this.formBuilder.group({
    playerScore: this.formBuilder.array([])
  });
  playerScore: FormArray = this.tennisScores.get('playerScore') as FormArray;
  tableDataSourcePrediction: MatTableDataSource<AbstractControl> = new MatTableDataSource();
  winPlayerNumber: number = 0;
  losePlayerNumber: number = 1;
  tableDataSourceInformation: MatTableDataSource<MatchInfoDialog> = new MatTableDataSource();
  h2hLoaded: boolean = false;
  loadingText: string = "Loading match information...";

  constructor(
    public dialogRef: MatDialogRef<MatchOverviewDialog>,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  /**
   * Sets up match information statistics and match prediction panels
   */
  async ngOnInit(): Promise<void> {
    const player1 = this.formBuilder.group({ player: [this.data.player1.playerName], firstSet: [''], secondSet: [''], thirdSet: [''] });
    const player2 = this.formBuilder.group({ player: [this.data.player2.playerName], firstSet: [''], secondSet: [''], thirdSet: [''] });
    this.playerScore.push(player1);
    this.playerScore.push(player2);
    this.tableDataSourcePrediction = new MatTableDataSource((this.tennisScores.get('playerScore') as FormArray).controls);
    const h2hRequest=await axios.get("http://localhost:8000/player", {
      params: {
        player: this.modifyPlayerName(this.data.player1.playerName, ''),
        opponent: this.modifyPlayerName(this.data.player2.playerName, ' '),
        opponentParsed: this.modifyPlayerName(this.data.player2.playerName, '')
      }
    });
    const playersData: PlayersData=h2hRequest.data;
    const h2h: H2H=playersData.h2hData;
    const player1Rank=playersData.playerRank;
    const player2Rank=playersData.opponentRank;
    const tourType=playersData.tourType;
    this.h2hLoaded=true;
    const tableDataSourceInformation: MatchInfoDialog[] = [
      {
        player: this.data.player1.playerName, playerParsed: this.modifyPlayerName(this.data.player1.playerName, ''), 
        opponent: this.modifyPlayerName(this.data.player2.playerName, ''), h2h: h2h.wins, h2hOpp: h2h.losses, 
        rank: player1Rank, tourType: tourType
      },
      {
        player: this.data.player2.playerName, playerParsed: this.modifyPlayerName(this.data.player2.playerName, ''), 
        opponent: this.modifyPlayerName(this.data.player1.playerName, ''), h2h: h2h.losses, h2hOpp: h2h.wins, 
        rank: player2Rank, tourType: tourType
      }
    ]
    this.tableDataSourceInformation = new MatTableDataSource(tableDataSourceInformation);
  }

  /**
   * Sets player winner based on user prediction
   * @param player: name of predicted winning player 
   * @param playerNumber: 1 or 2, top player or bottom player as displayed in popup and in bracket respectively 
   * Returns void
   */
  setPlayerWinner(player: string, playerNumber: number): void {
    this.data.playerWinner=player;
    this.winPlayerNumber=playerNumber;
    this.losePlayerNumber=this.winPlayerNumber ^ 1;
  }

  /**
   * Modify winning and loser scores to align with scores stored in tennis bracket and 
   * send data to bracket component 
   * @returns void
   */
  sendData(): void {
    const winningScores = this.playerScore.controls[this.winPlayerNumber].value;
    const losingScores = this.playerScore.controls[this.losePlayerNumber].value;
    this.data.winner=Number(`${winningScores['firstSet']}${winningScores['secondSet']}${winningScores['thirdSet']}`);
    this.data.loser=Number(`${losingScores['firstSet']}${losingScores['secondSet']}${losingScores['thirdSet']}`);
    this.dialogRef.close(this.data);
  }

  /**
   * Modify player names, used for displaying name in dialog and url searches on backend to get player/match data
   * @param playerName: name of player 
   * @param joinString: string used to modify player name 
   * @returns string: modified player name
   */
  modifyPlayerName(playerName: string, joinString: string): string {
    let nameArray=playerName.split(' ');
    if(nameArray.length>=1 && nameArray[0].includes('(') && nameArray[0].includes(')')){
      nameArray.splice(0, 1);
    }
    return nameArray.join(joinString);
  }
}
