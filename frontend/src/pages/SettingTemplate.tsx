import React from 'react';
import TemplateManagement from '../components/Template.tsx';

interface TemplateManagementPageProps {
  onEditTemplate?: (id: string) => void;
}

const TemplateManagementPage: React.FC<TemplateManagementPageProps> = ({ onEditTemplate }) => {
  return <TemplateManagement onEditTemplate={onEditTemplate} />;
};

export default TemplateManagementPage;
