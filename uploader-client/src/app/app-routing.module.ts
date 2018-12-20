import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VotersComponent} from './voters/voters.component';
import { CandidatesComponent } from './candidates/candidates.component';

const routes: Routes = [{ path: 'voters', component: VotersComponent },
{ path: 'candidates', component: CandidatesComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
