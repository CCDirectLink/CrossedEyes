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
        self.running = False
        self.doReconnect = False
        self.loopRunning = False

    def on_data(self, ws: websocket.WebSocketApp, msg: str, dataType, continueFlag):
        if msg == None:
            return
        if msg == "clearQueue":
            self.appModule.script_interruptSpeech()
        elif msg.startswith("speak "):
            msg = msg[len("speak ") :]
            self.appModule.script_speak(msg)

    def on_open(self, ws: websocket.WebSocket):
        self.running = True
        log.info("CrossCode server connected")

    def on_close(self, ws: websocket.WebSocket, _, __):
        self.running = False
        log.info("CrossCode server disconnected")

    def on_speech_end(self):
        if self.running == True:
            self.ws.send("speechEnd")

    def run_forever(self):
        self.loopRunning = True
        self.ws: websocket.WebSocketApp = websocket.WebSocketApp(
            "ws://localhost:16390",
            on_open=self.on_open,
            on_close=self.on_close,
            on_data=self.on_data,
        )
        self.ws.run_forever()

        if self.doReconnect:
            time.sleep(5)
            self.tryReconnect()
        else:
            self.loopRunning = False

    def tryReconnect(self):
        if self.doReconnect:
            self.run_forever()
        else:
            self.loopRunning = False

    def run(self):
        if self.running or self.loopRunning:
            return
        self.doReconnect = True
        log.info("starting websocket CrossCode server...")
        threading.Thread(target=self.run_forever).start()

    def terminate(self):
        self.doReconnect = False
        self.running = False
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
