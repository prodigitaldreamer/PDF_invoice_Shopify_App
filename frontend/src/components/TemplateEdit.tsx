import React, { useEffect, useRef, useState } from 'react';
import {
  Frame,
  Page,
  LegacyCard,
  Text,
  Toast,
  Spinner,
  Modal,
  Button,
  TextField,
  Icon,
  Scrollable,
  TextContainer,
  Box,
  BlockStack
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';

// Import the variables data (you may need to convert to TypeScript)
import { data } from '../data/DataVariable';

interface TemplateEditProps {
  templateId?: string;
  templateHtml?: string;
  templateJson?: string; // Add this
  onSave?: (html: string, design: any) => void;
  onClose?: () => void;
}

// Define the Unlayer interface
interface Unlayer {
  init: (config: any) => void;
  loadDesign: (design: any) => void;
  exportHtml: (callback: (data: { html: string, design: any }) => void) => void;
  saveDesign: (callback: (design: any) => void) => void;
  addEventListener: (event: string, callback: (...args: any) => void) => void;
  registerCallback: (key: string, callback: (...args: any) => void) => void;
  destroy: () => void;
}

declare global {
  interface Window { 
    unlayer: Unlayer;
  }
}

const TemplateEdit: React.FC<TemplateEditProps> = ({ 
  templateHtml = '',
  templateJson = '', // Add this param
  onSave, 
  onClose 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVariables, setFilteredVariables] = useState(data);
  
  // Initial design object - use this to load a template
  const initialDesign = useRef<any>({
    body: {
      rows: [
        {
          cells: [1],
          columns: [
            {
              contents: [],
            }
          ]
        }
      ]
    },
    schemaVersion: 6
  });

  // Load the Unlayer script once when component mounts
  useEffect(() => {
    // Check if unlayer is already loaded
    if (window.unlayer) {
      setIsEditorLoaded(true);
      return;
    }

    const unlayerScript = document.createElement('script');
    unlayerScript.src = 'https://editor.unlayer.com/embed.js';
    unlayerScript.async = true;
    unlayerScript.onload = () => {
      setIsEditorLoaded(true);
    };
    document.body.appendChild(unlayerScript);

    return () => {
      // Cleanup
      if (window.unlayer) {
        try {
          window.unlayer.destroy();
        } catch (e) {
          console.error("Error destroying editor:", e);
        }
      }
      // Only remove the script if we added it
      if (document.body.contains(unlayerScript)) {
        document.body.removeChild(unlayerScript);
      }
    };
  }, []);

  // Initialize the editor once the script is loaded
  useEffect(() => {
    if (isEditorLoaded && editorRef.current) {
      setTimeout(() => {
        initEditor();
      }, 500); // Increased delay to ensure DOM is ready
    }
  }, [isEditorLoaded]);

  // Initialize the Unlayer editor
  const initEditor = () => {
    if (!window.unlayer) {
      console.error("Unlayer not available");
      return;
    }

    try {
      // Initialize with full design capabilities
      window.unlayer.init({
        id: 'editor-container', 
        projectId: 267669,
        displayMode: "email", // Can also use "web" if needed
        appearance: {
          theme: 'light',
          panels: {
            tools: {
              dock: 'left'
            }
          }
        },
        // Enable all design tools
        tools: {
          // Make sure all design tools are enabled
          text: {
            enabled: true
          },
          image: {
            enabled: true
          },
          button: {
            enabled: true
          },
          divider: {
            enabled: true
          },
          spacer: {
            enabled: true
          },
          social: {
            enabled: true
          },
          video: {
            enabled: true
          },
          html: {
            enabled: true
          },
          // Any other tools you want to explicitly enable
        },
        editor: {
          minRows: 1,
          maxRows: 100
        },
        features: {
          previewDesktop: true,
          previewMobile: true,
          stockImages: true,
          undoRedo: true
        },
        designMode: true, // Explicitly enable design mode
        designTagsText: {},
        safeHtml: false  // Allow all HTML
      });

      // After editor is initialized, load template content
      setTimeout(() => {
        loadTemplateContent();
      }, 500);

      // Register change detection
      window.unlayer.addEventListener('design:updated', () => {
        setHasUnsavedChanges(true);
      });
    } catch (error) {
      console.error("Error initializing unlayer:", error);
    }
  };

  // Separate function to load template content
  const loadTemplateContent = () => {
    if (!window.unlayer) return;

    try {
      console.log("Loading template content");
      
      if (templateJson && templateJson.trim() !== '') {
        // First try to use the provided JSON design directly
        try {
          const design = JSON.parse(templateJson);
          console.log("Successfully loaded template from JSON design");
          window.unlayer.loadDesign(design);
          return;
        } catch (e) {
          console.log("Invalid JSON design, falling back to HTML", e);
        }
      }
      
      if (templateHtml && templateHtml.trim() !== '') {
        // Fall back to HTML if JSON parsing fails or is not available
        console.log("Loading template content, HTML length:", templateHtml?.length);
      
        if (templateHtml && templateHtml.trim() !== '') {
          // Check if content is likely HTML (starts with HTML tags)
          const isLikelyHtml = /^\s*(<!DOCTYPE|<html|<div|<body)/i.test(templateHtml);
          
          if (!isLikelyHtml) {
            try {
              // Try parsing as JSON only if it doesn't look like HTML
              const design = JSON.parse(templateHtml);
              console.log("Successfully parsed template as JSON design");
              window.unlayer.loadDesign(design);
              return;
            } catch (e) {
              console.log("Not valid JSON, will treat as HTML content", e);
            }
          }
          
          // Handle as HTML content - use HTML block instead of raw HTML content
          console.log("Creating HTML design structure");
          
          // Create a cleaner design structure with the HTML content
          const htmlDesign = {
            body: {
              rows: [
                {
                  cells: [1],
                  values: {
                    backgroundColor: '#ffffff',
                    columnsBackgroundColor: '#ffffff',
                    backgroundImage: {},
                    padding: '0px'
                  },
                  columns: [
                    {
                      contents: [
                        {
                          type: "html",
                          values: {
                            html: templateHtml,
                            hideDesktop: false,
                            hideMobile: false,
                            contentAlignment: "center"
                          },
                          parent: {
                            type: "column",
                            content: []
                          }
                        }
                      ],
                      values: {
                        backgroundColor: '#ffffff',
                        padding: '12px',
                        border: {},
                        _meta: {
                          htmlID: `col-${Date.now()}`,
                          htmlClassNames: 'container'
                        }
                      }
                    }
                  ]
                }
              ],
              values: {
                backgroundColor: '#ffffff',
                backgroundImage: {},
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                font: {
                  family: 'Arial',
                  fallback: 'Helvetica'
                }
              }
            },
            counters: {
              u_row: 1,
              u_column: 1,
              u_content_html: 1
            },
            schemaVersion: 8
          };
          
          console.log("Loading HTML design structure");
          window.unlayer.loadDesign(htmlDesign);
        } else {
          // Load a default template structure
          console.log("No template content, loading default design");
          window.unlayer.loadDesign(initialDesign.current);
        }
      } else {
        // Load a default template structure
        window.unlayer.loadDesign(initialDesign.current);
      }
    } catch (error) {
      console.error("Error loading template content:", error);
      window.unlayer.loadDesign(initialDesign.current);
    }
  };

  // Save the template
  const handleSave = async () => {
    if (!window.unlayer) return;

    setIsSaving(true);
    try {
      window.unlayer.exportHtml((data) => {
        console.log("Saving template:", { 
          html_length: data.html?.length,
          design: typeof data.design === 'object' ? 'object' : typeof data.design
        });
        if (onSave) {
          // Send both HTML and the full design object for storage
          onSave(data.html, data.design);
        }
        setHasUnsavedChanges(false);
        setToastError(false);
        setToastMessage('Template saved successfully');
        setShowToast(true);
      });
    } catch (error) {
      console.error("Error saving template:", error);
      setToastError(true);
      setToastMessage('Failed to save template');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle closing the editor
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirmation(true);
    } else {
      if (onClose) onClose();
    }
  };

  // Confirm exit without saving
  const confirmExit = () => {
    setShowExitConfirmation(false);
    if (onClose) onClose();
  };

  // Filter variables when search query changes
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredVariables(data);
      return;
    }

    const filterRegex = new RegExp(searchQuery, 'i');
    const resultOptions = data.map(category => ({
      title: category.title,
      options: category.options.filter(item => 
        item.string.match(filterRegex) !== null
      )
    }));

    setFilteredVariables(resultOptions);
  }, [searchQuery]);

  // Handle variable selection
  const handleVariableSelect = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToastError(false);
      setToastMessage('Variable copied to clipboard');
      setShowToast(true);
    } catch (err) {
      // Fallback for browsers that don't support Clipboard API
      const textField = document.createElement('textarea');
      textField.value = value;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      document.body.removeChild(textField);
      setToastError(false);
      setToastMessage('Variable copied to clipboard');
      setShowToast(true);
    }
  };

  return (
    <Frame>
      <Page
        fullWidth
        title="Template Editor"
        backAction={{
          content: "Back to Template",
          onAction: handleClose
        }}
        primaryAction={{
          content: isSaving ? "Saving..." : "Save Template",
          disabled: isSaving || !isEditorLoaded,
          loading: isSaving,
          onAction: handleSave
        }}
        secondaryActions={[
          {
            content: "Search Variables",
            disabled: !isEditorLoaded,
            onAction: () => setShowVariablesModal(true)
          }
        ]}
      >
        {!isEditorLoaded && (
          <LegacyCard>
            <LegacyCard.Section>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spinner size="large" />
                <div style={{ marginTop: '10px' }}>
                  <Text variant="headingMd" as="p">Loading Editor...</Text>
                </div>
              </div>
            </LegacyCard.Section>
          </LegacyCard>
        )}

        <div 
          style={{ 
            height: 'calc(100vh - 160px)',
            display: isEditorLoaded ? 'block' : 'none',
            marginTop: '16px'
          }}
        >
          <div 
            id="editor-container" 
            ref={editorRef}
            style={{ 
              width: '100%', 
              height: '100%',
              border: '1px solid #E1E3E5',
              borderRadius: '4px'
            }}
          ></div>
        </div>

        {/* Variables Modal */}
        <Modal
          open={showVariablesModal}
          onClose={() => setShowVariablesModal(false)}
          title="Search Variables"
          primaryAction={{
            content: 'Close',
            onAction: () => setShowVariablesModal(false),
          }}
        >
          <Modal.Section>
            <TextContainer>
              <Text as='p'>Search and click on a variable to copy it to clipboard</Text>
            </TextContainer>
            
            <Box paddingBlockEnd="400" paddingBlockStart="200">
              <TextField
                label="Search variables"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Start typing to search..."
                prefix={<Icon source={SearchIcon} />}
                autoComplete="off"
              />
            </Box>
            
            <Scrollable style={{ height: '400px' }}>
              {filteredVariables.map((category) => (
                category.options.length > 0 && (
                  <Box key={category.title} paddingBlockEnd="400">
                    <Text variant="headingMd" as="h2">{category.title}</Text>
                    <BlockStack gap="400">
                      {category.options.map((item) => (
                        <Button 
                          key={item.value} 
                          onClick={() => handleVariableSelect(item.value)}
                          fullWidth
                          variant='plain'
                        >
                          {item.string}
                        </Button>
                      ))}
                    </BlockStack>
                  </Box>
                )
              ))}
            </Scrollable>
          </Modal.Section>
        </Modal>

        {/* Toast notification */}
        {showToast && (
          <Toast
            content={toastMessage}
            error={toastError}
            onDismiss={() => setShowToast(false)}
            duration={3000}
          />
        )}

        {/* Exit confirmation modal */}
        <Modal
          open={showExitConfirmation}
          onClose={() => setShowExitConfirmation(false)}
          title="Unsaved Changes"
          primaryAction={{
            content: 'Save and Exit',
            onAction: () => {
              handleSave();
              setShowExitConfirmation(false);
              if (onClose) setTimeout(() => onClose(), 500);
            }
          }}
          secondaryActions={[
            {
              content: 'Discard Changes',
              destructive: true,
              onAction: confirmExit
            }
          ]}
        >
          <Modal.Section>
            <p>You have unsaved changes. What would you like to do?</p>
          </Modal.Section>
        </Modal>
      </Page>
    </Frame>
  );
};

export default TemplateEdit;