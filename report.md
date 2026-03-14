# Things left to do

## 1. Assistant mode
convert tutor mode to assistant mode. instead of asking us questions. let it become our assistant. It should see our screen, no need for camera(it doesnt need our face cam)

it should focus on assistant in coding, email, browsing, and other tasks.

## 2. Interview creation

accept the tools(code, whiteboard, notes) in interview creation. if anyone is disabled, it should not be shown in the interview page so it brings an immersive experience. i.e this is only a coding interview.

## 3. Interview Session

live interview works fine with audio but we need text so we can see.

## 4. Persona creation

When we create a persona, accept language and isadaptive mode. backend currently doesnt accept them and just returns a succesful creation with language as null and isadaptive as null(this should be true or false also).

## 5. 

Monitoring page, We need to ensure it works. 

## 6. Session end

If AI says interview ending soon, implement a timer system or something that shows we need to speak to continue the interview otherwise session ends. A Timer system would be perfect as that would give client a flow to end the session.

if session ends, create an endpoint that would receive a session ended notice so we can then fix the live bug in admin page

if session ends, disable run code button

## 7. Activity detection

currently ui only says we are not looking at screen, we need to show if user is eating, pressing phone, literally any activity. we need to show it in the ui.

## 8. Practice mode

Since we now use a form to enter practice mode, I should be able to select language in practice mode too. Let's not restrict it to English only.


## setting fullscreen and no screencapture (frontend note)

To toggle between **Debug Mode** (current) and **Production Secure Mode** (Hard Gate), follow these steps:

### 1. Enable Fullscreen Lockdown
- **File**: `src/renderer/api/candidate.api.ts`
- **Action**: Locate `initiateLockdown` and uncomment:
  ```typescript
  if (window.owlyn?.lockdown) {
    await window.owlyn.lockdown.toggle(true);
  }
  ```

### 2. Enable Multi-Monitor Restriction
- **File**: `src/renderer/features/interview/InterviewPage.tsx`
- **Action**: In `publishMedia`, uncomment the `return` statement in the `getDisplayCount` check:
  ```typescript
  if (count > 1) {
    setMediaError("Multiple monitors detected...");
    return; // <--- Uncomment this
  }
  ```

### 3. Require Camera & Screen Share (Strict Proctoring)
- **File**: `src/renderer/features/interview/InterviewPage.tsx`
- **Action**: In `publishMedia`, uncomment the `return` and `setIsMediaReady(false)` lines in both the **Camera** and **Screen Share** catch blocks.
  - This prevents the "Start Secure Session" overlay from closing unless both tracks are successfully captured.


Tool use with Live API



Tool use allows Live API to go beyond just conversation by enabling it to perform actions in the real-world and pull in external context while maintaining a real time connection. You can define tools such as Function calling and Google Search with the Live API.

Overview of supported tools
Here's a brief overview of the available tools for Live API models:

Tool	gemini-2.5-flash-native-audio-preview-12-2025
Search	Yes
Function calling	Yes
Google Maps	No
Code execution	No
URL context	No
Function calling
Live API supports function calling, just like regular content generation requests. Function calling lets the Live API interact with external data and programs, greatly increasing what your applications can accomplish.

You can define function declarations as part of the session configuration. After receiving tool calls, the client should respond with a list of FunctionResponse objects using the session.send_tool_response method.

See the Function calling tutorial to learn more.

Note: Unlike the generateContent API, the Live API doesn't support automatic tool response handling. You must handle tool responses manually in your client code.
Python
JavaScript

import asyncio
import wave
from google import genai
from google.genai import types

client = genai.Client()

model = "gemini-2.5-flash-native-audio-preview-12-2025"

# Simple function definitions
turn_on_the_lights = {"name": "turn_on_the_lights"}
turn_off_the_lights = {"name": "turn_off_the_lights"}

