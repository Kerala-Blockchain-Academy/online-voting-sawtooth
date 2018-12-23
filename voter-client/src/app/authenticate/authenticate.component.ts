import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import{VotingService} from  '../voting.service'

@Component({
  selector: 'app-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.scss']
})
export class AuthenticateComponent implements OnInit {
  public authData : any;
  public user : any;
  public pass : any;

  constructor(private router : Router ,private Data : VotingService) { }

  ngOnInit() {
  }
  
 async onSubmit(event){
    event.preventDefault()
    const target = event.target
    const voId = target.querySelector('#ID').value;
    const voPass = target.querySelector('#password').value;
   await this.Data.createAddress(voId);
    this.Data.sendToRestAPI(null)
    .then((voterData) => {
      //on initialization fetching voter data from server
        if(voterData == undefined)
        {
          alert("Invalid ID");
          target.querySelector('#ID').value='';
          target.querySelector('#password').value='';
        }
        console.log(voterData);
        this.authData=JSON.parse(voterData);
        this.user=this.authData.id;
        this.pass=this.authData.password;
        this.Data.voName=this.authData.name;
        if(voId == this.user && voPass == this.pass){
          if(this.authData.voted == false){
            if(this.authData.station != this.Data.station_name)
            {
              alert("Your alloted polling station is different, you can't vote here");
              target.querySelector('#ID').value='';
              target.querySelector('#password').value='';
              voterData = undefined
            }
            else{
            this.Data.auth = true;
            this.Data.voId = voId;
            this.router.navigate(['/vote']);
            }
          }
          else{
            alert("You are already voted");
            target.querySelector('#ID').value='';
            target.querySelector('#password').value='';
            voterData = undefined
          }

        }
        else{
          alert("Authentication failed")
          target.querySelector('#ID').value='';
          target.querySelector('#password').value='';
          voterData = undefined
        }

      })
      .catch((error) => {
        console.error(error);
      }); 

    }  
}
