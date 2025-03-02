import React, {Component} from "react";
import {
    Button,
    Page,
    Layout,
    Card,
    TextContainer,
    Heading,
    Checkbox,
    TextField,
    Select,
    Icon,
    Text,
    Grid,
    List,
    Toast,
    Frame, TextStyle, SettingToggle, Banner, Stack, Collapsible, Modal

} from "@shopify/polaris"
import "@shopify/polaris/build/esm/styles.css";
import "./settings.css"
import {QuestionMarkMajor, DropdownMinor, CaretUpMinor} from "@shopify/polaris-icons";
import $ from 'jquery';
import EmailEditor from "react-email-editor";
import createApp from '@shopify/app-bridge';
import {Redirect} from '@shopify/app-bridge/actions';

const config = window.config
var Buffer = require('buffer/').Buffer

const url_atob = atob(new URLSearchParams(location.search).get("host"));
let current_admin_url = url_atob.substring(0, url_atob.lastIndexOf('/'));
if (current_admin_url ==='admin.shopify.com/store') {
    current_admin_url = config.shop_url
}

const admin_url = new URLSearchParams(location.search).get("host") ? current_admin_url : config.shop_url;
const encodedStringHost = Buffer.from(admin_url).toString('base64');
const config_render = {
    apiKey: config.api_key,
    shopOrigin: admin_url,
    host: encodedStringHost
};
const app = createApp({
    apiKey: config_render.apiKey,
    host: config_render.host,
});
const redirect = Redirect.create(app);


class Settings extends Component {
    state = {
        info: config.info,
        embeds: false,
        notiEmail: false,
        toast: false,
        message: "",
        loading: false,
        valueCopyCode: "",
        isChange: false,
        activeModalLeave: false,
        redirectTo: null,
    }

    handleChangeAllowFrontend(value) {
        this.state.info.allow_frontend = value;
        this.setState(this.state);
    }

