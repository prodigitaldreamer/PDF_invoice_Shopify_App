import React, { useEffect, useState, useCallback } from 'react';
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
  Modal,
  TextContainer,
  Toast,
  Spinner,
  Banner,
  Text,
  Checkbox
} from '@shopify/polaris';
import axios from 'axios';
import TemplatePreview from './TemplatePreview.tsx';

interface TemplateViewProps {
  templateId?: string;
  onOpenEditor?: (html: string, json?: string, templateInfo?: TemplateViewState) => void;
  onBack?: () => void;
}

interface TemplateViewState {
  id?: string;
  name: string;
  type: 'invoice' | 'packing_slip' | 'refund';
  html: string;
  json?: string;
  page_size?: string;
  orientation?: string;
  font_size?: string;
  font_family?: string;
  top_margin?: string;
  bottom_margin?: string;
  left_margin?: string;
  right_margin?: string;
  date_format?: string;
  default?: boolean;
  default_set?: boolean;
  embed?: string;
  embed_clipboard?: string;
  isLoading: boolean;
  hasChanges: boolean;
  isLeaveModalOpen: boolean;
  error: string | null;
  toast: {
    isOpen: boolean;
    message: string;
    error?: boolean;
  };
}

const initialState: TemplateViewState = {
  name: '',
  type: 'invoice',
  html: '',
  isLoading: false,
  hasChanges: false,
  isLeaveModalOpen: false,
  error: null,
  toast: {
    isOpen: false,
    message: ''
  }
};

