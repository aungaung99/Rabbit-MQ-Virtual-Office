import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BrokerSnapshot } from '../models/broker.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  readonly isConnected = signal<boolean>(false);
  readonly liveSnapshot = signal<BrokerSnapshot | null>(null);

  connect(hubUrl: string = 'http://localhost:5000/hubs/monitoring') {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveBrokerSnapshot', (snapshot: BrokerSnapshot) => {
      this.liveSnapshot.set(snapshot);
    });

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
        console.log('SignalR connected to RabbitMQ Virtual Office backend');
      })
      .catch((err) => {
        this.isConnected.set(false);
        console.warn('SignalR could not connect to backend, falling back to simulated demo mode:', err);
      });

    this.hubConnection.onreconnecting(() => this.isConnected.set(false));
    this.hubConnection.onreconnected(() => this.isConnected.set(true));
    this.hubConnection.onclose(() => this.isConnected.set(false));
  }

  disconnect() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.isConnected.set(false);
    }
  }
}
