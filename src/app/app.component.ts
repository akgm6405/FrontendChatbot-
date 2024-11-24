import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WidgetStateService, WidgetStateSubject } from '@livechat/widget-angular';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  widgetState$: WidgetStateSubject;
  sessionId: string;
  userInput: string = '';
  messages: { text: string, isUser: boolean }[] = [];
  isChatOpen: boolean = false;
  isLoading: boolean = false;

  constructor(
    private widgetStateService: WidgetStateService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.widgetState$ = widgetStateService.subject;
    this.sessionId = '';
  }

  ngOnInit() {
    this.widgetState$.subscribe((widgetState) => {
      console.log('Widget State:', widgetState);
    });

    this.sessionId = localStorage.getItem('sessionId') || uuidv4();
    localStorage.setItem('sessionId', this.sessionId);
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

      
  
  async sendMessage(userInput: string): Promise<void> {
    if (!userInput || this.isLoading) return;

    this.messages.push({ text: userInput, isUser: true });
    this.userInput = '';
    this.isLoading = true;

    try {
        const ip = await this.getIpAddress();
        const baseAPI = 'http://127.0.0.1:8000';
        const requestBody = {
            conv_id: this.sessionId,
            ip: ip,
            user_input: userInput
        };

        console.log('Request Body:', requestBody);

        const response = await fetch(`${baseAPI}/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response Status:', response.status);
        console.log('Response Object:', response);

        if (response.ok && response.body) {
            console.log('Message sent successfully.');

            const reader = response.body.getReader();
            const textDecoder = new TextDecoder("utf-8");
            let completeResult = '';

            // Read the streaming response
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                let chunk = textDecoder.decode(value);
                chunk = chunk.replace(/^data:\s*/gm, ''); // Remove 'data:' prefix
                completeResult += chunk;
            }

            console.log('Complete Result from Stream:', completeResult);

            // Split and process each line in the complete result
            const lines = completeResult.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                try {
                    const extractedData = JSON.parse(line);

                    // Check if the message field exists before processing
                    if (extractedData.message) {
                        let apiMessage = extractedData.message;

                        // Remove any leading "<number>:" pattern
                        apiMessage = apiMessage.replace(/^\d+:\s*/, '').trim();

                        console.log('Cleaned API message:', apiMessage);

                        // Display the clean API message in the chat
                        this.displayMessage(apiMessage);
                    } else {
                        console.info('No "message" field in extracted data:', extractedData);
                    }
                } catch (parseError) {
                    console.warn('Failed to parse line as JSON:', parseError, line);
                }
            }
        } else {
            console.error('Error sending message to chatbot:', response.statusText);
        }
    } catch (error: any) {
        console.error('Error during sendMessage:', error.message || error);
    } finally {
        this.isLoading = false;
    }
}

    

  async getIpAddress(): Promise<string> {
    try {
      const response = await fetch('https://ipinfo.io/json?token=56cfb1067eac5b');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP address:', error);
      return 'Unknown';
    }
  }

  displayMessage(message: string) {
    console.log('Chatbot says:', message);
    this.messages.push({ text: message, isUser: false });
    this.cdr.detectChanges(); // Force Angular to detect the change
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage(this.userInput);
    }
  }
}
