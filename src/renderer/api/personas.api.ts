import { apiClient } from "@/lib/api-client";
import type { Persona } from "@shared/schemas/persona.schema";

export const personasApi = {
  getPersonas: async () => {
    const { data } = await apiClient.get<Persona[]>("/api/personas");
    return data;
  },

  createPersona: async (formData: FormData) => {
    const { data } = await apiClient.post<Persona>("/api/personas", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  updatePersona: async (id: string, formData: FormData) => {
    const { data } = await apiClient.put<Persona>(`/api/personas/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deletePersona: async (id: string) => {
    await apiClient.delete(`/api/personas/${id}`);
  },
};