tools = [{"function_declarations": [turn_on_the_lights, turn_off_the_lights]}]
config = {"response_modalities": ["AUDIO"], "tools": tools}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        prompt = "Turn on the lights please"
        await session.send_client_content(turns={"parts": [{"text": prompt}]})

        wf = wave.open("audio.wav", "wb")
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)  # Output is 24kHz

        async for response in session.receive():
            if response.data is not None:
                wf.writeframes(response.data)
            elif response.tool_call:
                print("The tool was called")
                function_responses = []
                for fc in response.tool_call.function_calls:
                    function_response = types.FunctionResponse(
                        id=fc.id,
                        name=fc.name,
                        response={ "result": "ok" } # simple, hard-coded function response
                    )
                    function_responses.append(function_response)

                await session.send_tool_response(function_responses=function_responses)

        wf.close()

if __name__ == "__main__":
    asyncio.run(main())
From a single prompt, the model can generate multiple function calls and the code necessary to chain their outputs. This code executes in a sandbox environment, generating subsequent BidiGenerateContentToolCall messages.

Asynchronous function calling
Function calling executes sequentially by default, meaning execution pauses until the results of each function call are available. This ensures sequential processing, which means you won't be able to continue interacting with the model while the functions are being run.

If you don't want to block the conversation, you can tell the model to run the functions asynchronously. To do so, you first need to add a behavior to the function definitions:

Python
JavaScript

# Non-blocking function definitions
turn_on_the_lights = {"name": "turn_on_the_lights", "behavior": "NON_BLOCKING"} # turn_on_the_lights will run asynchronously
turn_off_the_lights = {"name": "turn_off_the_lights"} # turn_off_the_lights will still pause all interactions with the model
NON-BLOCKING ensures the function runs asynchronously while you can continue interacting with the model.

Then you need to tell the model how to behave when it receives the FunctionResponse using the scheduling parameter. It can either:

Interrupt what it's doing and tell you about the response it got right away (scheduling="INTERRUPT"),
Wait until it's finished with what it's currently doing (scheduling="WHEN_IDLE"),
Or do nothing and use that knowledge later on in the discussion (scheduling="SILENT")

Python
JavaScript

# for a non-blocking function definition, apply scheduling in the function response:
  function_response = types.FunctionResponse(
      id=fc.id,
      name=fc.name,
      response={
          "result": "ok",
          "scheduling": "INTERRUPT" # Can also be WHEN_IDLE or SILENT
      }
  )
Grounding with Google Search
You can enable Grounding with Google Search as part of the session configuration. This increases the Live API's accuracy and prevents hallucinations. See the Grounding tutorial to learn more.

Python
JavaScript

import asyncio
import wave
from google import genai
from google.genai import types

client = genai.Client()

model = "gemini-2.5-flash-native-audio-preview-12-2025"

tools = [{'google_search': {}}]
config = {"response_modalities": ["AUDIO"], "tools": tools}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        prompt = "When did the last Brazil vs. Argentina soccer match happen?"
        await session.send_client_content(turns={"parts": [{"text": prompt}]})

        wf = wave.open("audio.wav", "wb")
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)  # Output is 24kHz

        async for chunk in session.receive():
            if chunk.server_content:
                if chunk.data is not None:
                    wf.writeframes(chunk.data)

                # The model might generate and execute Python code to use Search
                model_turn = chunk.server_content.model_turn
                if model_turn:
                    for part in model_turn.parts:
                        if part.executable_code is not None:
                            print(part.executable_code.code)

                        if part.code_execution_result is not None:
                            print(part.code_execution_result.output)

        wf.close()

if __name__ == "__main__":
    asyncio.run(main())
Combining multiple tools
You can combine multiple tools within the Live API, increasing your application's capabilities even more:

Python
JavaScript

prompt = """
Hey, I need you to do two things for me.

1. Use Google Search to look up information about the largest earthquake in California the week of Dec 5 2024?
2. Then turn on the lights

Thanks!
"""

tools = [
    {"google_search": {}},
    {"function_declarations": [turn_on_the_lights, turn_off_the_lights]},
]

config = {"response_modalities": ["AUDIO"], "tools": tools}





Copyright 2026 Google LLC.

1 cell hidden
Multimodal Live API - Quickstart


Preview: The Live API is in preview.

This notebook demonstrates simple usage of the Gemini Multimodal Live API. For an overview of new capabilities refer to the Gemini Live API docs.

This notebook implements a simple turn-based chat where you send messages as text, and the model replies with audio. The API is capable of much more than that. The goal here is to demonstrate with simple code.

