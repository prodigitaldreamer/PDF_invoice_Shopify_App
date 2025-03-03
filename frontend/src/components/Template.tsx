import { useState, useCallback } from 'react';
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
} from '@shopify/polaris';
import type {IndexFiltersProps, TabProps} from '@shopify/polaris';
import { 
  MenuHorizontalIcon,
  EditIcon,
  DuplicateIcon,
  DeleteIcon,
  ViewIcon
} from '@shopify/polaris-icons';

interface TemplateManagementProps {
  onEditTemplate?: (id: string) => void;
}

function TemplateManagement({ onEditTemplate }: TemplateManagementProps) {
  // PopOver state
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  
  // IndexFilters tab management
  const [itemStrings, setItemStrings] = useState([
    'ALL',
    'Invoice',
    'Packing slip',
    'Refund',
  ]);
  
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const deleteView = (index: number) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name: string) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
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
  
  const [sortSelected, setSortSelected] = useState(['name asc']);
  const {mode, setMode} = useSetIndexFiltersMode();
  
  // Search and filter states
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
            {label: 'Invoice', value: 'Invoice'},
            {label: 'Packing slip', value: 'Packing slip'},
            {label: 'Refund', value: 'Refund'},
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

  // Template data
  const rows = [
    { id: '1', name: 'Invoice 1', type: 'Invoice', default: true },
    { id: '2', name: 'Invoice 2', type: 'Invoice', default: false },
    { id: '3', name: 'Packing 1', type: 'Packing slip', default: true },
    { id: '4', name: 'Packing 2', type: 'Packing slip', default: false },
    { id: '5', name: 'Refund 1', type: 'Refund', default: true },
    { id: '6', name: 'Refund 2', type: 'Refund', default: false },
  ];

  // Filter templates based on selected filters
  const filteredRows = rows.filter(row => {
    // Filter by search query
    if (queryValue && !row.name.toLowerCase().includes(queryValue.toLowerCase())) {
      return false;
    }
    
    // Filter by tab selection (except "ALL" tab)
    if (selected !== 0 && row.type !== itemStrings[selected]) {
      return false;
    }
    
    // Filter by template type
    if (templateType && templateType.length > 0 && !templateType.includes(row.type)) {
      return false;
    }
    
    // Filter by default status
    if (defaultStatus && defaultStatus.length > 0) {
      if (defaultStatus.includes('default') && !defaultStatus.includes('non-default') && !row.default) {
        return false;
      }
      if (defaultStatus.includes('non-default') && !defaultStatus.includes('default') && row.default) {
        return false;
      }
    }
    
    return true;
  });

  // Sort templates
  const sortedRows = [...filteredRows].sort((a, b) => {
    const sortOrder = sortSelected[0];
    
    switch (sortOrder) {
      case 'name asc':
        return a.name.localeCompare(b.name);
      case 'name desc':
        return b.name.localeCompare(a.name);
      case 'type asc':
        return a.type.localeCompare(b.type);
      case 'type desc':
        return b.type.localeCompare(a.type);
      default:
        return 0;
    }
  });

  // Action handlers
  const handleEditTemplate = (id: string) => {
    console.log(`Edit template ${id}`);
    setActivePopoverId(null);
    if (onEditTemplate) {
      onEditTemplate(id);
    }
  };

  const handleDuplicateTemplate = (id: string) => {
    console.log(`Duplicate template ${id}`);
    setActivePopoverId(null);
  };

  const handleSetAsDefault = (id: string) => {
    console.log(`Set template ${id} as default`);
    setActivePopoverId(null);
  };

  const handleDeleteTemplate = (id: string) => {
    console.log(`Delete template ${id}`);
    setActivePopoverId(null);
  };

  const togglePopover = (id: string) => {
    setActivePopoverId(activePopoverId === id ? null : id);
  };

  // Resource selection state
  const resourceName = { singular: 'template', plural: 'templates' };
  const {selectedResources, allResourcesSelected, handleSelectionChange} = 
    useIndexResourceState(rows);

  // Add these bulk action handlers
  const handleBulkSetDefault = useCallback(() => {
    console.log(`Setting templates as default: ${selectedResources.join(', ')}`);
    // Implementation to set selected templates as default
    // For example:
    // selectedResources.forEach(id => {
    //   // API call to set template as default
    // });
  }, [selectedResources]);

  const handleBulkDelete = useCallback(() => {
    console.log(`Deleting templates: ${selectedResources.join(', ')}`);
    // Implementation to delete selected templates
    // For example:
    // selectedResources.forEach(id => {
    //   // API call to delete template
    // });
  }, [selectedResources]);
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
  ]

  return (
    <Page title="Template">
      <LegacyCard>
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
          itemCount={sortedRows.length}
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
          bulkActions={bulkActions}
        >
          {sortedRows.map(({ id, name, type, default: isDefault }, index) => (
            <IndexTable.Row 
              id={id} 
              key={id} 
              position={index}
              selected={selectedResources.includes(id)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" fontWeight="bold" as="span">
                  {name}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {type === 'Invoice' && (
                  <Badge tone="info">{type}</Badge>
                )}
                {type === 'Packing slip' && (
                  <Badge tone="attention">{type}</Badge>
                )}
                {type === 'Refund' && (
                  <Badge tone="warning">{type}</Badge>
                )}
              </IndexTable.Cell>
              <IndexTable.Cell>
                {isDefault && <Badge tone="success">Default</Badge>}
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Popover
                  active={activePopoverId === id}
                  activator={
                    <Button 
                      variant="plain" 
                      icon={MenuHorizontalIcon} 
                      onClick={() => togglePopover(id)} 
                    />
                  }
                  onClose={() => setActivePopoverId(null)}
                  preferredAlignment="right"
                >
                  <Popover.Pane>
                    <ActionList
                      actionRole="menuitem"
                      items={[
                        {
                          content: 'Edit',
                          icon: EditIcon,
                          onAction: () => handleEditTemplate(id),
                        },
                        {
                          content: 'Duplicate',
                          icon: DuplicateIcon,
                          onAction: () => handleDuplicateTemplate(id),
                        },
                        {
                          content: isDefault ? 'Default' : 'Set as default',
                          icon: ViewIcon,
                          onAction: () => handleSetAsDefault(id),
                          disabled: isDefault,
                        },
                        {
                          content: 'Delete',
                          icon: DeleteIcon,
                          onAction: () => handleDeleteTemplate(id),
                          destructive: true,
                        },
                      ]}
                    />
                  </Popover.Pane>
                </Popover>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </LegacyCard>
    </Page>
  );
}

export default TemplateManagement;