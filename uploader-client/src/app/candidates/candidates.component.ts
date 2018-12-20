import { Component, OnInit } from '@angular/core';
import {UploaderService} from '../uploader.service'
 
@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.css']
})
export class CandidatesComponent implements OnInit {

  constructor(private Data : UploaderService) { }

  ngOnInit() {
  }
  async CandidateUploader(event){
   
    event.preventDefault()
    const target = event.target
    const caName = target.querySelector('#ca_name').value;
    const caId = target.querySelector('#ca_id').value;
    const station = target.querySelector('#station').value;
    console.log("values:",caName,caId,station);    
    var uploadResult = await this.Data.sendData("candidate-upload", [caName,caId,station])//;.subscribe({});
    console.log("upload Result:", uploadResult)
    
    // this.Data.getUserDetails(username)
  }
}

