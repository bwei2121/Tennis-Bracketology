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
    templateUrl: 'dialog.component.html',
    styleUrls: ['dialog.component.scss'],
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

  async ngOnInit(): Promise<void> {
    const player1 = this.formBuilder.group({ player: [this.data.player1.playerName], firstSet: [''], secondSet: [''], thirdSet: [''] });
    const player2 = this.formBuilder.group({ player: [this.data.player2.playerName], firstSet: [''], secondSet: [''], thirdSet: [''] });
    this.playerScore.push(player1);
    this.playerScore.push(player2);
    this.tableDataSourcePrediction = new MatTableDataSource((this.tennisScores.get('playerScore') as FormArray).controls);
    const h2hRequest=await axios.get("http://localhost:8000/player", {
      params: {
        player: this.parsePlayerName(this.data.player1.playerName, ''),
        opponent: this.parsePlayerName(this.data.player2.playerName, ' '),
        opponentParsed: this.parsePlayerName(this.data.player2.playerName, '')
      }
    });
    const playersData: PlayersData=h2hRequest.data;
    const h2h: H2H=playersData.h2hData;
    const player1Rank=playersData.playerRank;
    const player2Rank=playersData.opponentRank;
    this.h2hLoaded=true;
    const tableDataSourceInformation: MatchInfoDialog[] = [
      {player: this.data.player1.playerName, playerParsed: this.parsePlayerName(this.data.player1.playerName, ''), opponent: this.parsePlayerName(this.data.player2.playerName, ''), h2h: h2h.wins, rank: player1Rank},
      {player: this.data.player2.playerName, playerParsed: this.parsePlayerName(this.data.player2.playerName, ''), opponent: this.parsePlayerName(this.data.player1.playerName, ''), h2h: h2h.losses, rank: player2Rank}
    ]
    this.tableDataSourceInformation = new MatTableDataSource(tableDataSourceInformation);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  setPlayerWinner(player: string, playerNumber: number): void{
    this.data.playerWinner=player;
    this.winPlayerNumber=playerNumber;
    this.losePlayerNumber=this.winPlayerNumber ^ 1;
  }

  sendData(): void {
    const winningScores = this.playerScore.controls[this.winPlayerNumber].value;
    const losingScores = this.playerScore.controls[this.losePlayerNumber].value;
    this.data.winner=Number(`${winningScores['firstSet']}${winningScores['secondSet']}${winningScores['thirdSet']}`);
    this.data.loser=Number(`${losingScores['firstSet']}${losingScores['secondSet']}${losingScores['thirdSet']}`);
    this.dialogRef.close(this.data);
  }

  parsePlayerName(playerName: string, joinString: string): string {
    let nameArray=playerName.split(' ');
    if(nameArray.length>=1 && nameArray[0].includes('(') && nameArray[0].includes(')')){
      nameArray.splice(0, 1);
    }
    return nameArray.join(joinString);
  }
}
