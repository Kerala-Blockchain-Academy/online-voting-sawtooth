import { Component, OnInit } from '@angular/core';
import {UploaderService} from '../uploader.service'

@Component({
  selector: 'app-candidates',
  templateUrl: './voters.component.html',
  styleUrls: ['./voters.component.css']
})
export class VotersComponent implements OnInit {

  constructor(private Data : UploaderService) { }

  ngOnInit() {
  }
  async voterUploader(event){
   
    event.preventDefault()
    const target = event.target
    const voName = target.querySelector('#vo_name').value;
    const voId = target.querySelector('#vo_id').value;
    const voPassword = target.querySelector('#vo_password').value;
    const voStation = target.querySelector('#vo_station').value;
    console.log("values:",voId,voName,voPassword,voStation);    
    var uploadResult = await this.Data.sendData("voter-upload", [voName,voId,voPassword,voStation])//;.subscribe({});
    console.log("upload Result:", uploadResult)
    
    // this.Data.getUserDetails(username)
  }
}
