import { useState, useEffect } from "react";
import { interviewsApi } from "@/api/interviews.api";
import { personasApi } from "@/api/personas.api";
import { extractApiError } from "@/lib/api-error";
import type { Persona } from "@shared/schemas/persona.schema";

export function useCreateInterview(onSuccess: (code: string) => void) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draftedQuestions, setDraftedQuestions] = useState("");
  const [step, setStep] = useState<"info" | "questions">("info");
  
  const [newInterview, setNewInterview] = useState({
    title: "",
    jobTitle: "",
    instructions: "",
    questionCount: 5,
    personaId: "",
    candidateName: "",
    candidateEmail: "",
    durationMinutes: 30,
    toolsEnabled: { codeEditor: true, whiteboard: false, notes: true },
  });

  useEffect(() => {
    personasApi.getPersonas().then(setPersonas).catch(console.error);
  }, []);

  const generateQuestions = async () => {
    if (newInterview.durationMinutes > 30) {
      alert("Session duration cannot exceed 30 minutes.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await interviewsApi.generateQuestions({
        jobTitle: newInterview.jobTitle || newInterview.title,
        instructions: newInterview.instructions || undefined,
        questionCount: newInterview.questionCount || undefined,
      });
      setDraftedQuestions(res.draftedQuestions);
      setStep("questions");
    } catch (error) {
      setDraftedQuestions("");
      setStep("questions");
      alert(extractApiError(error).message + "\nYou can type manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const createInterview = async () => {
    setIsCreating(true);
    try {
      const res = await interviewsApi.createInterview({
        title: newInterview.title,
        durationMinutes: newInterview.durationMinutes,
        toolsEnabled: newInterview.toolsEnabled,
        personaId: newInterview.personaId || undefined,
        generatedQuestions: draftedQuestions || undefined,
        aiInstructions: newInterview.instructions || undefined,
        candidateName: newInterview.candidateName,
        candidateEmail: newInterview.candidateEmail,
      });
      onSuccess(res.accessCode);
      reset();
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setNewInterview({
      title: "",
      jobTitle: "",
      instructions: "",
      questionCount: 5,
      personaId: "",
      candidateName: "",
      candidateEmail: "",
      durationMinutes: 30,
      toolsEnabled: { codeEditor: true, whiteboard: false, notes: true },
    });
    setDraftedQuestions("");
    setStep("info");
  };

  return {
    personas,
    isGenerating,
    isCreating,
    draftedQuestions,
    setDraftedQuestions,
    step,
    setStep,
    newInterview,
    setNewInterview,
    generateQuestions,
    createInterview,
    reset
  };
}
