import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, FormGroup, FormArray, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DialogData } from '../interfaces';

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
    CommonModule
  ],
})
export class MatchOverviewDialog implements OnInit {
  displayedColumns: string[] = ['Player', 'First Set', 'Second Set', 'Third Set'];
  tennisScores: FormGroup = this.formBuilder.group({
    playerScore: this.formBuilder.array([])
  });
  playerScore: FormArray = this.tennisScores.get('playerScore') as FormArray;
  tableDataSource: MatTableDataSource<AbstractControl> = new MatTableDataSource();
  winPlayerNumber: number = 0;
  losePlayerNumber: number = 1;

  constructor(
    public dialogRef: MatDialogRef<MatchOverviewDialog>,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
    const player1 = this.formBuilder.group({ player: [this.data.player1.name], firstSet: [''], secondSet: [''], thirdSet: [''] });
    const player2 = this.formBuilder.group({ player: [this.data.player2.name], firstSet: [''], secondSet: [''], thirdSet: [''] });
    this.playerScore.push(player1);
    this.playerScore.push(player2);
    this.tableDataSource = new MatTableDataSource((this.tennisScores.get('playerScore') as FormArray).controls);
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

}
