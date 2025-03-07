import React, { useEffect, useState } from 'react';
import { AppProvider, Link } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import Home from './pages/Home.tsx';
import SettingsPage from './pages/Setting.tsx';
import {NavMenu} from '@shopify/app-bridge-react';
import TemplateManagementPage from './pages/SettingTemplate.tsx';
import TemplateView from './components/TemplateView.tsx';
import TemplateEdit from './components/TemplateEdit.tsx';

const App: React.FC = () => {
    const [path, setPath] = useState(window.location.pathname);
    const [templateId, setTemplateId] = useState<string | null>(null);
    const [templateHtml, setTemplateHtml] = useState<string | null>(null);
    const [templateJson, setTemplateJson] = useState<string | null>(null);
    
    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
            // Extract template ID from URL if present
            const urlParams = new URLSearchParams(window.location.search);
            setTemplateId(urlParams.get('id'));
        };

        window.addEventListener('popstate', handlePopState);
        
        // Also parse the initial URL for template ID
        const urlParams = new URLSearchParams(window.location.search);
        setTemplateId(urlParams.get('id'));

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, newPath: string, params?: Record<string, string>) => {
        event.preventDefault();
        let url = newPath;
        
        // Add query parameters if provided
        if (params) {
            const urlParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                urlParams.append(key, value);
            });
            url = `${url}?${urlParams.toString()}`;
        }
        
        window.history.pushState({}, '', url);
        setPath(newPath);
        
        // Update template ID if in params
        if (params?.id) {
            setTemplateId(params.id);
        } else {
            setTemplateId(null);
        }
        
        // Clear template HTML when navigating
        if (newPath !== '/shopify/template/editor') {
            setTemplateHtml(null);
            setTemplateJson(null);
        }
    };
    
    // Handle opening the editor with a template
    const handleOpenEditor = (id: string, html: string, json?: string) => {
        setTemplateId(id);
        setTemplateHtml(html);
        setTemplateJson(json || null); // Convert undefined to null
        handleNavigation({ preventDefault: () => {} } as any, '/shopify/template/editor', { id });
    };
    
    // Handle saving template from the editor
    const handleSaveTemplate = (html: string, design: any) => {
        // Here you would normally save to your API
        console.log("Saving template to API:", { id: templateId, html, design });
        
        // After saving, navigate back to the template view
        handleNavigation({ preventDefault: () => {} } as any, '/pdf/templates/edit', { id: templateId! });
    };

    const renderComponent = () => {
        if (path === '/pdf/settings') {
            return <SettingsPage />;
        }
        if (path === '/pdf/templates') {
            return <TemplateManagementPage onEditTemplate={(id) => {
                handleNavigation({ preventDefault: () => {} } as any, '/pdf/templates/edit', { id });
            }} />;
        }
        if (path === '/pdf/templates/edit' && templateId) {
            return <TemplateView 
                templateId={templateId} 
                onOpenEditor={(html, json) => handleOpenEditor(templateId, html, json)}
            />;
        }
        if (path === '/shopify/template/editor' && templateId) {
            return <TemplateEdit 
                templateId={templateId}
                templateHtml={templateHtml || ''}
                templateJson={templateJson || ''}
                onSave={handleSaveTemplate}
                onClose={() => handleNavigation(
                    { preventDefault: () => {} } as any, 
                    '/pdf/templates/edit', 
                    { id: templateId }
                )}
            />;
        }
        
        return <Home />;
    };

    return (
        <AppProvider i18n={{}}>
            <NavMenu>
                <Link url="/" onClick={() => handleNavigation({ preventDefault: () => {} } as any, '/')}>Home</Link>
                <Link url="/pdf/templates" onClick={() => handleNavigation({ preventDefault: () => {} } as any, '/pdf/templates')}>Template Management</Link>
                <Link url="/pdf/settings" onClick={() => handleNavigation({ preventDefault: () => {} } as any, '/pdf/settings')}>Setting</Link>
            </NavMenu>
            {renderComponent()}
        </AppProvider>
    );
};

export default App;