
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { FormBuilderTabs } from './form-builder/FormBuilderTabs';
import { FormBuilderHeader } from './form-builder/FormBuilderHeader';
import { BuilderPanel } from './form-builder/BuilderPanel';
import { FormPreview } from './FormPreview';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { NavigationHeader } from './NavigationHeader';

interface FormBuilderProps {
  user: User;
}

export const FormBuilder = ({ user }: FormBuilderProps) => {
  const {
    formData,
    selectedField,
    activeTab,
    setActiveTab,
    handleAddField,
    handleSelectField,
    handleDeleteField,
    handleUpdateField,
    handleReorderFields,
    handleSaveForm,
    handleLoadForm,
    handleNewForm,
    handleExportForm,
    savedForms,
    isSaving
  } = useFormBuilder(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto p-6">
        <FormBuilderHeader 
          onSave={handleSaveForm}
          onLoad={handleLoadForm}
          onNew={handleNewForm}
          onExport={handleExportForm}
          savedForms={savedForms}
          isSaving={isSaving}
          formData={formData}
        />
        
        <FormBuilderTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="grid grid-cols-12 gap-6 mt-6">
          <div className="col-span-12 lg:col-span-4">
            <BuilderPanel
              activeTab={activeTab}
              selectedField={selectedField}
              onAddField={handleAddField}
              onSelectField={handleSelectField}
              onDeleteField={handleDeleteField}
              onUpdateField={handleUpdateField}
              onReorderFields={handleReorderFields}
              formData={formData}
            />
          </div>
          
          <div className="col-span-12 lg:col-span-8">
            <FormPreview
              formData={formData}
              onSelectField={handleSelectField}
              selectedField={selectedField}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
