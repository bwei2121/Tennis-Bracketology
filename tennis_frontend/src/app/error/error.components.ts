import { Component } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'error-dialog',
  templateUrl: 'error.component.html',
  styleUrls: ['error.component.scss'],
  imports: [
    MatDialogClose
  ],
})
export class ErrorDialog {

  constructor(
    public dialogRef: MatDialogRef<ErrorDialog>
  ) {}

  /**
   * Close Error Dialog
   */
  close(): void {
    this.dialogRef.close();
  }

}
