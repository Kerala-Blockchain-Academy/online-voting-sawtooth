import { TestBed, inject } from '@angular/core/testing';

import { UploaderService } from './uploader.service';

describe('UploaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VotingService]
    });
  });

  it('should be created', inject([UploaderService], (service: UploaderService) => {
    expect(service).toBeTruthy();
  }));
});
