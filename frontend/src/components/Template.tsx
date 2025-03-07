import { useState, useCallback, useEffect } from 'react';
import {
  Page,
  IndexTable,
  LegacyCard,
  Text,
  Button,
  Popover,
  ActionList,
  Badge,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  ChoiceList,
  Toast,
  Frame,
  TextContainer,
  FormLayout,
  TextField,
  Select,
  EmptyState,
} from '@shopify/polaris';
import type {IndexFiltersProps, TabProps} from '@shopify/polaris';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { 
  MenuHorizontalIcon,
  EditIcon,
  DuplicateIcon,
  DeleteIcon,
  ViewIcon
} from '@shopify/polaris-icons';
import axios from 'axios';
import { ConfigData } from '../types';

interface TemplateData {
  id: number;
  title: string;
  type: string;
  url: string;
  default_set: boolean;
  available_set: boolean;
  avatarSource: string;
  shortcut: number;
  [key: string]: unknown;
}

interface TemplateManagementProps {
  onEditTemplate?: (id: string) => void;
}

function TemplateManagement({ onEditTemplate }: TemplateManagementProps) {
  // App Bridge setup
  const appBridge = useAppBridge();
  
  // State management
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string[]>([]);
  const [requestData, setRequestData] = useState({
    type: 'invoice',
    error: false,
    email: '',
    description: ''
  });
  const [config, setConfig] = useState<ConfigData | undefined>(undefined);
  
  // PopOver state
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  
  // Modal IDs
  const DELETE_MODAL_ID = 'delete-template-modal';
  const REQUEST_FORM_MODAL_ID = 'request-form-modal';
  
  // IndexFilters tab management
  const [itemStrings, setItemStrings] = useState([
    'ALL',
    'invoice',
    'packing',
    'refund',
  ]);
  
  // Fetch templates from config
  useEffect(() => {
    const configData = window.config;
    console.log('Config data:', configData);
    if (configData) {
      setConfig(configData);
      setTemplates(configData.all_templates || []);
    }
  }, []);
  
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
  // Template actions
  const templateAction = async (action: string, data: any, message: string) => {
    setLoading(true);
    try {
      const response = await axios.post(action, { data });
      
      await sleep(1500);
      
      if (response.data.result) {
        if (action === '/pdf/template/delete') {
          const newTemplates = templates.filter(template => 
            !data.ids.includes(String(template.id))
          );
          setTemplates(newTemplates);
        } else if (action === '/pdf/template/duplicate') {
          setTemplates(response.data.result.templates);
        }
        
        setToastMessage(message);
        setToastActive(true);
      } else {
        setToastMessage('Something went wrong. Please try again!');
        setToastActive(true);
      }
    } catch (error) {
      setToastMessage('Something went wrong. Please try again!');
      setToastActive(true);
    } finally {
      setLoading(false);
      setSelectedResources([]);
      setItemToDelete([]);
    }
  };
  
  // Delete view functionality
  const deleteView = (index: number) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  // Duplicate view functionality
  const duplicateView = async (name: string) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  // Tab definitions
  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item === 'ALL' ? item : item.charAt(0).toUpperCase() + item.slice(1),
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: 'rename',
              onAction: () => {},
              onPrimaryAction: async (value: string): Promise<boolean> => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: 'duplicate',
              onPrimaryAction: async (value: string): Promise<boolean> => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: 'delete',
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));

  const [selected, setSelected] = useState(0);
  
  // Create new view functionality
  const onCreateNewView = async (value: string) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  // Sort options
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: 'Template name', value: 'name asc', directionLabel: 'A-Z'},
    {label: 'Template name', value: 'name desc', directionLabel: 'Z-A'},
    {label: 'Type', value: 'type asc', directionLabel: 'A-Z'},
    {label: 'Type', value: 'type desc', directionLabel: 'Z-A'},
  ];
  
  // Sort and filter states
  const [sortSelected, setSortSelected] = useState(['name asc']);
  const {mode, setMode} = useSetIndexFiltersMode();
  const [templateType, setTemplateType] = useState<string[] | undefined>(undefined);
  const [defaultStatus, setDefaultStatus] = useState<string[] | undefined>(undefined);
  const [queryValue, setQueryValue] = useState('');

  // Filter handlers
  const handleTemplateTypeChange = useCallback(
    (value: string[]) => setTemplateType(value),
    [],
  );
  
  const handleDefaultStatusChange = useCallback(
    (value: string[]) => setDefaultStatus(value),
    [],
  );
  
  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  const handleTemplateTypeRemove = useCallback(
    () => setTemplateType(undefined),
    [],
  );
  
  const handleDefaultStatusRemove = useCallback(
    () => setDefaultStatus(undefined),
    [],
  );
  
  const handleQueryValueRemove = useCallback(
    () => setQueryValue(''),
    [],
  );
  
  const handleFiltersClearAll = useCallback(
    () => {
      handleTemplateTypeRemove();
      handleDefaultStatusRemove();
      handleQueryValueRemove();
    },
    [handleTemplateTypeRemove, handleDefaultStatusRemove, handleQueryValueRemove],
  );

  // Save and cancel actions
  const onHandleCancel = () => {
    // Cancel action
  };

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction: IndexFiltersProps['primaryAction'] =
    selected === 0
      ? {
          type: 'save-as',
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: 'save',
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };

  // Filter definitions
  const filters = [
    {
      key: 'templateType',
      label: 'Template type',
      filter: (
        <ChoiceList
          title="Template type"
          titleHidden
          choices={[
            {label: 'Invoice', value: 'invoice'},
            {label: 'Packing', value: 'packing'},
            {label: 'Refund', value: 'refund'},
          ]}
          selected={templateType || []}
          onChange={handleTemplateTypeChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: 'defaultStatus',
      label: 'Status',
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            {label: 'Default', value: 'default'},
            {label: 'Non-default', value: 'non-default'},
          ]}
          selected={defaultStatus || []}
          onChange={handleDefaultStatusChange}
          allowMultiple
        />
      ),
    },
  ];

  // Applied filters
  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (templateType && templateType.length > 0) {
    appliedFilters.push({
      key: 'templateType',
      label: `Type: ${templateType.join(', ')}`,
      onRemove: handleTemplateTypeRemove,
    });
  }
  
  if (defaultStatus && defaultStatus.length > 0) {
    appliedFilters.push({
      key: 'defaultStatus',
      label: `Status: ${defaultStatus.join(', ')}`,
      onRemove: handleDefaultStatusRemove,
    });
  }

  // Filter templates based on selected filters
  const filteredTemplates = templates.filter(template => {
    // Filter by search query
    if (queryValue && !template.title.toLowerCase().includes(queryValue.toLowerCase())) {
      return false;
    }
    
    // Filter by tab selection (except "ALL" tab)
    if (selected !== 0) {
      const tabType = itemStrings[selected].toLowerCase();
      if (tabType !== template.type.toLowerCase()) {
        return false;
      }
    }
    
    // Filter by template type
    if (templateType && templateType.length > 0 && !templateType.includes(template.type)) {
      return false;
    }
    
    // Filter by default status
    if (defaultStatus && defaultStatus.length > 0) {
      if (defaultStatus.includes('default') && !defaultStatus.includes('non-default') && !template.default_set) {
        return false;
      }
      if (defaultStatus.includes('non-default') && !defaultStatus.includes('default') && template.default_set) {
        return false;
      }
    }
    
    return true;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const sortOrder = sortSelected[0];
    
    switch (sortOrder) {
      case 'name asc':
        return a.title.localeCompare(b.title);
      case 'name desc':
        return b.title.localeCompare(a.title);
      case 'type asc':
        return a.type.localeCompare(b.type);
      case 'type desc':
        return b.type.localeCompare(a.type);
      default:
        return 0;
    }
  });

  // Toggle popover
  const togglePopover = (id: string) => {
    setActivePopoverId(activePopoverId === id ? null : id);
  };

  // Action handlers
  const handleEditTemplate = (id: string) => {
    if (onEditTemplate) {
      onEditTemplate(id);
    } else {
      window.location.pathname = `/pdf/templates/${id}/edit/${config?.info?.shop || ''}`;
    }
    setActivePopoverId(null);
  };

  const handleDuplicateTemplate = (id: string) => {
    templateAction('/pdf/template/duplicate', { ids: [id] }, 'Template duplicated successfully');
    setActivePopoverId(null);
  };

  const handleSetAsDefault = (id: string) => {
    const newTemplates = templates.map(template => ({
      ...template,
      default_set: String(template.id) === id
    }));
    
    setTemplates(newTemplates);
    setToastMessage('Template set as default');
    setToastActive(true);
    setActivePopoverId(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setItemToDelete([id]);
    appBridge.modal.show(DELETE_MODAL_ID);
    setActivePopoverId(null);
  };

  // Resource selection state
  const resourceName = { singular: 'template', plural: 'templates' };
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const {
    selectedResources: selectedResourcesFromHook,
    allResourcesSelected,
    handleSelectionChange
  } = useIndexResourceState(sortedTemplates, {
    resourceIDResolver: (template: TemplateData) => String(template.id)
  });

  // Update the selectedResources state whenever the hook's selected resources change
  useEffect(() => {
    setSelectedResources(selectedResourcesFromHook);
  }, [selectedResourcesFromHook]);

  // Bulk action handlers
  const handleBulkSetDefault = useCallback(() => {
    if (selectedResources.length > 0) {
      const id = selectedResources[0];
      const newTemplates = templates.map(template => ({
        ...template,
        default_set: String(template.id) === id
      }));
      
      setTemplates(newTemplates);
      setToastMessage('Template set as default');
      setToastActive(true);
      setSelectedResources([]);
    }
  }, [selectedResources, templates]);

  const handleBulkDelete = useCallback(() => {
    appBridge.modal.show(DELETE_MODAL_ID);
  }, [appBridge.modal]);

  const bulkActions = [
    {
      content: 'Set as Default',
      icon: ViewIcon,
      onAction: handleBulkSetDefault,
    },
    {
      content: 'Delete',
      icon: DeleteIcon,
      destructive: true,
      onAction: handleBulkDelete,
    }
  ];

  // Submit request form
  const submitRequestForm = async () => {

    
    try {
      const response = await axios.post('/request/submit', requestData);
      await sleep(1500);
      
      if (response.data.result && response.data.result.status) {
        appBridge.modal.hide(REQUEST_FORM_MODAL_ID);
        setToastMessage('Request submitted successfully');
        setToastActive(true);
        
        // Reset form
        setRequestData({
          type: 'invoice',
          error: false,
          email: '',
          description: ''
        });
      } else {
        setRequestData(prev => ({ ...prev, error: true }));
      }
    } catch (error) {
      setRequestData(prev => ({ ...prev, error: true }));
    } 
  };
  
  // Form handlers
  const handleRequestTypeChange = (value: string) => {
    setRequestData(prev => ({ ...prev, type: value }));
  };
  
  const handleRequestEmailChange = (value: string) => {
    setRequestData(prev => ({ ...prev, email: value }));
  };
  
  const handleRequestDescriptionChange = (value: string) => {
    setRequestData(prev => ({ ...prev, description: value }));
  };
  
  const validateAndSubmitRequest = () => {
    if (requestData.email && requestData.email.trim() !== '') {
      submitRequestForm();
    } else {
      setRequestData(prev => ({ ...prev, error: true }));
    }
  };
  
  
  // Empty state component
  const emptyStateMarkup = (
    <EmptyState
      heading="Looks like you have no templates here"
      image="/shopify_pdf_invoice/static/description/images/box.png"
      action={{
        content: 'Create new template',
        onAction: () => {
          window.location.pathname = `/pdf/templates/0/edit/${config?.info?.shop || ''}`;
        }
      }}
      secondaryAction={{
        content: 'Learn more',
        url: '#'
      }}
    >
      <p>Easily customize your templates from our designs or create from scratch with our drag-and-drop tool</p>
    </EmptyState>
  );

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    const idsToDelete = selectedResources.length ? selectedResources : itemToDelete;
    templateAction('/pdf/template/delete', { 
      ids: idsToDelete, 
      shop: config?.info?.shop 
    }, 'Template deleted successfully');
    appBridge.modal.hide(DELETE_MODAL_ID);
  };

  return (
    <Frame>
      <Page 
        title="Templates"
        primaryAction={{
          content: 'New template',
          onAction: () => {
            window.location.pathname = `/pdf/templates/0/edit/${config?.info?.shop || ''}`;
          }
        }}
      >
        <LegacyCard>
          {templates.length === 0 ? (
            emptyStateMarkup
          ) : (
            <>
              <IndexFilters
                sortOptions={sortOptions}
                sortSelected={sortSelected}
                queryValue={queryValue}
                queryPlaceholder="Search templates"
                onQueryChange={handleFiltersQueryChange}
                onQueryClear={handleQueryValueRemove}
                onSort={setSortSelected}
                primaryAction={primaryAction}
                cancelAction={{
                  onAction: onHandleCancel,
                  disabled: false,
                  loading: false,
                }}
                tabs={tabs}
                selected={selected}
                onSelect={setSelected}
                canCreateNewView
                onCreateNewView={onCreateNewView}
                filters={filters}
                appliedFilters={appliedFilters}
                onClearAll={handleFiltersClearAll}
                mode={mode}
                setMode={setMode}
              />
              
              <IndexTable
                resourceName={resourceName}
                itemCount={sortedTemplates.length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Template' },
                  { title: 'Type' },
                  { title: 'Status' },
                  { title: 'Actions' },
                ]}
                loading={loading}
                bulkActions={bulkActions}
              >
                {sortedTemplates.map((template, index) => {
                  const id = String(template.id);
                  
                  // Create row click handler that navigates to edit view
                  const handleRowClick = () => {
                    // Navigate to edit template
                    handleEditTemplate(id);
                  };
                  
                  return (
                    <IndexTable.Row 
                      id={id} 
                      key={id} 
                      position={index}
                      selected={selectedResources.includes(id)}
                      onClick={handleRowClick} // Add row click handler
                    >
                      <IndexTable.Cell>
                        <Text variant="bodyMd" fontWeight="bold" as="span">
                          {template.title}
                        </Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {template.type === 'invoice' && (
                          <Badge tone="info">Invoice</Badge>
                        )}
                        {template.type === 'packing' && (
                          <Badge tone="attention">Packing slip</Badge>
                        )}
                        {template.type === 'refund' && (
                          <Badge tone="warning">Refund</Badge>
                        )}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {template.default_set && <Badge tone="success">Default</Badge>}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Popover
                          active={activePopoverId === id}
                          activator={
                            <div onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="plain" 
                                icon={MenuHorizontalIcon}
                                onClick={() => {
                                  togglePopover(id);
                                }}
                              />
                            </div>
                          }
                          onClose={() => setActivePopoverId(null)}
                          preferredAlignment="right"
                        >
                          <div onClick={(e) => e.stopPropagation()}> {/* Add a wrapper div to stop all propagation */}
                            <Popover.Pane>
                              <ActionList
                                actionRole="menuitem"
                                items={[
                                  {
                                    content: 'Edit',
                                    icon: EditIcon,
                                    onAction: () => {
                                      handleEditTemplate(id);
                                    }
                                  },
                                  {
                                    content: 'Duplicate',
                                    icon: DuplicateIcon,
                                    onAction: () => {
                                      handleDuplicateTemplate(id);
                                    }
                                  },
                                  {
                                    content: template.default_set ? 'Default' : 'Set as default',
                                    icon: ViewIcon,
                                    onAction: () => {
                                      handleSetAsDefault(id);
                                    },
                                    disabled: template.default_set,
                                  },
                                  {
                                    content: 'Delete',
                                    icon: DeleteIcon,
                                    onAction: () => {
                                      handleDeleteTemplate(id);
                                    },
                                    destructive: true,
                                  },
                                ]}
                              />
                            </Popover.Pane>
                          </div>
                        </Popover>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  );
                })}
              </IndexTable>
            </>
          )}
        </LegacyCard>
        
        {/* Delete Confirmation Modal - App Bridge */}
        <Modal id={DELETE_MODAL_ID}>
          <TextContainer>
            <p>This action cannot be undone.</p>
          </TextContainer>
          <TitleBar 
            title={selectedResources.length <= 1 
              ? "Are you sure you want to delete this template?" 
              : "Are you sure you want to delete these templates?"}
          >
            <button 
              variant="primary" 
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
            <button 
              onClick={() => appBridge.modal.hide(DELETE_MODAL_ID)}
            >
              Cancel
            </button>
          </TitleBar>
        </Modal>
        
        {/* Request Form Modal - App Bridge */}
        <Modal id={REQUEST_FORM_MODAL_ID}>
          <FormLayout>
            <TextField 
              label="Your Email"
              id="email_contact"
              value={requestData.email}
              onChange={handleRequestEmailChange}
              autoComplete="email"
              error={requestData.error ? 'Please enter a valid email' : undefined}
            />
            
            <Select
              label="Template Type"
              options={[
                {label: 'Invoice', value: 'invoice'},
                {label: 'Refund', value: 'refund'},
                {label: 'Packing', value: 'packing'},
              ]}
              onChange={handleRequestTypeChange}
              value={requestData.type}
            />
            
            <TextField 
              label="Description"
              id="description"
              value={requestData.description}
              onChange={handleRequestDescriptionChange}
              multiline={4}
              maxLength={255}
              showCharacterCount
              autoComplete='off'
            />
          </FormLayout>
          <TitleBar title="Request Form">
            <button
              variant="primary"
              onClick={validateAndSubmitRequest}
        
            >
              Submit
            </button>
            <button 
              onClick={() => {
                appBridge.modal.hide(REQUEST_FORM_MODAL_ID);
                setRequestData({
                  type: 'invoice',
                  error: false,
                  email: '',
                  description: ''
                });
              }}
            >
              Cancel
            </button>
          </TitleBar>
        </Modal>
        
        {toastActive && (
          <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />
        )}
      </Page>
    </Frame>
  );
}

export default TemplateManagement;
