import React, { useEffect, useState } from 'react';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import Home from './pages/Home.tsx';
import SettingsPage from './pages/Setting.tsx';
import {NavMenu} from '@shopify/app-bridge-react';
import TemplateManagementPage from './pages/SettingTemplate.tsx';
const App: React.FC = () => {
    const [path, setPath] = useState(window.location.pathname);
    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, newPath: string) => {
        event.preventDefault();
        window.history.pushState({}, '', newPath);
        setPath(newPath);
    };

    const renderComponent = () => {
        if (path === '/shopify/settings') {
            return <SettingsPage />;
        }
        if (path === '/shopify/template/management') {
            return <TemplateManagementPage />;
        }
        
        return <Home />;
    };

    return (
        <AppProvider i18n={{}}>
            <NavMenu>
                <a href="/" onClick={(e) => handleNavigation(e, '/')}>Home</a>
                <a href="/shopify/template/management" onClick={(e) => handleNavigation(e, '/shopify/template/management')}>Template Management</a>
                <a href="/shopify/settings" onClick={(e) => handleNavigation(e, '/shopify/settings')}>Setting</a>
                
            </NavMenu>
            {renderComponent()}
        </AppProvider>
    );
};

export default App;