const TemplateView: React.FC<TemplateViewProps> = ({ templateId, onOpenEditor, onBack }) => {
  const [state, setState] = useState<TemplateViewState>(initialState);
  
  const updateState = (updates: Partial<TemplateViewState>, withChanges = true) => {
    setState(prev => ({
      ...prev,
      ...updates,
      hasChanges: withChanges ? true : prev.hasChanges
    }));
  };

  const showToast = (message: string, error?: boolean) => {
    updateState({
      toast: {
        isOpen: true,
        message,
        error
      }
    }, false);
  };

  const loadTemplateData = useCallback(async () => {
    if (!templateId) return;

    try {
      updateState({ isLoading: true, error: null }, false);
      const response = await axios.post(`/order-printer/templates/info/${templateId}`, {
        data: {
          shop: window.config?.info?.shop
        }
      });
      
      console.log('Template API response:', response);
      
      if (response.data.result.status && response.data.result.template_info) {
        const templateInfo = response.data.result.template_info;
        
        updateState({
          id: templateId,
          name: templateInfo.name || '',
          type: templateInfo.type || 'invoice',
          html: templateInfo.html || '',
          json: templateInfo.json || '',
          page_size: templateInfo.page_size || 'a4',
          orientation: templateInfo.orientation || 'portrait',
          font_size: templateInfo.font_size || '16.0',
          font_family: templateInfo.font_family || '',
          top_margin: templateInfo.top_margin || '16.0',
          bottom_margin: templateInfo.bottom_margin || '16.0',
          left_margin: templateInfo.left_margin || '16.0',
          right_margin: templateInfo.right_margin || '16.0',
          date_format: templateInfo.date_format || '%d/%m/%y',
          default: templateInfo.default || false,
          default_set: templateInfo.default || false,
          embed: templateInfo.embed || '',
          embed_clipboard: templateInfo.embed_clipboard || '',
          hasChanges: false,
          isLoading: false
        }, false);
      } else {
        updateState({
          error: 'Template not found or access denied',
          isLoading: false
        }, false);
        showToast('Failed to load template', true);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      updateState({
        error: 'Error loading template',
        isLoading: false
      }, false);
      showToast('Error loading template', true);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplateData();
  }, [loadTemplateData]);

  const handleSave = async () => {
    try {
      updateState({ isLoading: true, error: null }, false);
      
      // Format data explicitly like in TemplateEdit.tsx
      const templateData = {
        id: templateId || '',
        name: state.name || 'Untitled template',
        type: state.type || 'invoice',
        html: state.html || '',
        json: state.json || '',
        page_size: state.page_size || 'a4',
        orientation: state.orientation || 'portrait',
        font_size: state.font_size || '16.0',
        font_family: state.font_family || '',
        top_margin: state.top_margin || '16.0',
        bottom_margin: state.bottom_margin || '16.0',
        left_margin: state.left_margin || '16.0',
        right_margin: state.right_margin || '16.0',
        date_format: state.date_format || '%d/%m/%y',
        default: state.default || false
      };
      
      // Determine the correct API endpoint type based on whether we're editing or creating
      const apiType = templateId ? 'edit' : '';
      
      const response = await axios.post(`/order-printer/template/update/${apiType}`, {
        data: {
          info: templateData,
          shop: window.config?.info?.shop
        }
      }, {
        onUploadProgress: () => {
          updateState({ isLoading: true }, false);
        }
      });

      setTimeout(() => {
        if (response.data.result.status) {
          showToast('Template saved successfully');
          loadTemplateData();
        } else {
          updateState({ error: 'Failed to save template' }, false);
          showToast('Failed to save template', true);
        }
        updateState({ isLoading: false }, false);
      }, 1000);
    } catch (error) {
      console.error('Error saving template:', error);
      updateState({ error: 'Error saving template' }, false);
      showToast('Error saving template', true);
      updateState({ isLoading: false }, false);
    }
  };

  const handleDiscard = useCallback(() => {
    // If onBack is provided as a prop, use that
    if (onBack) {
      onBack();
      return;
    }
    
    // Otherwise, directly navigate to templates page with shop parameter
    const shopName = window.config?.info?.shop || '';
    window.location.href = shopName ? `/order-printer/templates?shop=${shopName}` : '/order-printer/templates';
  }, [onBack]);

  const handleBack = () => {
    // Get shop from window.config or session storage
    const shopName = window.config?.info?.shop || '';
    
    // Redirect with shop parameter to maintain session
    if (shopName) {
      window.location.href = `/order-printer/templates?shop=${shopName}`;
    } else {
      // Fallback to regular navigation if shop isn't available
      window.location.href = '/order-printer/templates';
    }
  };

  const handleDelete = async () => {
    if (!templateId) return;

    try {
      updateState({ isLoading: true, error: null }, false);
      const response = await axios.post('/order-printer/template/delete', {
        data: {
          ids: [templateId],
          shop: window.config?.info?.shop
        }
      });

      if (response.data.status) {
        if (onBack) {
          onBack();
        } else {
          window.location.href = `/order-printer/templates/?shop=${window.config?.info?.shop || ''}`;
        }
      } else {
        updateState({ error: 'Failed to delete template' }, false);
        showToast('Failed to delete template', true);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      updateState({ error: 'Error deleting template' }, false);
      showToast('Error deleting template', true);
    } finally {
      updateState({ isLoading: false }, false);
    }
  };

  const handleOpenEditor = () => {
    if (onOpenEditor) {
      // Pass HTML, JSON, and the complete template info
      onOpenEditor(state.html, state.json, state);
    }
  };

  return (
    <Frame>
      {state.isLoading && (
        <Box padding="400">
          <Spinner accessibilityLabel="Loading" size="large" />
        </Box>
      )}
      
      {state.toast.isOpen && (
        <Toast
          content={state.toast.message || ''}
          error={state.toast.error}
          onDismiss={() => updateState({ toast: { isOpen: false, message: '' } }, false)}
        />
      )}

      {state.error && (
        <Box padding="400">
          <Banner 
            tone="critical"
            onDismiss={() => updateState({ error: null }, false)}
          >
            <Text as="p">{state.error}</Text>
          </Banner>
        </Box>
      )}

      <Page 
        fullWidth 
        title={templateId ? `Edit Template: ${state.name}` : "Create Template"}
        backAction={{
          content: 'Templates',
          onAction: handleBack
        }}
        primaryAction={{
          content: 'Open Editor',
          onAction: handleOpenEditor,
          disabled: state.isLoading
        }}
      >
        <Grid>

        <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 8, xl: 8}}>
            <LegacyCard title="Preview">
              <Box background="bg-surface-secondary">
                <Box padding="400">
                  <div style={{ 
                    minHeight: '80vh',
                    backgroundColor: 'var(--p-surface)',
                    borderRadius: 'var(--p-border-radius-200)',
                    overflow: 'hidden',
                    margin: 'var(--p-space-200)'
                  }}>
                    {state.embed ? (
                      <TemplatePreview 
                        previewUrl={state.embed}
                        shop={window.config?.info?.shop || ''}
                      />
                    ) : (
                      <TextContainer>
                        {state.isLoading ? (
                          <Spinner accessibilityLabel="Loading preview" size="large" />
                        ) : (
                          'No preview available'
                        )}
                      </TextContainer>
                    )}
                  </div>
                </Box>
              </Box>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
            <LegacyCard title="General" sectioned>
              <FormLayout>
                <TextField
                  label="Template Name"
                  placeholder="Enter template name"
                  autoComplete="off"
                  value={state.name}
                  onChange={(value) => updateState({ name: value })}
                  disabled={state.isLoading}
                />
                <Select
                  label="Type"
                  options={[
                    {label: 'Invoice', value: 'invoice'},
                    {label: 'Packing Slip', value: 'packing'},
                    {label: 'Refund', value: 'refund'}
                  ]}
                  value={state.type}
                  onChange={(value) => updateState({ type: value as TemplateViewState['type'] })}
                  disabled={state.isLoading}
                />
                <Checkbox
                  label="Set as default template for this type"
                  checked={state.default || false}
                  onChange={(value) => updateState({ default: value })}
                  disabled={state.isLoading}
                />
              </FormLayout>
            </LegacyCard>
          </Grid.Cell>

        </Grid>
        
        <Box paddingBlockStart="400" paddingBlockEnd="400">
          <PageActions
            primaryAction={{
              content: 'Save',
              disabled: !state.hasChanges || state.isLoading,
              loading: state.isLoading,
              onAction: handleSave,
            }}
            secondaryActions={[
              {
                content: 'Discard',
                onAction: handleDiscard,
                disabled: state.isLoading || !state.hasChanges,
              },
              {
                content: 'Delete',
                onAction: handleDelete,
                destructive: true,
                disabled: !templateId || state.isLoading,
              },
            ]}
          />
        </Box>
      </Page>

      <Modal
        open={state.isLeaveModalOpen}
        onClose={() => updateState({ isLeaveModalOpen: false }, false)}
        title="Your changes have not been saved"
        primaryAction={{
          content: 'Leave page',
          destructive: true,
          onAction: () => {
            if (onBack) {
              onBack();
            } else {
              window.location.href = `/order-printer/templates/${window.config?.info?.shop || ''}`;
            }
          }
        }}
        secondaryActions={[{
          content: 'Stay on page',
          onAction: () => updateState({ isLeaveModalOpen: false }, false)
        }]}
      >
        <Modal.Section>
          <Box padding="400">
            <Text as="p">
              Leaving this page will discard all of your new changes. Are you sure you want to leave?
            </Text>
          </Box>
        </Modal.Section>
      </Modal>
    </Frame>
  );
};
export default TemplateView;