/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { SlickGrid } from './../../components/js/SlickGrid';

import { AppComponent }  from './app.component';

@NgModule({
  imports: [
    BrowserModule
  ],
  declarations: [ AppComponent, SlickGrid ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
