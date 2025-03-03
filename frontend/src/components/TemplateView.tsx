import React, { useEffect, useRef, useState } from 'react';
import {
  Page,
  Frame,
  LegacyCard,
  FormLayout,
  TextField,
  Select,
  Grid,
  PageActions,
  Box,
} from '@shopify/polaris';

interface TemplateViewProps {
  templateId?: string;
  onOpenEditor?: (html: string) => void;
}

const TemplateView: React.FC<TemplateViewProps> = ({ templateId, onOpenEditor }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [templateData, setTemplateData] = useState({
    name: '',
    type: 'invoice',
    html: '', // Add HTML content to the template data
  });
  
  // Load template data based on ID
  useEffect(() => {
    if (templateId) {
      // In a real application, you would fetch the data from your API
      console.log(`Loading template data for ID: ${templateId}`);
      
      // Mock data loading - replace with actual API call
      const mockTemplateData = {
        '1': { name: 'Invoice 1', type: 'invoice', html: '<!DOCTYPE html><html><body><h1>Invoice 1</h1></body></html>' },
        '2': { name: 'Invoice 2', type: 'invoice', html: '<!DOCTYPE html><html><body><h1>Invoice 2</h1></body></html>' },
        '3': { name: 'Packing 1', type: 'packing_slip', html: '<!DOCTYPE html><html><body><h1>Packing 1</h1></body></html>' },
        '4': { name: 'Packing 2', type: 'packing_slip', html: '<!DOCTYPE html><html><body><h1>Packing 2</h1></body></html>' },
        '5': { name: 'Refund 1', type: 'refund', html: '<!DOCTYPE html><html><body><h1>Refund 1</h1></body></html>' },
        '6': { name: 'Refund 2', type: 'refund', html: '<!DOCTYPE html><html><body><h1>Refund 2</h1></body></html>' },
      };
      
      // Type assertion to access the property with string index
      const template = (mockTemplateData as Record<string, any>)[templateId];
      if (template) {
        setTemplateData({
          name: template.name,
          type: template.type,
          html: template.html || '',
        });
      }
    }
  }, [templateId]);

  useEffect(() => {
    const resizeIframe = () => {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        try {
          const height = iframe.contentWindow?.document.documentElement.scrollHeight || 'auto';
          iframe.style.height = `${height}px`;
        } catch (e) {
          console.error('Error resizing iframe:', e);
        }
      }
    };

    if (iframeRef.current) {
      iframeRef.current.onload = resizeIframe;
    }

    window.addEventListener('resize', resizeIframe);
    return () => window.removeEventListener('resize', resizeIframe);
  }, []);

  const handleNameChange = (value: string) => {
    setTemplateData(prev => ({ ...prev, name: value }));
  };
  
  const handleTypeChange = (value: string) => {
    setTemplateData(prev => ({ ...prev, type: value }));
  };

  const handleSave = () => {
    console.log('Saving template:', templateData);
    // Implement your save logic here
  };
  
  const handleDiscard = () => {
    console.log('Discarding changes');
    // Implementation to discard changes and return to template list
    window.location.href = '/shopify/template/management';
  };
  
  const handleDelete = () => {
    console.log('Deleting template:', templateId);
    // Implementation to delete the template
    // Usually would show a confirmation dialog first
    // Then redirect back to template list on success
    window.location.href = '/shopify/template/management';
  };

  const openEditor = () => {
    console.log('Opening editor');
    if (onOpenEditor) {
      onOpenEditor(templateData.html);
    }
  };

  const previewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(templateData.html)}`;

  return (
    <Frame>
      <Page 
        fullWidth 
        title={templateId ? `Edit Template: ${templateData.name}` : "Create Template"} 
        backAction={{content: 'Templates', url: '/shopify/template/management'}}
        primaryAction={{
          content: 'Open Editor',
          onAction: openEditor,
        }}
        pagination={{
          hasPrevious: true,
          hasNext: true,
        }}
      >
        <Grid>
          {/* Left Column - 4 columns (1/3 width) */}
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
            <LegacyCard title="General" sectioned>
            <Box>
              <FormLayout>
                <TextField
                  label="Template Name"
                  placeholder="Enter template name"
                  autoComplete="off"
                  value={templateData.name}
                  onChange={handleNameChange}
                />
                <Select
                  label="Type"
                  options={[
                    {label: 'Invoice', value: 'invoice'},
                    {label: 'Packing Slip', value: 'packing_slip'},
                    {label: 'Refund', value: 'refund'}
                  ]}
                  value={templateData.type}
                  onChange={handleTypeChange}
                />
              </FormLayout>
            </Box>
            </LegacyCard>
          </Grid.Cell>

          {/* Right Column - 8 columns (2/3 width) */}
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 8, xl: 8}}>
            <LegacyCard title="Preview">
              <div style={{ 
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden',
                padding: '16px'
              }}>
                <iframe
                  ref={iframeRef}
                  title="HTML Preview"
                  src={previewSrc}
                  style={{
                    width: '100%',
                    minHeight: '80vh',
                    border: 'none',
                  }}
                />
              </div>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
        
        {/* Page Actions at the bottom */}
        <div style={{ marginTop: '2rem' }}>
          <PageActions
            primaryAction={{
              content: 'Save',
              onAction: handleSave,
            }}
            secondaryActions={[
              {
                content: 'Discard',
                onAction: handleDiscard,
              },
              {
                content: 'Delete',
                onAction: handleDelete,
                destructive: true,
                disabled: !templateId, // Disable delete if creating a new template
              },
            ]}
          />
        </div>
      </Page>
    </Frame>
  );
};

export default TemplateView;