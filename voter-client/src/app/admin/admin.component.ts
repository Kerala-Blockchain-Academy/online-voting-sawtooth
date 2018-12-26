import { Component, OnInit } from '@angular/core';
import{VotingService} from  '../voting.service'

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  public candidateDetails : any;
  public totCount : any;

  constructor(private Data : VotingService) { }

  ngOnInit() {
    this.Data.createAddress('')
    document.getElementById("show").hidden = true;
 
  }
  async showResult(){

    this.Data.sendToRestAPI(null)
    .then((candidateData) => {
      //on initialization fetching candidate data from server
        console.log(candidateData);
        this.candidateDetails=JSON.parse(candidateData);
        this.totCount=this.candidateDetails.totalVoted;
        console.log("Parsed data:",this.candidateDetails.candidates);
        this.candidateDetails=this.candidateDetails.candidates;
      })
      .catch((error) => {
        console.error(error);
      });

    document.getElementById("show").hidden = false;
  }

}