Some features of the API are not working in Colab, to try them it is recommended to have a look at this Python script and run it locally.

If you aren't looking for code, and just want to try multimedia streaming use Live API in Google AI Studio.

The Next steps section at the end of this tutorial provides links to additional resources.

Native audio output
Info: Gemini 2.5 introduces native audio generation, which directly generates audio output, providing a more natural sounding audio, more expressive voices, more awareness of additional context, e.g., tone, and more proactive responses. You can try a native audio example in this script.

Setup
Install SDK
The new Google Gen AI SDK provides programmatic access to Gemini 2.5 (and previous models) using both the Google AI for Developers and Vertex AI APIs. With a few exceptions, code that runs on one platform will run on both.

More details about this new SDK on the documentation or in the Getting started notebook.


[ ]
%pip install -U -q google-genai
Note: you may need to restart the kernel to use updated packages.

[notice] A new release of pip is available: 25.1.1 -> 25.2
[notice] To update, run: python.exe -m pip install --upgrade pip
Set up your API key
To run the following cell, your API key must be stored in a Colab Secret named GOOGLE_API_KEY. If you don't already have an API key, or you're not sure how to create a Colab Secret, see Authentication image for an example.


[ ]
from google.colab import userdata
import os

os.environ['GOOGLE_API_KEY'] = userdata.get('GOOGLE_API_KEY')

Initialize SDK client
The client will pick up your API key from the environment variable.


[ ]
from google import genai
from google.genai import types
client = genai.Client(api_key=GOOGLE_API_KEY)
Select a model
The Gemini 2.5 Flash Live model works with the Live API to enable low-latency bidirectional voice and video interactions with Gemini. The model can process text, audio, and video input, and it can provide text and audio output.


[ ]
MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025'  # @param ['gemini-2.0-flash-live-001', 'gemini-live-2.5-flash-preview', 'gemini-2.5-flash-native-audio-preview-09-2025'] {allow-input: true, isTemplate: true}
MODEL
gemini-2.5-flash-native-audio-preview-09-2025

Import
Import all the necessary modules.


[ ]
import asyncio
import base64
import contextlib
import datetime
import os
import json
import wave
import itertools

from IPython.display import display, Audio

from google import genai
from google.genai import types
Text to Text
The simplest way to use the Live API is as a text-to-text chat interface, but it can do a lot more than this.


[ ]
config={
    "response_modalities": ["TEXT"]
}

async with client.aio.live.connect(model=MODEL, config=config) as session:
  message = "Hello? Gemini are you there?"
  print("> ", message, "\n")
  await session.send_client_content(
        turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
  )

  # For text responses, When the model's turn is complete it breaks out of the loop.
  turn = session.receive()
  async for chunk in turn:
    if chunk.text is not None:
      print(f'- {chunk.text}')
>  Hello? Gemini are you there? 

- Hello
-  there! I am indeed here. How can I help you today?
Simple text to audio
The simplest way to playback the audio in Colab, is to write it out to a .wav file. So here is a simple wave file writer:


[ ]
@contextlib.contextmanager
def wave_file(filename, channels=1, rate=24000, sample_width=2):
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        yield wf
The next step is to tell the model to return audio by setting "response_modalities": ["AUDIO"] in the LiveConnectConfig.

When you get a response from the model, then you write out the data to a .wav file.


[ ]
config={
    "response_modalities": ["AUDIO"]
}

async def async_enumerate(aiterable):
  n=0
  async for item in aiterable:
    yield n, item
    n+=1


async with client.aio.live.connect(model=MODEL, config=config) as session:
  file_name = 'audio.wav'
  with wave_file(file_name) as wav:
    message = "Hello? Gemini are you there?"
    print("> ", message, "\n")
    await session.send_client_content(
        turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
    )

    turn = session.receive()
    async for n,response in async_enumerate(turn):
      if response.data is not None:
        wav.writeframes(response.data)

        if n==0:
          print(response.server_content.model_turn.parts[0].inline_data.mime_type)
        print('.', end='')


display(Audio(file_name, autoplay=True))


Towards Async Tasks
The real power of the Live API is that it's real time, and interruptable. You can't get that full power in a simple sequence of steps. To really use the functionality you will move the send and recieve operations (and others) into their own async tasks.

