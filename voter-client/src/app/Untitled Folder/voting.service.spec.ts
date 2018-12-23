import { TestBed, inject } from '@angular/core/testing';

import { VotingService } from './voting.service';

describe('UploaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VotingService]
    });
  });

  it('should be created', inject([VotingService], (service: VotingService) => {
    expect(service).toBeTruthy();
  }));
});
