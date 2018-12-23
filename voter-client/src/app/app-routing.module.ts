import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VoteComponent} from './vote/vote.component';
import {AuthenticateComponent} from './authenticate/authenticate.component'


const routes: Routes = [{ path: 'vote', component: VoteComponent },
{ path: '', component: AuthenticateComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