Because of the limitations of Colab this tutorial doesn't totally implement the interactive async tasks, but it does implement the next step in that direction:

It separates the send and receive, but still runs them sequentially.
In the next tutorial you'll run these in separate async tasks.
Setup a quick logger to make debugging easier (switch to setLevel('DEBUG') to see debugging messages).


[ ]
import logging

logger = logging.getLogger('Live')
logger.setLevel('INFO')
The class below implements the interaction with the Live API.


[ ]
class AudioLoop:
  def __init__(self, turns=None,  config=None):
    self.session = None
    self.index = 0
    self.turns = turns
    if config is None:
      config={
          "response_modalities": ["AUDIO"]}
    self.config = config

  async def run(self):
    logger.debug('connect')
    async with client.aio.live.connect(model=MODEL, config=self.config) as session:
      self.session = session

      async for sent in self.send():
        # Ideally send and recv would be separate tasks.
        await self.recv()

  async def _iter(self):
    if self.turns:
      for text in self.turns:
        print("message >", text)
        yield text
    else:
      print("Type 'q' to quit")
      while True:
        text = await asyncio.to_thread(input, "message > ")

        # If the input returns 'q' quit.
        if text.lower() == 'q':
          break

        yield text

  async def send(self):
    async for text in self._iter():
      logger.debug('send')

      # Send the message to the model.
      await self.session.send_client_content(
        turns={"role": "user", "parts": [{"text": text}]}, turn_complete=True
      )
      logger.debug('sent')
      yield text

  async def recv(self):
    # Start a new `.wav` file.
    file_name = f"audio_{self.index}.wav"
    with wave_file(file_name) as wav:
      self.index += 1

      logger.debug('receive')

      # Read chunks from the socket.
      turn = self.session.receive()
      async for n, response in async_enumerate(turn):
        logger.debug(f'got chunk: {str(response)}')

        if response.data is None:
          logger.debug(f'Unhandled server message! - {response}')
        else:
          wav.writeframes(response.data)
          if n == 0:
            print(response.server_content.model_turn.parts[0].inline_data.mime_type)
          print('.', end='')

      print('\n<Turn complete>')

    display(Audio(file_name, autoplay=True))
    await asyncio.sleep(2)

There are 3 methods worth describing here:

run - The main loop

This method:

Opens a websocket connecting to the Live API.
Calls the initial setup method.
Then enters the main loop where it alternates between send and recv until send returns False.
The next tutorial will demonstrate how to stream media and run these asynchronously.
send - Sends input text to the api

The send method collects input text from the user, wraps it in a client_content message (an instance of BidiGenerateContentClientContent), and sends it to the model.

If the user sends a q this method returns False to signal that it's time to quit.

recv - Collects audio from the API and plays it

The recv method collects audio chunks in a loop and writes them to a .wav file. It breaks out of the loop once the model sends a turn_complete method, and then plays the audio.

To keep things simple in Colab it collects all the audio before playing it. Other examples demonstrate how to play audio as soon as you start to receive it (using PyAudio), and how to interrupt the model (implement input and audio playback on separate tasks).

Run
Run it:


[ ]
await AudioLoop(['Hello', "What's your name?"]).run()

Working with resumable sessions
Session resumption allows you to return to a previous interaction with the Live API by sending the last session handle you got from the previous session.

When you set your session to be resumable, the session information keeps stored on the Live API for up to 24 hours. In this time window, you can resume the conversation and refer to previous information you have shared with the model.

Helper functions
Start by creating the helper functions for your resumable interaction with the Live API. It will include:


[ ]
import asyncio
import traceback
from asyncio.exceptions import CancelledError

last_handle = None

#MODEL =  "gemini-live-2.5-flash-preview"

client = genai.Client(api_key=GOOGLE_API_KEY)

async def async_enumerate(aiterable):
  n=0
  async for item in aiterable:
    yield n, item
    n+=1


def show_response(response):
    new_handle = None
    if text := response.text:
        print(text, end="")
    else:
      print(response.model_dump_json(indent=2, exclude_none=True))
    if response.session_resumption_update:
        new_handle = response.session_resumption_update.new_handle
    return new_handle


