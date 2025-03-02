import React from 'react';
import { Page,AppProvider } from '@shopify/polaris';
import HomeSetup from '../components/HomeSetup.tsx';

const Home: React.FC = () => {

  return (
    <AppProvider i18n={{}}>
      <Page>
          <HomeSetup storeName="Your Store" />
      </Page>
    </AppProvider>

  );
};
export default Home;
