// Custom Hook para gestión de templates
// Implementa SRP - Solo operaciones de templates

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { fetchWithAuth } from '@/services/ApiService';
import type { Template, CreateTemplateData } from '../../../shared/schema';

// Hook para obtener todos los templates del usuario
export function useTemplates(userId: string): UseQueryResult<Template[]> {
  return useQuery({
    queryKey: ['templates', userId],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/templates');
      return response.templates || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId,
  });
}

// Hook para obtener templates por ubicación
export function useLocationTemplates(locationId: number): UseQueryResult<Template[]> {
  return useQuery({
    queryKey: ['templates', 'location', locationId],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/locations/${locationId}/templates`);
      return response.templates || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!locationId,
  });
}

// Hook para obtener templates por grupo
export function useGroupTemplates(groupId: number): UseQueryResult<Template[]> {
  return useQuery({
    queryKey: ['templates', 'group', groupId],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/groups/${groupId}/templates`);
      return response.templates || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!groupId,
  });
}

// Hook para crear un template
export function useCreateTemplate(): UseMutationResult<Template, Error, CreateTemplateData & { userId: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateData & { userId: string }) => {
      const response = await fetchWithAuth('/api/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate all template queries for this user
      queryClient.invalidateQueries({ 
        queryKey: ['templates', variables.userId] 
      });
      
      // Also invalidate location/group specific queries if applicable
      if (variables.locationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['templates', 'location', variables.locationId] 
        });
      }
      if (variables.groupId) {
        queryClient.invalidateQueries({ 
          queryKey: ['templates', 'group', variables.groupId] 
        });
      }
    },
  });
}

// Hook para actualizar un template
export function useUpdateTemplate(): UseMutationResult<Template, Error, { id: number; data: Partial<Template> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetchWithAuth(`/api/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate all template queries
      queryClient.invalidateQueries({ 
        queryKey: ['templates'] 
      });
    },
  });
}

// Hook para eliminar un template
export function useDeleteTemplate(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await fetchWithAuth(`/api/templates/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['templates'] 
      });
    },
  });
}

// Hook combinado con todas las acciones de template
export function useTemplateActions(userId: string) {
  const templates = useTemplates(userId);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const queryClient = useQueryClient();

  const invalidateTemplates = () => {
    queryClient.invalidateQueries({ queryKey: ['templates', userId] });
  };

  return {
    templates: templates.data || [],
    isLoading: templates.isLoading,
    error: templates.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    invalidateTemplates,
    refetch: templates.refetch,
  };
}

// Hook para filtrar templates por tipo
export function useTemplatesByType(userId: string, type: string): UseQueryResult<Template[]> {
  return useQuery({
    queryKey: ['templates', userId, 'type', type],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/templates');
      const allTemplates = response.templates || [];
      return allTemplates.filter((template: Template) => template.type === type);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && !!type,
  });
}

// Hook para filtrar templates por canal
export function useTemplatesByChannel(userId: string, channel: string): UseQueryResult<Template[]> {
  return useQuery({
    queryKey: ['templates', userId, 'channel', channel],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/templates');
      const allTemplates = response.templates || [];
      return allTemplates.filter((template: Template) => 
        template.channel === channel || template.channel === 'both'
      );
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && !!channel,
  });
}