async def clock():
  time = 0
  while True:
    await asyncio.sleep(60)
    time += 1
    print(f"{time}:00")


async def recv(session):
  global last_handle
  try:
    while True:
        async for response in session.receive():
            new_handle = show_response(response)
            if new_handle:
                last_handle = new_handle
  except asyncio.CancelledError:
    pass


async def send(session):
  while True:
      message = await asyncio.to_thread(input, "message > ")
      if message.lower() == "q":
          break
      await session.send_client_content(turns={
          'role': 'user',
          'parts': [{'text': message}]
      })


async def async_main(last_handle=None):
  config = types.LiveConnectConfig.model_validate({
      "response_modalities": ["TEXT"],
      "session_resumption": {
          'handle': last_handle,
      }
  })
  try:
    async with (
        client.aio.live.connect(model=MODEL, config=config) as session,
        asyncio.TaskGroup() as tg
    ):
        clock_task = tg.create_task(clock())
        recv_task = tg.create_task(recv(session))
        send_task = tg.create_task(send(session))
        await send_task
        raise asyncio.CancelledError()
  except asyncio.CancelledError:
      pass
  except ExceptionGroup as EG:
      traceback.print_exception(EG)
Now you can start interacting with the Live API (type q to finish the conversation):


[ ]
await async_main()
{
  "session_resumption_update": {}
}
Hello there! How can I help you today?{
  "server_content": {
    "generation_complete": true
  }
}
{
  "server_content": {
    "turn_complete": true
  },
  "usage_metadata": {
    "prompt_token_count": 9,
    "response_token_count": 10,
    "total_token_count": 19,
    "prompt_tokens_details": [
      {
        "modality": "TEXT",
        "token_count": 9
      }
    ],
    "response_tokens_details": [
      {
        "modality": "TEXT",
        "token_count": 10
      }
    ]
  }
}
{
  "session_resumption_update": {
    "new_handle": "Cig2N3lqa3d3MXd4eHFoeDk3cnhmeHUydjlhdHN2cms1bDRnc3c0N2Zq",
    "resumable": true
  }
}
1:00
{
  "session_resumption_update": {}
}
The capital of Brazil is **Brasília**.{
  "server_content": {
    "generation_complete": true
  }
}
{
  "server_content": {
    "turn_complete": true
  },
  "usage_metadata": {
    "prompt_token_count": 36,
    "response_token_count": 9,
    "total_token_count": 45,
    "prompt_tokens_details": [
      {
        "modality": "TEXT",
        "token_count": 36
      }
    ],
    "response_tokens_details": [
      {
        "modality": "TEXT",
        "token_count": 9
      }
    ]
  }
}
{
  "session_resumption_update": {
    "new_handle": "Cig0ZDR1OTViNHVjOWh6aGJvMmhwdWk3NzJiZWRwYW91bnNtajgxZHN1",
    "resumable": true
  }
}
With the session resumption you have the session handle to refer to your previous sessions. In this example, the handle is saved at the last_handle variable as below:


[ ]
last_handle
'Cig0ZDR1OTViNHVjOWh6aGJvMmhwdWk3NzJiZWRwYW91bnNtajgxZHN1'
Now you can start a new Live API session, but this time pointing to a handle from a previous session. Also, to test you could gather information from the previous session, you will ask the model what was the second question you asked before (in this example, it was "what is the capital of Brazil?"). You can see the Live API recovering that information:


[ ]
await async_main(last_handle)
{
  "session_resumption_update": {}
}
The last question you asked was: "what is the capital of brazil?"{
  "server_content": {
    "generation_complete": true
  }
}
{
  "server_content": {
    "turn_complete": true
  },
  "usage_metadata": {
    "prompt_token_count": 63,
    "response_token_count": 15,
    "total_token_count": 78,
    "prompt_tokens_details": [
      {
        "modality": "TEXT",
        "token_count": 63
      }
    ],
    "response_tokens_details": [
      {
        "modality": "TEXT",
        "token_count": 15
      }
    ]
  }
}
{
  "session_resumption_update": {
    "new_handle": "CihyNDg4YTkxanl5cThzYmo4a29lMHRveDJlY3U1amRyNHlqeWF0bWU2",
    "resumable": true
  }
}
Next steps