    handleChangeButtonLabel(value) {
        this.state.info.front_button_label = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeAllowBackend(value) {
        this.state.info.allow_backend = !this.state.info.allow_backend;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeAllowFrontEnd(value) {
        this.state.info.allow_frontend = !this.state.info.allow_frontend;
        this.state.isChange = true;
        this.setState(this.state);
    }

    toggleActive(value) {
        this.state.toast = !this.state.toast;
        this.state.message = "Copied!"
        this.setState(this.state);
    }

    handleSelectDefaultTemplate(value) {
        this.state.info.default_template = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleSelectDefaultTemplateEmail(value) {
        this.state.info.email_notify_template = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeCompany(value) {
        this.state.info.name = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangePhone(value) {
        this.state.info.phone = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeEmail(value) {
        this.state.info.email = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeAddress(value) {
        this.state.info.address = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeState(value) {
        this.state.info.state = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeCity(value) {
        this.state.info.city = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangePostCode(value) {
        this.state.info.zip = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeVAT(value) {
        this.state.info.vat = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleDownloadText(value) {
        this.state.info.download_link_text = value;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleCopyCode(value) {
        this.state.valueCopyCode = value;
        this.setState(this.state);
    }

    handleInvoiceNumber(value) {
        if( /^[0-9]+$/.test(value) || value.length === 0 ) {
            this.state.info.invoice_start_number = value;
            this.state.isChange = true;
            this.setState(this.state);
          }
    }

    handleChangeNotiEmail(value) {
        this.state.notiEmail = !this.state.notiEmail;
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeEmbeds(value) {
        this.state.embeds = !this.state.embeds;
        this.setState(this.state);
    }

    _email_link_download(template, text) {
        return (
            '<a target="_blank" href="{{ shop.url }}/apps/pdf-invoice/pdf/print/' + template + '/' + '{{ order.id | times: 78 }}/{{ order.order_number | times: 78 }}?shop={{ shop.domain }}">' + text + '</a>'
        )
    }

    get_template_option() {
        let email_option = [{label: "Please choose template", value: ""}];
        config.templates.forEach((e) => {
            email_option.push({label: e.label, value: e.value.toString()})
        });
        return email_option
    }

    redirectTo(pathName) {
        this.state.redirectTo = pathName;
        if (this.state.isChange) {
            this.state.activeModalLeave = true;
            this.setState(this.state)
        } else {
            redirect.dispatch(Redirect.Action.APP, pathName);
        }
    }

    action_save_setting(action, data) {
        if (this.state.info.allow_frontend && this.state.info.default_template === "") {
            alert("Select default print template for customers!")
        } else {
            var self = this;
            return $.ajax(
                action,
                {
                    method: 'POST',
                    dataType: 'json',
                    data: JSON.stringify({
                        params: {
                            data
                        }
                    }),
                    contentType: 'application/json',
                    beforeSend: () => {
                        self.setState({loading: true})
                    }
                }
            ).done((res) => {
                setTimeout(() => {
                    if (res.result) {
                        self.setState({
                            loading: false,
                            toast: true,
                            message: 'Save successfully',
                            active: true,
                            isChange: false
                        })
                    } else {
                        self.setState({
                            loading: false,
                            toast: true,
                            message: 'Something went wrong.Please try again!',
                            active: true
                        })
                    }

                }, 1500)
            }).always(() => {
                setTimeout(() => {
                    self.setState({loading: false})
                }, 1500)
            })
        }
    }

    open_modal_leave() {
        return (<div style={{display: "none"}}>
            <Modal></Modal>
            <Modal
                open={this.state.activeModalLeave}
                onClose={() => this.handleChangeModalLeave()}
                title="Your changes have not been saved"
                primaryAction={{
                    content: 'Leave page',
                    destructive: true,
                    onAction: () => {
                        this.state.isChange = false;
                        this.redirectTo(this.state.redirectTo);
                    },
                }}
                secondaryActions={[
                    {
                        content: 'Stay on page',
                        onAction: () => this.handleChangeModalLeave(),
                    },
                ]}
            >
                <Modal.Section>
                    <TextContainer>
                        <p>
                            Leaving this page will discard all of your new changes. Are you sure you want to leave?
                        </p>
                    </TextContainer>
                </Modal.Section>
            </Modal>
        </div>)
    }

    handleChangeModalLeave() {
        this.state.activeModalLeave = !this.state.activeModalLeave;
        this.setState(this.state)
    }

    render() {
        this.state.valueCopyCode = this.state.info.email_notify_template != '' ? this._email_link_download(this.state.info.email_notify_template, this.state.info.download_link_text) : 'Select a template to generate PDF download link'

        const backEndContentStatus = this.state.info.allow_backend ? 'Disable' : 'Enable';
        const backEndTextStatus = this.state.info.allow_backend ? 'Enable' : 'Disable';

        const frontEndContentStatus = this.state.info.allow_frontend ? 'Disable' : 'Enable';
        const frontEndTextStatus = this.state.info.allow_frontend ? 'Enable' : 'Disable';

        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;
        return (
            <div>
                <div className={"setting-header"}>
                    <Page
                        title={"Settings"}

                        primaryAction={{
                            content: 'Save',
                            loading: this.state.loading,
                            disabled: !this.state.isChange,
                            onAction: () => {
                                var data = this.state.info
                                this.action_save_setting('/pdf/save/settings', data)
                            }
                        }}

                    />
                    {this.open_modal_leave()}
                </div>
                <div className={"setting-main"}>
                    <Page>
                        <Layout>
                            <Layout.Section secondary>
                                <TextContainer>
                                    <Heading>Printing buttons</Heading>
                                    <p>
                                        Print PDF files on Shopify admin and on order status pages
                                    </p>
                                </TextContainer>

                            </Layout.Section>
                            <Layout.Section>
                                <div className={"setting-element"}>

                                    <SettingToggle
                                        action={{
                                            content: backEndContentStatus,
                                            onAction: () => this.handleChangeAllowBackend(),
                                        }}
                                        enabled={this.state.info.allow_backend}
                                    >
                                        Printing on Shopify admin order page is <TextStyle
                                        variation="strong">{backEndTextStatus}</TextStyle>.
                                    </SettingToggle>
                                </div>

                                <div className={"setting-element"}>

                                    <SettingToggle
                                        action={{
                                            content: frontEndContentStatus,
                                            onAction: () => this.handleChangeAllowFrontEnd(),
                                        }}
                                        enabled={this.state.info.allow_frontend}
                                    >
                                        Printing on order status page is <TextStyle
                                        variation="strong">{frontEndTextStatus}</TextStyle>.
                                    </SettingToggle>
                                </div>

                                <Card sectioned>

                                    <div className={"setting-element"}>

                                        <TextField
                                            label="Print button label"
                                            value={this.state.info.front_button_label}
                                            onChange={(e) => this.handleChangeButtonLabel(e)}
                                            autoComplete="off"
                                            helpText="This will appear on order status page of your customers"
                                        />
                                    </div>
                                    <div className={"setting-element"}>
                                        <Select
                                            label="Default print template for customers"
                                            options={this.get_template_option()}
                                            onChange={(e) => this.handleSelectDefaultTemplate(e)}
                                            value={this.state.info.default_template}
                                            labelAction={{
                                                content: 'Create new template', onAction: () => {
                                                    this.redirectTo("/pdf/templates/0/edit");
                                                }
                                            }}
                                        />
                                    </div>
                                </Card>


                            </Layout.Section>

                        </Layout>

                        <div className={"wrap-pages"}>

                        </div>

                        <Layout>
                            <Layout.Section secondary>
                                <TextContainer>
                                    <Heading>Store details</Heading>
                                    <p>
                                        This will be automatically filled on your PDFs if you insert matching variables on your templates
                                    </p>
                                </TextContainer>

                            </Layout.Section>
                            <Layout.Section>

                                <Card sectioned>

                                    <div className={"setting-element"}>

                                        <TextField
                                            label="Store name"
                                            value={this.state.info.name}
                                            onChange={(e) => this.handleChangeCompany(e)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className={"setting-element"}>

                                        <TextField
                                            label="Phone number "
                                            value={this.state.info.phone}
                                            onChange={(e) => this.handleChangePhone(e)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className={"setting-element"}>

                                        <TextField
                                            label="Email"
                                            value={this.state.info.email}
                                            onChange={(e) => this.handleChangeEmail(e)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className={"setting-element"}>

                                        <TextField
                                            label="Address"
                                            value={this.state.info.address}
                                            onChange={(e) => this.handleChangeAddress(e)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className={"setting-element"}>
                                        <Grid>
                                            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                                                <div className={"setting-element"}>

                                                    <TextField
                                                        label="State/Province"
                                                        value={this.state.info.state}
                                                        onChange={(e) => this.handleChangeState(e)}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div className={"setting-element"}>

                                                    <TextField
                                                        label="Postcode"
                                                        value={this.state.info.zip}
                                                        onChange={(e) => this.handleChangePostCode(e)}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </Grid.Cell>
                                            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                                                <div className={"setting-element"}>

                                                    <TextField
                                                        label="City"
                                                        value={this.state.info.city}
                                                        onChange={(e) => this.handleChangeCity(e)}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div className={"setting-element"}>

                                                    <TextField
                                                        label="VAT number"
                                                        value={this.state.info.vat}
                                                        onChange={(e) => this.handleChangeVAT(e)}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </Grid.Cell>
                                        </Grid>
                                    </div>

                                </Card>


                            </Layout.Section>

                        </Layout>

                        <div className={"wrap-pages"}>

                        </div>

                        <Layout>
                            <Layout.Section secondary>
                                <TextContainer>
                                    <Heading>Shopify email notification</Heading>
                                    <p>
                                        Insert a download link for PDF invoice in your Shopify order email notification
                                    </p>
                                </TextContainer>

                            </Layout.Section>
                            <Layout.Section>
                                <Card sectioned>
                                    <div className={"app-embeds"}>
                                        <div className={"app-embeds-title"}>
                                            <Icon
                                                source={QuestionMarkMajor}
                                                color="base"
                                            />
                                            <Text variant="headingSm" as="h6">
                                                Insert code in Shopify email notification
                                            </Text>

                                        </div>
                                        <div className={"app-embed-icon"}
                                             onClick={(e) => this.handleChangeNotiEmail(e)}>
                                            <Icon
                                                source={this.state.notiEmail ? CaretUpMinor : DropdownMinor}
                                                color="base"
                                            />
                                        </div>

                                    </div>

                                    {this.state.notiEmail ? <div>
                                        <div className={"wrap-card"}>

                                        </div>
                                        <div className={"notification-content"}>
                                            <List type="number">
                                                <List.Item>Choose your template and customize download link text for
                                                    Shopify
                                                    email notification</List.Item>
                                                <List.Item>Go to your Shopify store settings Notifications</List.Item>
                                                <List.Item>Copy code and insert it in your email
                                                    notification</List.Item>
                                            </List>
                                            <div className={"noti-support"}>
                                                <span>
                                                    Need more help? Chat with our support team or contact us at <a
                                                    href="mailto:support@hapoapps.com"
                                                    target="_blank"
                                                    style={{textDecoration: "none"}}>support@hapoapps.com</a>
                                                </span>
                                            </div>
                                        </div>
                                    </div> : null}

                                </Card>
                                <Card sectioned>
                                    <div className={"setting-element"} id={"notify_email"}>
                                        <Select
                                            label="Default PDF template for email notification"
                                            options={this.get_template_option()}
                                            onChange={(e) => this.handleSelectDefaultTemplateEmail(e)}
                                            value={this.state.info.email_notify_template}
                                        />
                                    </div>

                                    <div className={"setting-element"}>
                                        <TextField
                                            label="Download text"
                                            value={this.state.info.download_link_text}
                                            onChange={(e) => this.handleDownloadText(e)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className={"setting-element"}>
                                        <TextField
                                            id={"setting_variables"}
                                            label="Copy code"
                                            value={this.state.valueCopyCode}
                                            onChange={(e) => this.handleCopyCode(e)}
                                            autoComplete="off"
                                            labelAction={{
                                                content: "Copy to clipboard", onAction: () => {
                                                    // navigator.clipboard.writeText(this.state.valueCopyCode)
                                                    var copyText = document.getElementById("setting_variables");
                                                    copyText.select();
                                                    copyText.setSelectionRange(0, 99999);
                                                    navigator.permissions.query({name:'clipboard-write'}).then(function(result) {
                                                        document.execCommand("copy");
                                                    });
                                                    this.toggleActive()
                                                }
                                            }}
                                        />
                                        <div style={{height: '0px', display: "none"}}>
                                            <Frame>
                                                {toastMarkup}
                                            </Frame>
                                        </div>

                                    </div>
                                </Card>


                            </Layout.Section>

                        </Layout>
                        <div className={"wrap-pages"}/>

                        <Layout>
                            <Layout.Section secondary>
                                <TextContainer>
                                    <Heading>Custom invoice number</Heading>
                                    <p>
                                        To show custom invoice numbering for paid orders, please insert “Custom Invoice Number” variable on your invoice template.
                                    </p>
                                    {/*<p>Learn more about <a href="" target="_blank">Custom Invoice Number</a></p>*/}
                                </TextContainer>
                            </Layout.Section>
                            <Layout.Section>
                                <Card sectioned>
                                    <div className={"setting-element"}>
                                        <TextField
                                            label={"First Invoice Number"}
                                            autoComplete={"off"}
                                            value={this.state.info.invoice_start_number}
                                            onChange={(e) => this.handleInvoiceNumber(e)}
                                        />
                                        <div className={"help-text"}>
                                            <p>Leave blank to disable custom invoice numbering for paid orders</p>
                                        </div>
                                    </div>
                                </Card>
                            </Layout.Section>
                        </Layout>
                    </Page>
                </div>

            </div>
        )
    }
}

export default Settings;
