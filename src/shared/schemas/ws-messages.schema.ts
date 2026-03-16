import { z } from "zod";

export const WsOutgoingMediaSchema = z.object({
  event: z.literal("MEDIA"),
  payload: z.object({
    videoFrame: z.string(),
    audioChunk: z.string().optional(),
    codeEditorText: z.string().optional(),
    whiteboardData: z.string().optional(),
    notes: z.string().optional(),
    timestamp: z.number().optional(),
  }),
});

export const WsOutgoingRunCodeSchema = z.object({
  event: z.literal("RUN_CODE"),
});

export const WsOutgoingAlertSchema = z.object({
  event: z.literal("ALERT"),
  type: z.enum(["ENVIRONMENT_BREACH"]),
  message: z.string(),
});

export const WsToolHighlightSchema = z.object({
  type: z.literal("TOOL_HIGHLIGHT"),
  errorLine: z.number(),
});

export const WsProctorWarningSchema = z.object({
  type: z.literal("PROCTOR_WARNING"),
  message: z.string(),
});

export const WsProctorActivitySchema = z.object({
  type: z.literal("PROCTOR_ACTIVITY"),
  message: z.string(),
});

export const WsWorkspaceAlertSchema = z.object({
  type: z.literal("WORKSPACE_ALERT"),
  message: z.string(),
});

export const WsTranscriptSchema = z.object({
  type: z.literal("transcript"),
  speaker: z.enum(["ai", "candidate"]),
  text: z.string(),
  timestamp: z.string(),
  isInterruption: z.boolean().optional(),
});

export const WsInlineDataSchema = z.object({
  type: z.literal("inlineData"),
  mimeType: z.string(),
  data: z.string(),
});

export const WsIncomingMessageSchema = z.discriminatedUnion("type", [
  WsToolHighlightSchema,
  WsProctorWarningSchema,
  WsProctorActivitySchema,
  WsWorkspaceAlertSchema,
  WsTranscriptSchema,
  WsInlineDataSchema,
]);

export const WsOutgoingMessageSchema = z.discriminatedUnion("event", [
  WsOutgoingMediaSchema,
  WsOutgoingRunCodeSchema,
  WsOutgoingAlertSchema,
]);

export type WsOutgoingMedia = z.infer<typeof WsOutgoingMediaSchema>;
export type WsOutgoingRunCode = z.infer<typeof WsOutgoingRunCodeSchema>;
export type WsOutgoingAlert = z.infer<typeof WsOutgoingAlertSchema>;
export type WsToolHighlight = z.infer<typeof WsToolHighlightSchema>;
export type WsProctorWarning = z.infer<typeof WsProctorWarningSchema>;
export type WsProctorActivity = z.infer<typeof WsProctorActivitySchema>;
export type WsWorkspaceAlert = z.infer<typeof WsWorkspaceAlertSchema>;
export type WsTranscript = z.infer<typeof WsTranscriptSchema>;
export type WsInlineData = z.infer<typeof WsInlineDataSchema>;
export type WsIncomingMessage = z.infer<typeof WsIncomingMessageSchema>;
export type WsOutgoingMessage = z.infer<typeof WsOutgoingMessageSchema>;
