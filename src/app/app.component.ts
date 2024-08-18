import { Component } from '@angular/core';
import { EventHandlerPayload } from '@livechat/widget-angular'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
//export class AppComponent {
  //title = 'chatBot';
//}

export class AppComponent {
  handleNewEvent(event: EventHandlerPayload<'onNewEvent'>) {
    console.log('LiveChatWidget.onNewEvent', event)
  }
}
