import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { License } from '../interfaces';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'credits',
  templateUrl: 'credits.component.html',
  styleUrls: ['credits.component.scss'],
  imports: [
    CommonModule
  ],
})
export class CreditsComponent {
  licenses: License[] = [
    { title: "brackets-manager", licenseName: "MIT License", copyright: "Copyright (c) 2021 Corentin Girard", licenseText: "MIT" },
    { title: "brackets-viewer", licenseName: "MIT License", copyright: "Copyright (c) 2020 Corentin Girard", licenseText: "MIT" },
    { title: "axios", licenseName: "MIT License", copyright: "Copyright (c) 2014-present Matt Zabriskie & Collaborators", licenseText: "MIT" },
    { title: "Angular", licenseName: "MIT License", copyright: "Copyright (c) 2024 Google LLC.", licenseText: "MIT" },
    { title: "Angular Material", licenseName: "MIT License", copyright: "Copyright (c) 2024 Google LLC.", licenseText: "MIT" },
    { title: "Django", licenseName: "BSD-3-Clause License", copyright: "Copyright (c) Django Software Foundation and individual contributors. All rights reserved.", licenseText: "BSD-3-Clause" },
    { title: "django-cors-headers", licenseName: "MIT License", copyright: "Copyright (c) 2017 Otto Yiu (https://ottoyiu.com) and other contributors.", licenseText: "MIT" },
    { title: "djangorestframework", licenseName: "BSD License", copyright: "Copyright © 2011-present, Encode OSS Ltd. All rights reserved.", licenseText: "BSD"},
    { title: "requests", licenseName: "Apache Software License (Apache 2.0)", copyright: "Copyright 2019 Kenneth Reitz", licenseText: "Apache" },
    { title: "beautifulsoup4", licenseName: "MIT License", copyright: "Copyright (c) 2004-2022 Leonard Richardson", licenseText: "MIT" },
    { title: "Tennis Abstract (https://www.tennisabstract.com/)", licenseName: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License", copyright: "Copyright (c) Jeff Sackmann", licenseText: "CC BY-NC-SA" },
    { title: "Python", licenseName: "Python Software Foundation (PSF) License", copyright: "Copyright (c) 2001-present Python Software Foundation; All Rights Reserved", licenseText: "PSF" },
    { title: "Best-README-Template", licenseName: "MIT License", copyright: "Copyright (c) 2021 Othneil Drew", licenseText: "MIT" }
  ];

  constructor(private router: Router) {}
  
  /**
   * Sends user to choosing tournaments page
   */
  navigateToChooseTournaments() {
    this.router.navigate(['/choose']);
  }
}
