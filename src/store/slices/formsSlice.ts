
import { StateCreator } from 'zustand';
import { SavedForm, FormField, FormFieldType } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AppStore } from '../index';

export interface FormsSlice {
  // State
  savedForms: SavedForm[];
  currentForm: SavedForm | null;
  fields: FormField[];
  selectedFieldId: string | null;
  formsLoading: boolean;
  maxFormsReached: boolean;
  isHobbyPlan: boolean;
  
  // Actions
  fetchForms: () => Promise<SavedForm[]>;
  saveForm: (formData: { name: string; description: string; isPublic: boolean; knowledgeBaseId?: string }, fields: FormField[], existingForm?: SavedForm) => Promise<SavedForm | null>;
  deleteForm: (formId: string) => Promise<void>;
  loadForm: (form: SavedForm) => void;
  updateCurrentForm: (updates: Partial<SavedForm>) => void;
  addField: (type: FormFieldType) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  deleteField: (fieldId: string) => void;
  moveField: (fieldId: string, direction: 'up' | 'down') => void;
  selectField: (fieldId: string | null) => void;
  startNewForm: () => void;
  duplicateForm: (form: SavedForm) => Promise<void>;
  refreshSingleForm: (formId: string) => Promise<SavedForm | null>;
}

const HOBBY_PLAN_FORM_LIMIT = 5;

export const createFormsSlice: StateCreator<
  AppStore,
  [["zustand/immer", never]],
  [],
  FormsSlice
