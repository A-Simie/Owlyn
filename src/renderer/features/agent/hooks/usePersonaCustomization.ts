import { useState, useEffect, useCallback } from "react";
import { personasApi } from "@/api/personas.api";
import { extractApiError } from "@/lib/api-error";
import type { Persona } from "@shared/schemas/persona.schema";

export function usePersonaCustomization() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isAdaptive, setIsAdaptive] = useState(true);
  const [sliders, setSliders] = useState({ empathy: 50, analytical: 50, directness: 50 });
  const [selectedTone, setSelectedTone] = useState("mentor");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["Kubernetes", "Go Lang"]);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 3000);
  };

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await personasApi.getPersonas();
      setPersonas(data);
    } catch (error) {
      console.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const resetForm = () => {
    setName("");
    setContextFiles([]);
    setSelectedPersona(null);
    setSliders({ empathy: 50, analytical: 50, directness: 50 });
    setSelectedTone("mentor");
    setSelectedDomains(["Kubernetes", "Go Lang"]);
    setSelectedLanguage("English");
    setIsAdaptive(true);
  };

  const handleEdit = (persona: Persona) => {
    setSelectedPersona(persona);
    setName(persona.name);
    setSliders({
      empathy: persona.empathyScore || 50,
      analytical: persona.analyticalDepth || 90,
      directness: persona.directnessScore || 50,
    });
    setSelectedTone((persona.tone?.toLowerCase() as any) || "mentor");
    setSelectedDomains(persona.domainExpertise || []);
    setSelectedLanguage(persona.language || "English");
    setIsAdaptive(persona.isAdaptive ?? true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this persona?")) return;
    try {
      await personasApi.deletePersona(id);
      setPersonas(personas.filter((p) => p.id !== id));
      if (selectedPersona?.id === id) resetForm();
      showStatus("Persona deleted.");
    } catch (error) {
      showStatus(extractApiError(error).message, "error");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showStatus("Persona name is required.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const personaData = {
        name,
        empathyScore: sliders.empathy,
        analyticalDepth: sliders.analytical,
        directnessScore: sliders.directness,
        tone: selectedTone.toUpperCase(),
        domainExpertise: selectedDomains,
        language: selectedLanguage,
        isAdaptive,
      };

      const fd = new FormData();
      fd.append("persona", new Blob([JSON.stringify(personaData)], { type: "application/json" }));
      if (contextFiles.length > 0) fd.append("file", contextFiles[0]);

      if (selectedPersona) {
        await personasApi.updatePersona(selectedPersona.id, fd);
        showStatus("Persona updated.");
      } else {
        await personasApi.createPersona(fd);
        showStatus("Persona saved.");
      }
      
      fetchPersonas();
      resetForm();
    } catch (error) {
      showStatus(extractApiError(error).message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    personas,
    selectedPersona,
    loading,
    isSaving,
    status,
    form: {
      name, setName,
      contextFiles, setContextFiles,
      selectedLanguage, setSelectedLanguage,
      isAdaptive, setIsAdaptive,
      sliders, setSliders,
      selectedTone, setSelectedTone,
      selectedDomains, setSelectedDomains,
    },
    actions: {
      resetForm,
      handleEdit,
      handleDelete,
      handleSave,
    }
  };
}
