# -*- coding: utf-8 -*-
import appModuleHandler
import speech
import time
import threading

import sys
import os
sys.path.insert(0, str(os.environ.get('APPDATA')) + '\\nvda\\addons\\crosscode\\websocket-client-1.6.4')
import websocket

class CrossCodeWebSocketClient:
    def __init__(self, appModule: appModuleHandler.AppModule):
        self.appModule: AppModule = appModule
        self.doReconnect = False
        self.running = False

    def on_data(self, ws: websocket.WebSocketApp, msg: str, dataType, continueFlag):
        if msg == 'interrupt':
            self.appModule.script_interruptSpeech()
        elif msg.startswith('speak '):
            msg = msg[len('speak '):]
            self.appModule.script_speak(msg)
    
    
    def on_close(self, ws: websocket.WebSocketApp, close_status_code, close_msg):
        self.running = False
        if self.doReconnect:
            time.sleep(5)
            self.connect()

    def connect(self):
        if self.running:
            return
        self.doReconnect = True
    
        self.ws: websocket.WebSocketApp = websocket.WebSocketApp('ws://localhost:16390', on_close=self.on_close, on_data=self.on_data)

        def run_forever():
            self.running = True
            self.ws.run_forever()
    
        threading.Thread(target=run_forever).start()

    def terminate(self):
        self.doReconnect = False
        self.ws.close()


class AppModule(appModuleHandler.AppModule):
    def __init__(self, *args, **kwargs):
        super(AppModule, self).__init__(*args, **kwargs)
        self.client = CrossCodeWebSocketClient(self)
    
    def terminate(self):
        self.client.terminate()

    def event_NVDAObject_init(self, _):
        self.client.connect()

    def script_speak(self, text):
        speech.speakMessage(text)

    def script_interruptSpeech(self):
        speech.cancelSpeech()
