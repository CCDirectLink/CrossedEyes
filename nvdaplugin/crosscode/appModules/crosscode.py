# -*- coding: utf-8 -*-
import appModuleHandler  # type: ignore
import speech  # type: ignore
from logHandler import log  # type: ignore
import time
import threading

import sys
import os

sys.path.insert(
    0,
    str(os.environ.get("APPDATA"))
    + "\\nvda\\addons\\crosscode\\websocket-client-1.6.4",
)
import websocket


class CrossCodeWebSocketClient:
    def __init__(self, appModule: appModuleHandler.AppModule):
        self.appModule: AppModule = appModule
        self.socketConnected = False
        self.doReconnect = False
        self.thread = None

    def on_data(self, ws: websocket.WebSocketApp, msg: str, dataType, continueFlag): # type: ignore
        if msg == None:
            return
        if msg == "clearQueue":
            self.appModule.script_interruptSpeech()
        elif msg.startswith("speak "):
            msg = msg[len("speak ") :]
            self.appModule.script_speak(msg)

    def on_open(self, ws: websocket.WebSocket):
        self.socketConnected = True
        log.info("CrossCode server connected")

    def on_close(self, ws: websocket.WebSocket, _, __):
        self.socketConnected = False
        log.info("CrossCode server disconnected")

    def on_speech_end(self):
        if self.socketConnected == True:
            self.ws.send("speechEnd")

    def run_forever(self):
        while self.doReconnect: 
            self.ws = websocket.WebSocketApp( # type: ignore
                "ws://localhost:16390",
                on_open=self.on_open,
                on_close=self.on_close,
                on_data=self.on_data,
            )
            self.ws.run_forever()
            time.sleep(5)

    def run(self):
        if self.socketConnected or (self.thread != None and self.thread.is_alive()):
            return

        log.info("starting websocket CrossCode server...")
        self.doReconnect = True
        self.thread = threading.Thread(target=self.run_forever)
        self.thread.start()

    def terminate(self):
        self.doReconnect = False
        self.socketConnected = False
        self.ws.close()


class AppModule(appModuleHandler.AppModule):
    def __init__(self, *args, **kwargs):
        super(AppModule, self).__init__(*args, **kwargs)
        self.client = CrossCodeWebSocketClient(self)
        copy = speech._manager._handleDoneSpeaking
        speech._manager._handleDoneSpeaking = lambda *args: (
            self.client.on_speech_end(),
            copy(*args),
        )

    def terminate(self):
        self.client.terminate()

    def event_NVDAObject_init(self, _):
        self.client.run()

    def script_speak(self, text):
        speech.speakMessage(text)

    def script_interruptSpeech(self):
        speech.cancelSpeech()
