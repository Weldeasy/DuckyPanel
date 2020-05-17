import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { MatTableDataSource } from '@angular/material/table'
import { DnsCheck, DnsCheckError, DnsCheckMxRecord, DomainsService as ApiDomainsService } from 'duckyapi-angular'
import { Observable, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { ErrorSnackbarService } from 'src/app/shared/components/error-snackbar/error-snackbar.service'

import { DomainsService } from '../domains/domains.service'
import { DnsCheckTxtRecord } from './dns.interfaces'

@Component({
  selector: 'app-dns',
  templateUrl: './dns.component.html',
  styleUrls: ['./dns.component.scss'],
})
export class DnsComponent implements OnInit {
  public constructor(
    private breakpointObserver: BreakpointObserver,
    private apiDomainsService: ApiDomainsService,
    public domainsService: DomainsService,
    private errorSnackbarService: ErrorSnackbarService,
  ) {}

  public selectedDomain: string
  public dnsCheck: DnsCheck
  public dnsCheckSubscription: Subscription
  public correctMxDataSource: MatTableDataSource<DnsCheckMxRecord> = new MatTableDataSource()
  public correctMxDisplayedColumns = ['name', 'server', 'priority']
  public correctTxtDataSource: MatTableDataSource<DnsCheckTxtRecord> = new MatTableDataSource()
  public correctTxtDisplayedColumns = ['name', 'content']
  public errorDataSource: MatTableDataSource<DnsCheckError> = new MatTableDataSource()
  public errorDisplayedColumns = ['type', 'message']

  public isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result): boolean => result.matches))

  public domainForm: FormGroup = new FormGroup({
    domain: new FormControl(null),
  })

  public ngOnInit(): void {
    this.domainForm.controls['domain'].valueChanges.subscribe((value): void => {
      this.selectedDomain = value
      this.checkDNS(value)
    })
  }

  public checkDNS(domain: string): void {
    this.dnsCheckSubscription = this.apiDomainsService.checkDNS(domain).subscribe(
      (dnsCheck): void => {
        this.dnsCheck = dnsCheck
        this.errorDataSource.data = dnsCheck.errors
        this.correctMxDataSource.data = dnsCheck.correctValues.mx
        this.correctTxtDataSource.data = []
        this.correctTxtDataSource.data.push({
          content: dnsCheck.correctValues.spf,
        })
        if (dnsCheck.correctValues.dkim) {
          this.correctTxtDataSource.data.push({
            content: dnsCheck.correctValues.dkim.value,
            isDkim: true,
          })
        }
      },
      (error) => {
        this.errorSnackbarService.open(error)
      },
    )
  }
}
