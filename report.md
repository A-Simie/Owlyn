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