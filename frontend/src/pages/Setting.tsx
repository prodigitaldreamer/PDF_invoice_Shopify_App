import React, { useState, useCallback, useEffect } from 'react';
import {
    Page,
    Card,
    BlockStack,
    Box,
    TextField,
    Button,
    InlineStack,
    Text,
    Select,
    Collapsible,
    List,
    Layout,
    TextContainer,
    Toast,
    Frame,
} from '@shopify/polaris';
import {
    InfoIcon,
} from '@shopify/polaris-icons';
import axios from 'axios';
import { ConfigData } from '../types';

interface StoreInformation {
    storeName: string;
    phoneNumber: string;
    email: string;
    address: string;
    stateProvince: string;
    city: string;
    postcode: string;
    vatNumber: string;
    shop: string;
    allow_backend: boolean;
    allow_frontend: boolean;
    download_link_text: string;
    default_template: string;
    email_notify_template: string;
    invoice_start_number: string;
    front_button_label: string;
}

interface PrintSettings {
    adminOrderPrintEnabled: boolean;
    customerOrderPrintEnabled: boolean;
    printButtonLabel: string;
    defaultTemplate: string;
}

interface NotificationSettings {
    defaultEmailTemplate: string;
    downloadText: string;
    code: string;
}

interface InvoiceNumberSettings {
    firstInvoiceNumber: string;
}