This tutorial just shows basic usage of the Live API, using the Python GenAI SDK.

If you aren't looking for code, and just want to try multimedia streaming use Live API in Google AI Studio.
If you want to see how to setup streaming interruptible audio and video using the Live API see the Audio and Video input Tutorial.
If you're interested in the low level details of using the websockets directly, see the websocket version of this tutorial.
Try the Tool use in the live API tutorial for an walkthrough of Gemini-2.5's new use capabilities.
There is a Streaming audio in Colab example, but this is more of a demo, it's not optimized for readability.
Other nice Gemini 2.5 examples can also be found in the Cookbook's example directory, in particular the video understanding and the spatial understanding ones.




Session management with Live API



In the Live API, a session refers to a persistent connection where input and output are streamed continuously over the same connection (read more about how it works). This unique session design enables low latency and supports unique features, but can also introduce challenges, like session time limits, and early termination. This guide covers strategies for overcoming the session management challenges that can arise when using the Live API.

Session lifetime
Without compression, audio-only sessions are limited to 15 minutes, and audio-video sessions are limited to 2 minutes. Exceeding these limits will terminate the session (and therefore, the connection), but you can use context window compression to extend sessions to an unlimited amount of time.

The lifetime of a connection is limited as well, to around 10 minutes. When the connection terminates, the session terminates as well. In this case, you can configure a single session to stay active over multiple connections using session resumption. You'll also receive a GoAway message before the connection ends, allowing you to take further actions.

Context window compression
To enable longer sessions, and avoid abrupt connection termination, you can enable context window compression by setting the contextWindowCompression field as part of the session configuration.

In the ContextWindowCompressionConfig, you can configure a sliding-window mechanism and the number of tokens that triggers compression.

Python
JavaScript

from google.genai import types

config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    context_window_compression=(
        # Configures compression with default parameters.
        types.ContextWindowCompressionConfig(
            sliding_window=types.SlidingWindow(),
        )
    ),
)
Session resumption
To prevent session termination when the server periodically resets the WebSocket connection, configure the sessionResumption field within the setup configuration.

Passing this configuration causes the server to send SessionResumptionUpdate messages, which can be used to resume the session by passing the last resumption token as the SessionResumptionConfig.handle of the subsequent connection.

Resumption tokens are valid for 2 hr after the last sessions termination.

Python
JavaScript

import asyncio
from google import genai
from google.genai import types

client = genai.Client()
model = "gemini-2.5-flash-native-audio-preview-12-2025"

async def main():
    print(f"Connecting to the service with handle {previous_session_handle}...")
    async with client.aio.live.connect(
        model=model,
        config=types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            session_resumption=types.SessionResumptionConfig(
                # The handle of the session to resume is passed here,
                # or else None to start a new session.
                handle=previous_session_handle
            ),
        ),
    ) as session:
        while True:
            await session.send_client_content(
                turns=types.Content(
                    role="user", parts=[types.Part(text="Hello world!")]
                )
            )
            async for message in session.receive():
                # Periodically, the server will send update messages that may
                # contain a handle for the current state of the session.
                if message.session_resumption_update:
                    update = message.session_resumption_update
                    if update.resumable and update.new_handle:
                        # The handle should be retained and linked to the session.
                        return update.new_handle

                # For the purposes of this example, placeholder input is continually fed
                # to the model. In non-sample code, the model inputs would come from
                # the user.
                if message.server_content and message.server_content.turn_complete:
                    break

if __name__ == "__main__":
    asyncio.run(main())
Receiving a message before the session disconnects
The server sends a GoAway message that signals that the current connection will soon be terminated. This message includes the timeLeft, indicating the remaining time and lets you take further action before the connection will be terminated as ABORTED.

Python
JavaScript

async for response in session.receive():
    if response.go_away is not None:
        # The connection will soon be terminated
        print(response.go_away.time_left)
Receiving a message when the generation is complete
The server sends a generationComplete message that signals that the model finished generating the response.

Python
JavaScript

async for response in session.receive():
    if response.server_content.generation_complete is True:
        # The generation is complete


# ... remaining model call

  - 