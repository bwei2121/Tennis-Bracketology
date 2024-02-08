import { Component, OnInit } from "@angular/core";
import axios from 'axios';

@Component({
  standalone: true,
  selector: 'bracket',
  templateUrl: 'bracket.component.html',
  styleUrls: ['bracket.component.scss'],
  imports: []
})
export class BracketComponent implements OnInit {
  async ngOnInit(): Promise<void> {
    await this.getBracketData();
  }

  async getBracketData(): Promise<void> {
    const bracketData=(await axios.get('http://localhost:8000/bracket')).data;
    console.log(bracketData);
  }
}