const SettingsPage: React.FC = () => {
    // Toast state
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Store information state
    const [storeInfo, setStoreInfo] = useState<StoreInformation>({
        storeName: '',
        phoneNumber: '',
        email: '',
        address: '',
        stateProvince: '',
        city: '',
        postcode: '',
        vatNumber: '',
        shop: '',
        allow_backend: false,
        allow_frontend: false,
        download_link_text: '',
        default_template: '',
        email_notify_template: '',
        invoice_start_number: '',
        front_button_label: '',
    });
    console.log(storeInfo);
    // Print settings state
    const [printSettings, setPrintSettings] = useState<PrintSettings>({
        adminOrderPrintEnabled: false,
        customerOrderPrintEnabled: false,
        printButtonLabel: '',
        defaultTemplate: '',
    });

    // Notification settings state
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        defaultEmailTemplate: '',
        downloadText: '',
        code: '',
    });

    // Invoice number settings state
    const [invoiceNumberSettings, setInvoiceNumberSettings] = useState<InvoiceNumberSettings>({
        firstInvoiceNumber: '',
    });

    // Collapsible state
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
    
    // Add state to store config data - using the shared ConfigData type
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [configLoaded, setConfigLoaded] = useState<boolean>(false);

    // Templates for the dropdown
    const templateOptions = React.useMemo(() => {
        if (!config?.templates) return [{ label: "Please choose template", value: "" }];
        
        return [
            { label: "Please choose template", value: "" },
            ...config.templates.map(template => ({
                label: template.label,
                value: template.value.toString()
            }))
        ];
    }, [config]);

    // Load config data safely with interval check
    useEffect(() => {
        // Function to check if config is available
        const checkForConfig = () => {
            if (window.config) {
                setConfig(window.config);
                setConfigLoaded(true);
                return true;
            }
            return false;
        };
        
        // Try to get config immediately
        if (!checkForConfig()) {
            // If not available, set up a listener for when the script might load
            const configCheckInterval = setInterval(() => {
                if (checkForConfig()) {
                    clearInterval(configCheckInterval);
                }
            }, 100);
            
            // Clean up interval after 5 seconds if config never loads
            setTimeout(() => {
                clearInterval(configCheckInterval);
                if (!configLoaded) {
                    console.error("Failed to load window.config");
                    setConfigLoaded(true); // Mark as loaded anyway to prevent waiting indefinitely
                }
            }, 5000);
            
            return () => {
                clearInterval(configCheckInterval);
            };
        }
    }, []);

    // Update form states once config is loaded
    useEffect(() => {
        if (config?.info) {
            const info = config.info;
            
            // Update store information
            setStoreInfo({
                storeName: info.name || '',
                phoneNumber: info.phone || '',
                email: info.email || '',
                address: info.address || '',
                stateProvince: info.state || '',
                city: info.city || '',
                postcode: info.zip || '',
                vatNumber: info.vat || '',
                shop: config.shop || '',  
                allow_backend: info.allow_backend || false,
                allow_frontend: info.allow_frontend || false,
                download_link_text: info.download_link_text || '',
                default_template: info.default_template || '',
                email_notify_template: info.email_notify_template || '',
                invoice_start_number: info.invoice_start_number || '',
                front_button_label: info.front_button_label || '',

            });
            
            // Update print settings
            setPrintSettings({
                adminOrderPrintEnabled: info.allow_backend || false,
                customerOrderPrintEnabled: info.allow_frontend || false,
                printButtonLabel: info.front_button_label || '',
                defaultTemplate: info.default_template || '',
            });
            
            // Update notification settings
            setNotificationSettings({
                defaultEmailTemplate: info.email_notify_template || '',
                downloadText: info.download_link_text || '',
                code: '', // This might need to be generated or fetched separately
            });
            
            // Update invoice number settings
            setInvoiceNumberSettings({
                firstInvoiceNumber: info.invoice_start_number || '',
            });
        }
    }, [config]);

    // Handle store information changes
    const handleStoreInfoChange = useCallback((field: keyof StoreInformation) => (value: string) => {
        setStoreInfo(prevState => ({
            ...prevState,
            [field]: value,
        }));
    }, []);

    // Handle print settings changes
    const handlePrintSettingChange = useCallback((field: keyof PrintSettings) => (value: string | boolean) => {
        setPrintSettings(prevState => ({
            ...prevState,
            [field]: value,
        }));
    }, []);

    // Handle notification settings changes
    const handleNotificationSettingChange = useCallback((field: keyof NotificationSettings) => (value: string) => {
        setNotificationSettings(prevState => ({
            ...prevState,
            [field]: value,
        }));
    }, []);

    // Handle invoice number settings changes
    const handleInvoiceNumberSettingChange = useCallback((field: keyof InvoiceNumberSettings) => (value: string) => {
        setInvoiceNumberSettings(prevState => ({
            ...prevState,
            [field]: value,
        }));
    }, []);

    // Toggle instructions
    const toggleInstructions = useCallback(() => {
        setIsInstructionsOpen(prevOpen => !prevOpen);
    }, []);

    // Toast handlers
    const toggleToast = useCallback((message: string, isError: boolean = false) => {
        setToastMessage(message);
        setToastError(isError);
        setToastActive(true);
    }, []);

    const handleDismissToast = useCallback(() => setToastActive(false), []);

    // Copy code to clipboard
    const copyToClipboard = useCallback(() => {
        try {
            // Try modern clipboard API first
            navigator.clipboard.writeText(notificationSettings.code)
                .then(() => {
                    toggleToast('Code copied to clipboard');
                })
                .catch(() => {
                    // Fallback to older method
                    const textField = document.getElementById('setting_variables') as HTMLInputElement;
                    if (textField) {
                        textField.select();
                        textField.setSelectionRange(0, 99999);
                        document.execCommand('copy');
                        toggleToast('Code copied to clipboard');
                    } else {
                        toggleToast('Could not copy code', true);
                    }
                });
        } catch (error) {
            console.error('Copy error:', error);
            toggleToast('Could not copy code', true);
        }
    }, [notificationSettings.code, toggleToast]);

    // Create email link generator function similar to _email_link_download
    const generateEmailLinkCode = useCallback((template: string, text: string) => {
        return `<a target="_blank" href="{{ shop.url }}/apps/pdf-invoice/pdf/print/${template}/{{ order.id | times: 78 }}/{{ order.order_number | times: 78 }}?shop={{ shop.domain }}">${text}</a>`;
    }, []);

    // Add effect to update code field when template or download text changes
    useEffect(() => {
        if (notificationSettings.defaultEmailTemplate) {
            setNotificationSettings(prevState => ({
                ...prevState,
                code: generateEmailLinkCode(
                    notificationSettings.defaultEmailTemplate,
                    notificationSettings.downloadText || 'Download Invoice'
                )
            }));
        } else {
            setNotificationSettings(prevState => ({
                ...prevState,
                code: 'Select a template to generate PDF download link'
            }));
        }
    }, [notificationSettings.defaultEmailTemplate, notificationSettings.downloadText, generateEmailLinkCode]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Prepare data to match API expectations
            const data = {
                shop: storeInfo.shop,
                name: storeInfo.storeName,
                phone: storeInfo.phoneNumber,
                email: storeInfo.email,
                address: storeInfo.address,
                state: storeInfo.stateProvince,
                city: storeInfo.city,
                zip: storeInfo.postcode,
                vat: storeInfo.vatNumber,
                allow_backend: printSettings.adminOrderPrintEnabled,
                allow_frontend: printSettings.customerOrderPrintEnabled, 
                front_button_label: printSettings.printButtonLabel,
                default_template: printSettings.defaultTemplate,
                email_notify_template: notificationSettings.defaultEmailTemplate,
                download_link_text: notificationSettings.downloadText,
                invoice_start_number: invoiceNumberSettings.firstInvoiceNumber,

            };
            
            // Call the API to save settings
            const response = await axios.post('/pdf/save/settings', { data });
            
            if (response.data) {
                toggleToast('Settings saved successfully');
            } else {
                toggleToast('Failed to save settings', true);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toggleToast('An error occurred while saving settings', true);
        } finally {
            setIsLoading(false);
        }
    }, [storeInfo, printSettings, notificationSettings, invoiceNumberSettings]);

    // Toast component
    const toastMarkup = toastActive ? (
        <Toast 
            content={toastMessage} 
            onDismiss={handleDismissToast} 
            error={toastError} 
            duration={3000}
        />
    ) : null;

    return (
        <Frame>
            <Page 
                title="Settings" 
                primaryAction={
                    <Button 
                        variant="primary" 
                        onClick={handleSubmit}
                        loading={isLoading}
                    >
                        Save
                    </Button>
                }
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <BlockStack gap="500">
                        {/* Store Information Card */}
                        <Layout>
                            <Layout.AnnotatedSection
                                title="Fill in your store information"
                                description="This information will be auto-filled in your PDF invoices when you insert the corresponding variables into your templates"
                            >
                                <Card>
                                    <Box paddingBlock="400" paddingInline="500">
                                        <BlockStack gap="400">
                                            <TextField
                                                label="Store Name"
                                                value={storeInfo.storeName}
                                                onChange={handleStoreInfoChange('storeName')}
                                                placeholder="Value"
                                                autoComplete="off"
                                            />
                                            <TextField
                                                label="Phone Number"
                                                value={storeInfo.phoneNumber}
                                                onChange={handleStoreInfoChange('phoneNumber')}
                                                placeholder="Value"
                                                autoComplete="off"
                                            />
                                            <TextField
                                                label="Email"
                                                value={storeInfo.email}
                                                onChange={handleStoreInfoChange('email')}
                                                placeholder="Value"
                                                autoComplete="off"
                                                type="email"
                                            />
                                            <TextField
                                                label="Address"
                                                value={storeInfo.address}
                                                onChange={handleStoreInfoChange('address')}
                                                placeholder="Value"
                                                autoComplete="off"
                                            />

                                            <InlineStack gap="500" wrap={false}>
                                                <Box width="50%">
                                                    <TextField
                                                        label="State/Province"
                                                        value={storeInfo.stateProvince}
                                                        onChange={handleStoreInfoChange('stateProvince')}
                                                        placeholder="Value"
                                                        autoComplete="off"
                                                    />
                                                </Box>
                                                <Box width="50%">
                                                    <TextField
                                                        label="City"
                                                        value={storeInfo.city}
                                                        onChange={handleStoreInfoChange('city')}
                                                        placeholder="Value"
                                                        autoComplete="off"
                                                    />
                                                </Box>
                                            </InlineStack>

                                            <InlineStack gap="500" wrap={false}>
                                                <Box width="50%">
                                                    <TextField
                                                        label="Postcode"
                                                        value={storeInfo.postcode}
                                                        onChange={handleStoreInfoChange('postcode')}
                                                        placeholder="Value"
                                                        autoComplete="off"
                                                    />
                                                </Box>
                                                <Box width="50%">
                                                    <TextField
                                                        label="VAT number"
                                                        value={storeInfo.vatNumber}
                                                        onChange={handleStoreInfoChange('vatNumber')}
                                                        placeholder="Value"
                                                        autoComplete="off"
                                                    />
                                                </Box>
                                            </InlineStack>
                                        </BlockStack>
                                    </Box>
                                </Card>
                            </Layout.AnnotatedSection>
                        </Layout>


                        {/* Print Settings Card */}
                        <Layout>
                            <Layout.Section variant='oneThird'>
                                <TextContainer>
                                    <Text id="storeDetails" variant="headingMd" as="h2">
                                        Add a Print Invoice Button to Shopify
                                    </Text>
                                    <Text tone="subdued" as="p">
                                        This allows you to preview and print invoices on the Shopify admin order page, and your customers can do the same on their order status page.
                                    </Text>
                                </TextContainer>
                            </Layout.Section>
                            <Layout.Section>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text as="p" variant="bodyMd">
                                            Printing on Shopify admin order page is <Text as="span" fontWeight='bold'>{printSettings.adminOrderPrintEnabled ? 'Enabled' : 'Disabled'}</Text>
                                        </Text>
                                        <Box>
                                            <Button
                                                onClick={() => handlePrintSettingChange('adminOrderPrintEnabled')(!printSettings.adminOrderPrintEnabled)}
                                            >
                                                {printSettings.adminOrderPrintEnabled ? 'Disable' : 'Enable'}
                                            </Button>
                                        </Box>
                                    </BlockStack>
                                </Card>
                            </Layout.Section>
                        </Layout>

                        <Layout>
                            <Layout.AnnotatedSection>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text as="p" variant="bodyMd">
                                            Printing on Shopify customer order page is <Text as="span" fontWeight="bold">{printSettings.customerOrderPrintEnabled ? 'Enabled' : 'Disabled'}</Text>
                                        </Text>
                                        <Box>
                                            <Button
                                                onClick={() => handlePrintSettingChange('customerOrderPrintEnabled')(!printSettings.customerOrderPrintEnabled)}
                                            >
                                                {printSettings.customerOrderPrintEnabled ? 'Disable' : 'Enable'}
                                            </Button>
                                        </Box>

                                        <TextField
                                            label="Print button label"
                                            value={printSettings.printButtonLabel}
                                            onChange={handlePrintSettingChange('printButtonLabel') as (value: string) => void}
                                            placeholder="Value"
                                            autoComplete="off"
                                        />
                                        <Select
                                            label="Default print invoice template for customer"
                                            options={templateOptions}
                                            value={printSettings.defaultTemplate}
                                            onChange={handlePrintSettingChange('defaultTemplate') as (value: string) => void}
                                            placeholder="Value"
                                        />
                                    </BlockStack>
                                </Card>
                            </Layout.AnnotatedSection>
                        </Layout>

                        {/* Notification Settings Card */}
                        <Layout>
                            <Layout.AnnotatedSection
                                title="Shopify email notification"
                                description="Insert a download link for PDF invoice in your Shopify order email notification"
                            >
                                <Card>
                                    <Box paddingBlock="400" paddingInline="500">
                                        <BlockStack gap="400">
                                            <Select
                                                label="Default PDF template for email notification"
                                                options={templateOptions}
                                                value={notificationSettings.defaultEmailTemplate}
                                                onChange={handleNotificationSettingChange('defaultEmailTemplate')}
                                                placeholder="Value"
                                            />
                                            <TextField
                                                label="Download text"
                                                value={notificationSettings.downloadText}
                                                onChange={handleNotificationSettingChange('downloadText')}
                                                placeholder="Value"
                                                autoComplete="off"
                                            />
                                            <TextField
                                                id="setting_variables"
                                                label="Copy code"
                                                value={notificationSettings.code}
                                                onChange={handleNotificationSettingChange('code')}
                                                autoComplete="off"
                                                readOnly
                                                labelAction={{
                                                    content: 'Copy to clipboard',
                                                    onAction: copyToClipboard
                                                }}
                                            />
                                            <Button
                                                variant="primary" 
                                                onClick={() => window.open('https://admin.shopify.com/store/pdf-trest/email_templates/order_invoice/preview', '_blank')}
                                            >
                                                Edit Order Notification in Shopify
                                            </Button>
                                        </BlockStack>
                                    </Box>
                                </Card>
                            </Layout.AnnotatedSection>
                        </Layout>

                        <Layout>
                            <Layout.AnnotatedSection>
                                <Card>
                                    <Box>
                                        <Button
                                            onClick={toggleInstructions}
                                            icon={InfoIcon}
                                            variant="plain"
                                            disclosure={isInstructionsOpen ? 'up' : 'down'}
                                        >
                                            How to insert code in Shopify email notification
                                        </Button>
                                        <Collapsible
                                            open={isInstructionsOpen}
                                            id="how-to-insert-code"
                                            transition={{ duration: '150ms' }}
                                        >
                                            <Box paddingBlockStart="400">
                                                <BlockStack gap="300">
                                                    <List type="number">
                                                        <List.Item>Select a template and personalize the download link text for your Shopify email notifications.</List.Item>
                                                        <List.Item>Copy the provided code</List.Item>
                                                        <List.Item>Navigate to your Shopify store settings notifications and insert code into your email notification</List.Item>
                                                    </List>
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>


                                    </Box>
                                </Card>
                            </Layout.AnnotatedSection>
                        </Layout>

                        {/* Invoice Number Settings Card */}
                        <Layout>
                            <Layout.AnnotatedSection
                                title="Customize invoice number"
                                description="Use a custom invoice number instead of the default Shopify order number"
                            >
                                <Card>
                                    <Box paddingBlock="400" paddingInline="500">
                                        <BlockStack gap="400">
                                            <TextField
                                                label="The first invoice number"
                                                value={invoiceNumberSettings.firstInvoiceNumber}
                                                onChange={handleInvoiceNumberSettingChange('firstInvoiceNumber')}
                                                placeholder="Value"
                                                autoComplete="off"
                                            />

                                            <BlockStack gap="300">
                                                <Text as="p" variant="bodyMd">Example: If you set the first invoice number as 003, start counting from the first Shopify order (#1001)</Text>
                                                <Box paddingInline="500">
                                                    <BlockStack gap="100">
                                                        <Text as="p" variant="bodyMd">#1001 - #003</Text>
                                                        <Text as="p" variant="bodyMd">#1002 - #004</Text>
                                                        <Text as="p" variant="bodyMd">#1003 - #005</Text>
                                                    </BlockStack>
                                                </Box>
                                                <Text as="p" variant="bodyMd">#003 will appear on PDF invoice instead of #1001 if you insert "Custom Invoice Number" variable on your invoice template</Text>
                                            </BlockStack>
                                        </BlockStack>
                                    </Box>
                                </Card>
                            </Layout.AnnotatedSection>
                        </Layout>
                    </BlockStack>
                </form>
                {toastMarkup}
            </Page>
        </Frame>
    );
};

export default SettingsPage;