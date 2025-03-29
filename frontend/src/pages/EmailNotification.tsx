import React, {useState, useCallback, useEffect} from 'react';
import {
    Page,
    Card,
    BlockStack,
    Box,
    TextField,
    Button,
    Select,
    Layout,
    Toast,
    Frame, ButtonGroup, Collapsible, List, Text, InlineStack
} from '@shopify/polaris';
import axios from 'axios';
import {ConfigData} from '../types';
import {QuestionCircleIcon} from "@shopify/polaris-icons";

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
    shop_url: string;
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


const EmailNotification: React.FC = () => {
    // Toast state
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);
    const [activeButtonIndex, setActiveButtonIndex] = useState(0);
    // const [setIsLoading] = useState(false);

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
        shop_url: '',
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

    // Add state to store config data - using the shared ConfigData type
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [configLoaded, setConfigLoaded] = useState<boolean>(false);


    // Templates for the dropdown
    const templateOptions = React.useMemo(() => {
        if (!config?.templates) return [{label: "Please choose template", value: ""}];
        
        return [
            {label: "Please choose template", value: ""},
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
                shop_url: config.shop_url || '',

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
        }
    }, [config]);

    // Handle notification settings changes
    const handleNotificationSettingChange = useCallback((field: keyof NotificationSettings) => (value: string) => {
        setNotificationSettings(prevState => ({
            ...prevState,
            [field]: value,
        }));
    }, []);

    // Handle invoice number settings changes


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
        return `<a target="_blank" href="{{ shop.url }}/apps/order-printer/pdf/print/${template}/{{ order.id | times: 78 }}/{{ order.order_number | times: 78 }}?shop={{ shop.domain }}">${text}</a>`;
    }, []);

    // Collapsible state
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

    // Toggle instructions
    const toggleInstructions = useCallback(() => {
        setIsInstructionsOpen(prevOpen => !prevOpen);
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

            };

            // Call the API to save settings
            const response = await axios.post('/pdf/save/settings', {data});

            if (response.data) {
                toggleToast('Settings saved successfully');
            } else {
                toggleToast('Failed to save settings', true);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toggleToast('An error occurred while saving settings', true);
        }
    }, [storeInfo, printSettings, notificationSettings]);

    // Toast component
    const toastMarkup = toastActive ? (
        <Toast
            content={toastMessage}
            onDismiss={handleDismissToast}
            error={toastError}
            duration={3000}
        />
    ) : null;
    const handleButtonClick = useCallback(
        (index: number, template: string) => {
            if (activeButtonIndex === index) return;
            setActiveButtonIndex(index);
            setNotificationSettings(prevState => ({
                ...prevState,
                defaultEmailTemplate: template,
            }));
        },
        [activeButtonIndex],
    );
    return (
        <Frame>
            <Page
                title="Notification Email"
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}>
                    <BlockStack gap="500">
                        <Layout>
                            <Layout.Section>
                                <ButtonGroup variant="segmented">
                                    <Button
                                        pressed={activeButtonIndex === 0}
                                        onClick={() => handleButtonClick(0, 'order_confirm_template')}
                                    >
                                        Order Confirm
                                    </Button>
                                    <Button
                                        pressed={activeButtonIndex === 1}
                                        onClick={() => handleButtonClick(1, 'draft_order_template')}
                                    >
                                        Draft Order
                                    </Button>
                                    <Button
                                        pressed={activeButtonIndex === 2}
                                        onClick={() => handleButtonClick(2, 'order_edited_template')}
                                    >
                                        Order Edited
                                    </Button>
                                    <Button
                                        pressed={activeButtonIndex === 3}
                                        onClick={() => handleButtonClick(3, 'packing_slip_template')}
                                    >
                                        Packing Slip
                                    </Button>
                                    <Button
                                        pressed={activeButtonIndex === 4}
                                        onClick={() => handleButtonClick(4, 'order_refund_template')}
                                    >
                                        Order Refund
                                    </Button>
                                </ButtonGroup>
                            </Layout.Section>
                        </Layout>
                        <Layout>
                            <Layout.AnnotatedSection
                                title="Shopify email notification"
                                description="Insert a download link for PDF invoice in your Shopify order email notification"
                            >
                                <Card>
                                    <Box>
                                        <Button
                                            onClick={toggleInstructions}
                                            icon={QuestionCircleIcon}
                                            variant="plain"
                                            disclosure={isInstructionsOpen ? 'up' : 'down'}

                                        >
                                            How to insert code in Shopify email notification

                                        </Button>
                                        <Collapsible
                                            open={isInstructionsOpen}
                                            id="how-to-insert-code"
                                            transition={{duration: '150ms'}}
                                        >
                                            <Box paddingBlockStart="400">
                                                <BlockStack gap="300">
                                                    <List type="number">
                                                        <List.Item>Select a template and personalize the download link
                                                            text for your Shopify email notifications.</List.Item>
                                                        <List.Item>Copy the provided code</List.Item>
                                                        <List.Item>Navigate to your Shopify store settings notifications
                                                            and insert code into your email notification</List.Item>
                                                    </List>
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Card>
                            </Layout.AnnotatedSection>
                        </Layout>

                        <Layout>
                            <Layout.AnnotatedSection>
                                <Card>
                                    <Box paddingBlock="400" paddingInline="500">
                                        <BlockStack gap="400">
                                            <Select
                                                label="Default PDF template for email notification"
                                                options={templateOptions}
                                                value={notificationSettings.defaultEmailTemplate}
                                                onChange={handleNotificationSettingChange('defaultEmailTemplate')}
                                                placeholder="Select a template"
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
                                                label="Code"
                                                value={notificationSettings.code}
                                                onChange={handleNotificationSettingChange('code')}
                                                autoComplete="off"
                                                readOnly
                                                labelAction={{
                                                    content: 'Copy to clipboard',
                                                    onAction: copyToClipboard
                                                }}
                                            />
                                            <InlineStack gap="500" wrap={false} blockAlign='center'>

                                                        <Text as="span" fontWeight='bold'>
                                                            Insert code into Order Confirmation Email
                                                        </Text>

                                                        <Button
                                                             onClick={() => {
                                                                // Format the shop URL properly and navigate to notifications settings
                                                                const notificationsUrl = `https://admin.shopify.com/settings/notifications/customer`;
                                                                window.open(notificationsUrl, '_blank');
                                                            }}
                                                        >
                                                            Go to Settings
                                                        </Button>
                                                </InlineStack>
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

export default EmailNotification;