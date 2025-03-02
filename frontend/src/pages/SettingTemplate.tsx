import React from 'react';
import { Page,AppProvider } from '@shopify/polaris';
import TemplateManagement from '../components/Template.tsx';

const TemplateManagementPage: React.FC = () => {

  return (
    <AppProvider i18n={{}}>
      <Page>
          <TemplateManagement/>
      </Page>
    </AppProvider>

  );
};
export default TemplateManagementPage;
