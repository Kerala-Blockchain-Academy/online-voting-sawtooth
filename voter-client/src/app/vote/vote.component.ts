import { Component, OnInit } from '@angular/core';
import { VotingService } from '../voting.service'
import { Router } from "@angular/router";

@Component({
  selector: 'app-vote',
  templateUrl: './vote.component.html',
  styleUrls: ['./vote.component.scss']
})
export class VoteComponent implements OnInit {
  public candidateDetails : any;
  public vo_name : any;

  constructor(private Data: VotingService,private router : Router  ) { }

  ngOnInit() {
    this.Data.createAddress('')
    this.vo_name = this.Data.voName
    if(this.Data.auth == false){
      alert("You have to authenticate to enter here")
      this.router.navigate(['']);
    }
    this.Data.sendToRestAPI(null)
    .then((candidateData) => {
      //on initialization fetching candidate data from server
        console.log(candidateData);
        this.candidateDetails=JSON.parse(candidateData);
        console.log("Parsed data:",this.candidateDetails.candidates);
        this.candidateDetails=this.candidateDetails.candidates;
      })
      .catch((error) => {
        console.error(error);
      }); 
      
  }
  //sending the vote to tp for processing
  public async vote(item){
    var x = document.getElementsByClassName("button-secondary");
        var i;
        for (i = 0; i < x.length; i++) {
            (<HTMLElement>x[i]).setAttribute("disabled", "disabled");
        }
      console.log("item:",item)
      await this.Data.sendData("vote", item);
       await this.Data.setVote();
       this.router.navigate(['']);
  }

}
