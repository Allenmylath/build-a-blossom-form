
import { FormField, FormFieldType } from '@/types/form';
import { FieldTypesPanel } from './FieldTypesPanel';
import { FieldList } from './FieldList';

interface BuilderPanelProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onAddField: (type: FormFieldType) => void;
  onSelectField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
  onDeleteField: (fieldId: string) => void;
}

export const BuilderPanel = ({
  fields,
  selectedFieldId,
  onAddField,
  onSelectField,
  onMoveField,
  onDeleteField,
}: BuilderPanelProps) => {
  return (
    <div className="space-y-6">
      <FieldTypesPanel onAddField={onAddField} />
      <FieldList
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelectField={onSelectField}
        onMoveField={onMoveField}
        onDeleteField={onDeleteField}
      />
    </div>
  );
};
