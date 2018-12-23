import {Component, OnInit, ViewChild, ElementRef} from "@angular/core";
import {MessageService} from "./message.service";
import {Message} from "../model/message.model";
import {Subscription, fromEvent, merge} from "rxjs";
import {map, mergeMap, debounceTime, buffer, filter, startWith} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {GithubUser} from "../model/github-user.model";

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  @ViewChild('btn') btn : ElementRef<any>;
  @ViewChild('refreshButton') refreshButton : ElementRef<any>;
  @ViewChild('closeButton1') closeButton1 : ElementRef<any>;

  doubleClickMessage: string;
  noDoubleClickMessage: string;

  messageStream: Subscription;
  message: Message;
  index: number = 0;

  githubUsers: GithubUser[];// = new Array<GithubUser>();
  userSuggestion1: GithubUser;
  userSuggestion2: GithubUser;
  userSuggestion3: GithubUser;

  constructor(private messageService: MessageService, private http: HttpClient) {
    this.messageStream = this.messageService.getCurrentMessage()
      .subscribe(
        response => {
          console.log("onNext");
          this.message = response },
        () => { console.log("onError") },
        () => { console.log("onComplete") }
        );
  }

  ngOnInit() {

    /** refreshing the list of GitHub users to follow
     * creating a refreshClickStream on the button click (resulting in MouseEvents)
     * and a "null" stream on every click (used to nullify the output
     * and thus hide the suggestion element).
     */
    const rxRefreshButton = this.refreshButton.nativeElement;
    const refreshClick$ = fromEvent(rxRefreshButton, 'click');
    const refreshClickNull$ = refreshClick$.pipe(map( () => { return null; } ));

    /** Close 1 close this user and replace by new one
     *  close this user and replace by new one from latest response stream.
     *  it will only pick from latest response stream using that one as cache
     */
    // const rxCloseButton1 = this.closeButton1.nativeElement;
    // const closeClick1$ = fromEvent(rxCloseButton1, 'double click');

    /** request stream, initially "faking" startup click,
     * and from then on reacting on every refresh click by returning
     * a users-URL from a random starting point (".../users?=since=...")
     */
    const request$ = refreshClick$.pipe(
      startWith('startup click'),
      map( () => {
        let randomOffset = Math.floor(Math.random()*5000);
        return 'https://api.github.com/users?since=' + randomOffset;
      }));

    /** response stream, using URL of returned by the request stream to
     * call Github API. mergeMap is used to flatten out the JSON that
     * is returned by HttpClient in yet another Observable.
     */
    const response$ = request$.pipe(
      mergeMap( requestUrl => {
        return this.http.get(requestUrl.toString());
      }));

    /**
     * Suggestion1 Stream is for first GitHub user to display.
     * Using some Math functions we randomly select a GitHub user
     * from the response stream. Then merge with the null stream
     * to stop rendering first user later on.
     */
    const suggestion1$ = merge(
      // first part to merge
      response$.pipe(
        map((listUsers: GithubUser[]) => {
          // get one random user from the list
          return listUsers[Math.floor(Math.random()*listUsers.length)];
        }),
        debounceTime(200)
      ),
      // second part to merge
      refreshClickNull$)
      // initial null so that nothing is rendered until we have a user to display
      .pipe(startWith(null));

    /** render suggestion1
     *  when null nothing will be displayed. When user is returned it will be displayed
     *  (handled using *ngIf in HTML)
     */
    suggestion1$.subscribe((user: GithubUser) => {
      console.log(user);
      this.userSuggestion1 = user;
    });

    /**
     * Suggestion2 Stream is for first GitHub user to display.
     * Using some Math functions we randomly select a GitHub user
     * from the response stream. Then merge with the null stream
     * to stop rendering first user later on.
     */
    const suggestion2$ = merge(
      // first part to merge
      response$.pipe(
        map((listUsers: GithubUser[]) => {
          // get one random user from the list
          return listUsers[Math.floor(Math.random()*listUsers.length)];
        }),
        debounceTime(400)
      ),
      // second part to merge
      refreshClickNull$)
    // initial null so that nothing is rendered until we have a user to display
      .pipe(startWith(null));

    /** render suggestion2
     *  when null nothing will be displayed. When user is returned it will be displayed
     *  (handled using *ngIf in HTML)
     */
    suggestion2$.subscribe((user: GithubUser) => {
      console.log(user);
      this.userSuggestion2 = user;
    });

    /**
     * Suggestion3 Stream is for first GitHub user to display.
     * Using some Math functions we randomly select a GitHub user
     * from the response stream. Then merge with the null stream
     * to stop rendering first user later on.
     */
    const suggestion3$ = merge(
        // first part to merge
        response$.pipe(
          map((listUsers: GithubUser[]) => {
            // get one random user from the list
            return listUsers[Math.floor(Math.random()*listUsers.length)];
          }),
          debounceTime(600)
        ),
        // second part to merge
        refreshClickNull$)
      // initial null so that nothing is rendered until we have a user to display
        .pipe(startWith(null));

    /** render suggestion3
     *  when null nothing will be displayed. When user is returned it will be displayed
     *  (handled using *ngIf in HTML)
     */
    suggestion3$.subscribe((user: GithubUser) => {
      console.log(user);
      this.userSuggestion3 = user;
    });

    const toLength = a => a.length;
    const rxBtn = this.btn.nativeElement;                           // get the button element
    const click$ = fromEvent(rxBtn, 'click');                       // listen for clicks
    const debounced$ = click$.pipe(debounceTime(250));              // listen for 250 ms then emit click
    const buffered$ = click$.pipe(buffer(debounced$));              // collect all clicks till debounce
    const clickCount$ = buffered$.pipe(map(toLength));              // map buffered$ to #clicks
    const doubleClick$ = clickCount$.pipe(filter(x => x === 2));    // only double clicks
    const notDoubleClick$ = clickCount$.pipe(filter(x => x !== 2)); // only the not double clicks

    doubleClick$.subscribe(
      () => {
        this.doubleClickMessage = "Double click";
        this.noDoubleClickMessage="";
      }
    );

    clickCount$.subscribe(
      (response) => {
        console.log(response);
      }
    );

    notDoubleClick$.subscribe(
      () => {
        this.noDoubleClickMessage = "Not a double click";
        this.doubleClickMessage="";
      }
    );

  };

  add() {
    this.index += 1;
    this.messageService.setCurrentMessage(new Message(this.index));
  };

  substract() {
    this.index -= 1;
    this.messageService.setCurrentMessage(new Message(this.index));
  };

  clear() {
    this.index = 0;
    this.doubleClickMessage="";
    this.noDoubleClickMessage="";
    this.messageService.clearCurrentMessage();
  };

}
