import React, { useState, useCallback } from 'react';
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
    Scrollable
} from '@shopify/polaris';
import {
    DuplicateIcon,
    InfoIcon,
} from '@shopify/polaris-icons';

interface StoreInformation {
    storeName: string;
    phoneNumber: string;
    email: string;
    address: string;
    stateProvince: string;
    city: string;
    postcode: string;
    vatNumber: string;
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
    });

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

    // Templates for the dropdown
    const templateOptions = [
        { label: 'Default Template', value: 'default' },
        { label: 'Minimal Template', value: 'minimal' },
        { label: 'Detailed Template', value: 'detailed' },
    ];

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

    // Handle form submission
    const handleSubmit = useCallback(() => {
        console.log('Store Information:', storeInfo);
        console.log('Print Settings:', printSettings);
        console.log('Notification Settings:', notificationSettings);
        console.log('Invoice Number Settings:', invoiceNumberSettings);
        // Save logic would go here
    }, [storeInfo, printSettings, notificationSettings, invoiceNumberSettings]);

    return (
        <Page title="Settings" primaryAction={<Button variant="primary">Save</Button>}>
             <Scrollable style={{height: '100%'}} focusable>
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
                            title="Insert a download link into the notification email"
                            description="This allows your customers to download their invoices from the Shopify order email"
                        >
                            <Card>
                                <Box paddingBlock="400" paddingInline="500">
                                    <BlockStack gap="400">
                                        <Select
                                            label="Default template for email notification"
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
                                            label="Code"
                                            value={notificationSettings.code}
                                            onChange={handleNotificationSettingChange('code')}
                                            placeholder="Value"
                                            autoComplete="off"
                                            prefix={<></>}
                                            suffix={<Button icon={DuplicateIcon} variant="plain" accessibilityLabel="Copy code" />}
                                        />

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
            </Scrollable>
        </Page>
    );
};

export default SettingsPage;