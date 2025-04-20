import React, { useEffect, useState } from 'react';
import { AppProvider, Link } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import Home from './pages/Home.tsx';
import SettingsPage from './pages/Setting.tsx';
import EmailNotification from './pages/EmailNotification.tsx'
import {NavMenu} from '@shopify/app-bridge-react';
import TemplateManagementPage from './pages/SettingTemplate.tsx';
import TemplateView from './components/TemplateView.tsx';
import TemplateEdit from './components/TemplateEdit.tsx';

const App: React.FC = () => {
    const [path, setPath] = useState(window.location.pathname);
    const [templateId, setTemplateId] = useState<string | null>(null);
    const [templateHtml, setTemplateHtml] = useState<string | null>(null);
    const [templateJson, setTemplateJson] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [templateInfo, setTemplateInfo] = useState<any>(null);
    
    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
            // Extract template ID from URL if present
            const urlParams = new URLSearchParams(window.location.search);
            setTemplateId(urlParams.get('id'));
            // Close editor when URL changes via browser navigation
            setIsEditorOpen(false);
        };

        window.addEventListener('popstate', handlePopState);
        
        // Also parse the initial URL for template ID
        const urlParams = new URLSearchParams(window.location.search);
        setTemplateId(urlParams.get('id'));

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleNavigation = (newPath: string, params?: Record<string, string>) => {
        let url = newPath;
        
        // Add query parameters if provided
        if (params) {
            const urlParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                urlParams.append(key, value);
            });
            
            // Add shop parameter if available
            if (window.config?.info?.shop && !params.shop) {
                urlParams.append('shop', window.config.info.shop);
            }
            
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
        
        // Close editor when navigating
        setIsEditorOpen(false);
        
        // Clear template data when navigating away
        if (newPath !== '/order-printer/templates/edit') {
            setTemplateHtml(null);
            setTemplateJson(null);
            setTemplateInfo(null);
        }
    };
    
    // Handle opening the editor with a template
    const handleOpenEditor = (html: string, json?: string, info?: any) => {
        setTemplateHtml(html);
        setTemplateJson(json || null);
        setTemplateInfo(info || null);
        setIsEditorOpen(true);
    };
    
    // Handle closing the editor
    const handleCloseEditor = () => {
        setIsEditorOpen(false);
    };
    
    // Handle saving template from the editor
    const handleSaveTemplate = (html: string, design: any) => {
        // Here you would normally save to your API
        console.log("Saving template to API:", { id: templateId, html, design });
        
        // After saving, close the editor and return to the template view
        setIsEditorOpen(false);
    };

    const renderComponent = () => {
        if (path === '/order-printer/settings') {
            return <SettingsPage />;
        }
        if (path === '/order-printer/templates') {
            return <TemplateManagementPage onEditTemplate={(id) => {
                handleNavigation('/order-printer/templates/edit', { id });
            }} />;
        }
        if (path === '/order-printer/email_notification') {
            return <EmailNotification />;
        }
        if (path === '/order-printer/templates/edit' && templateId) {
            // If editor is open, render the TemplateEdit component instead of TemplateView
            if (isEditorOpen) {
                return <TemplateEdit 
                    templateId={templateId}
                    templateHtml={templateHtml || ''}
                    templateJson={templateJson || ''}
                    templateInfo={templateInfo}
                    onSave={handleSaveTemplate}
                    onClose={handleCloseEditor}
                />;
            }
            
            // Otherwise render the TemplateView component
            return <TemplateView 
                templateId={templateId} 
                onOpenEditor={handleOpenEditor}
            />;
        }
        
        return <Home />;
    };

    return (
        <AppProvider i18n={{}}>
            <NavMenu>
                <Link url="/" onClick={() => handleNavigation('/')}>Home</Link>
                <Link url="/order-printer/templates" onClick={() => handleNavigation('/order-printer/templates')}>Template Management</Link>
                <Link url="/order-printer/email_notification" onClick={() => handleNavigation('/order-printer/email_notification')}>Email Notification</Link>
                <Link url="/order-printer/settings" onClick={() => handleNavigation('/order-printer/settings')}>Setting</Link>
            </NavMenu>
            {renderComponent()}
        </AppProvider>
    );
};

export default App;