> = (set, get) => ({
  // Initial state
  savedForms: [],
  currentForm: null,
  fields: [],
  selectedFieldId: null,
  formsLoading: false,
  maxFormsReached: false,
  isHobbyPlan: true,

  // Actions
  fetchForms: async () => {
    const { user, isStable } = get();
    
    if (!user || !isStable) {
      console.log('User not ready for forms fetch');
      return [];
    }

    set((state) => {
      state.formsLoading = true;
    });

    try {
      console.log('Fetching forms for user:', user.id);
      
      const { data: forms, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_submissions (
            id,
            data,
            submitted_at,
            ip_address
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching forms:', error);
        toast({
          title: "Error loading forms",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (!forms) {
        return [];
      }

      const mappedForms: SavedForm[] = forms.map(form => ({
        id: form.id,
        name: form.name,
        description: form.description,
        fields: Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : [],
        createdAt: new Date(form.created_at),
        updatedAt: new Date(form.updated_at),
        isPublic: form.is_public,
        shareUrl: form.share_url,
        knowledgeBaseId: form.knowledge_base_id,
        submissions: (form.form_submissions || []).map((sub: any) => ({
          id: sub.id,
          formId: form.id,
          data: sub.data || {},
          submittedAt: new Date(sub.submitted_at),
          ipAddress: sub.ip_address,
        })),
      }));

      set((state) => {
        state.savedForms = mappedForms;
        state.maxFormsReached = mappedForms.length >= HOBBY_PLAN_FORM_LIMIT;
        state.formsLoading = false;
      });

      console.log('Forms fetched successfully:', mappedForms.length);
      return mappedForms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      set((state) => {
        state.formsLoading = false;
      });
      return [];
    }
  },

  saveForm: async (formData, fields, existingForm) => {
    const { user, maxFormsReached } = get();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save forms.",
        variant: "destructive",
      });
      return null;
    }

    if (!existingForm && maxFormsReached) {
      toast({
        title: "Form Limit Reached",
        description: "Hobby plan allows maximum 5 forms. Please upgrade to create more forms.",
        variant: "destructive",
      });
      return null;
    }

    set((state) => {
      state.formsLoading = true;
    });

    try {
      const shareUrl = `${window.location.origin}/form/`;
      
      if (existingForm) {
        // Update existing form
        const { data, error } = await supabase
          .from('forms')
          .update({
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            fields: fields as unknown as any,
            is_public: formData.isPublic,
            knowledge_base_id: formData.knowledgeBaseId || null,
            share_url: shareUrl + existingForm.id,
          })
          .eq('id', existingForm.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating form:', error);
          toast({
            title: "Error updating form",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        const updatedForm: SavedForm = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: data.share_url,
          knowledgeBaseId: data.knowledge_base_id,
          submissions: existingForm.submissions,
        };

        // Update forms in state with optimistic update
        set((state) => {
          const index = state.savedForms.findIndex(f => f.id === updatedForm.id);
          if (index !== -1) {
            state.savedForms[index] = updatedForm;
          }
          state.currentForm = updatedForm;
          state.formsLoading = false;
        });

        return updatedForm;
      } else {
        // Create new form
        const { data, error } = await supabase
          .from('forms')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            fields: fields as unknown as any,
            is_public: formData.isPublic,
            knowledge_base_id: formData.knowledgeBaseId || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating form:', error);
          toast({
            title: "Error saving form",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        // Update with share URL
        const { data: updatedData } = await supabase
          .from('forms')
          .update({ share_url: shareUrl + data.id })
          .eq('id', data.id)
          .select()
          .single();

        const newForm: SavedForm = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          isPublic: data.is_public,
          shareUrl: updatedData?.share_url || shareUrl + data.id,
          knowledgeBaseId: data.knowledge_base_id,
          submissions: [],
        };

        // Add to forms with optimistic update
        set((state) => {
          state.savedForms.unshift(newForm);
          state.currentForm = newForm;
          state.maxFormsReached = state.savedForms.length >= HOBBY_PLAN_FORM_LIMIT;
          state.formsLoading = false;
        });

        return newForm;
      }
    } catch (error) {
      console.error('Error saving form:', error);
      set((state) => {
        state.formsLoading = false;
      });
      return null;
    }
  },

  deleteForm: async (formId: string) => {
    const { user } = get();
    
    if (!user) return;

    // Optimistic update
    set((state) => {
      state.savedForms = state.savedForms.filter(f => f.id !== formId);
      if (state.currentForm?.id === formId) {
        state.currentForm = null;
        state.fields = [];
      }
      state.maxFormsReached = state.savedForms.length >= HOBBY_PLAN_FORM_LIMIT;
    });

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting form:', error);
        // Revert optimistic update
        get().fetchForms();
        toast({
          title: "Error deleting form",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      get().fetchForms();
    }
  },

  loadForm: (form: SavedForm) => {
    set((state) => {
      state.currentForm = form;
      state.fields = [...form.fields];
      state.selectedFieldId = null;
    });
  },

  updateCurrentForm: (updates: Partial<SavedForm>) => {
    set((state) => {
      if (state.currentForm) {
        state.currentForm = { ...state.currentForm, ...updates };
      }
    });
  },

  addField: (type: FormFieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: type === 'select' || type === 'radio' ? undefined : `Enter ${type}`,
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
    };

    set((state) => {
      state.fields.push(newField);
      state.selectedFieldId = newField.id;
    });
  },

  updateField: (fieldId: string, updates: Partial<FormField>) => {
    set((state) => {
      const index = state.fields.findIndex(f => f.id === fieldId);
      if (index !== -1) {
        state.fields[index] = { ...state.fields[index], ...updates };
      }
    });
  },

  deleteField: (fieldId: string) => {
    set((state) => {
      state.fields = state.fields.filter(f => f.id !== fieldId);
      if (state.selectedFieldId === fieldId) {
        state.selectedFieldId = null;
      }
    });
  },

  moveField: (fieldId: string, direction: 'up' | 'down') => {
    set((state) => {
      const index = state.fields.findIndex(f => f.id === fieldId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= state.fields.length) return;

      const [movedField] = state.fields.splice(index, 1);
      state.fields.splice(newIndex, 0, movedField);
    });
  },

  selectField: (fieldId: string | null) => {
    set((state) => {
      state.selectedFieldId = fieldId;
    });
  },

  startNewForm: () => {
    set((state) => {
      state.currentForm = null;
      state.fields = [];
      state.selectedFieldId = null;
    });
  },

  duplicateForm: async (form: SavedForm) => {
    const { maxFormsReached, saveForm } = get();
    
    if (maxFormsReached) {
      toast({
        title: "Form Limit Reached",
        description: "Hobby plan allows maximum 5 forms. Please upgrade to create more forms.",
        variant: "destructive",
      });
      return;
    }

    await saveForm(
      {
        name: `${form.name} (Copy)`,
        description: form.description || '',
        isPublic: form.isPublic,
        knowledgeBaseId: form.knowledgeBaseId
      },
      form.fields
    );
  },

  refreshSingleForm: async (formId: string) => {
    const { user } = get();
    
    if (!user) return null;

    try {
      const { data: form, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_submissions (
            id,
            data,
            submitted_at,
            ip_address
          )
        `)
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();

      if (error || !form) {
        return null;
      }

      const updatedForm: SavedForm = {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : [],
        createdAt: new Date(form.created_at),
        updatedAt: new Date(form.updated_at),
        isPublic: form.is_public,
        shareUrl: form.share_url,
        knowledgeBaseId: form.knowledge_base_id,
        submissions: (form.form_submissions || []).map((sub: any) => ({
          id: sub.id,
          formId: form.id,
          data: sub.data || {},
          submittedAt: new Date(sub.submitted_at),
          ipAddress: sub.ip_address,
        })),
      };

      // Update in state
      set((state) => {
        const index = state.savedForms.findIndex(f => f.id === updatedForm.id);
        if (index !== -1) {
          state.savedForms[index] = updatedForm;
        }
      });

      return updatedForm;
    } catch (error) {
      console.error('Error refreshing form:', error);
      return null;
    }
  },
});
