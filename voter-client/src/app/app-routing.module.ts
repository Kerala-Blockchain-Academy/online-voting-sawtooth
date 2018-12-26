import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VoteComponent} from './vote/vote.component';
import {AuthenticateComponent} from './authenticate/authenticate.component'
import {AdminComponent} from './admin/admin.component'


const routes: Routes = [{ path: 'vote', component: VoteComponent },
{ path: '', component: AuthenticateComponent },
{ path: 'admin', component: AdminComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
