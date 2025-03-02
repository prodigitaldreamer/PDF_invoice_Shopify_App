import React, {Component} from "react";
import {
    AppProvider, Autocomplete, Button,
    Card, Checkbox, Collapsible, Frame, Icon, Modal,
    Page, SettingToggle, Stack, Text, TextField, TextStyle, Toast, Tag,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import "./email_automation_setting.css";
import axios from "axios";
import EmailEditor from "react-email-editor";
import {SearchMinor, CancelSmallMinor} from "@shopify/polaris-icons";
import {data} from "../Templates/DataVariable";


const config = window.config

class EmailAutomation extends Component {
    constructor(props) {
        super(props)
        this.setDefaultData();
    }

    state = {
        config: config,
        loading: false,
        loadingTest: false,
        toast: false,
        message: "",
        active: false,
        activeModalVariable: false,
        selectedVariable: [],
        valueVariable: "",
        optionsVariables: data,
        optionFilter: data,
        isChange: false,
        selectedTags: [],
        textFieldTag: "",
    }

    handleChangeEnableEmail(value) {
        this.state.config.email_info.enable_email_automation = value
        this.setState(this.state)
    }

    handleChangeReplyTo(value) {
        this.state.config.email_info.email_reply_to = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    handleChangeBCC(value) {
        this.state.config.email_info.bcc_to = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    handleChangeTestEmail(value) {
        this.state.config.email_info.test_email = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    handleChangeRule(value) {
        this.state.textFieldTag = value
        this.setState(this.state)
    }

    handleKeyPress = (event) => {
        const enterKeyPressed = event.keyCode === 13;
        if (enterKeyPressed) {
            event.preventDefault();
            var enter_tag = document.getElementById("enter_tag");
            if (enter_tag.value !== "") {
                this.state.selectedTags.push(enter_tag.value);
                this.setState(this.state);
                this.state.config.email_info.email_tags = this.state.selectedTags.toString();
                this.state.isChange = true;
                this.state.textFieldTag = "";
                this.setState(this.state);
            }
        }
    }

    handleChangeSendWhen(value) {
        this.state.config.email_info.send_email_when = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    handleChangeSubject(value) {
        this.state.config.email_info.email_subject = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    handleChangeEmailMessage(value) {
        this.state.config.email_info.custom_email_message = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    handleChangeFileName(value) {
        this.state.config.email_info.email_file_name = value
        this.state.isChange = true;
        this.setState(this.state)
    }

    setDefaultData() {
        if (config.email_info.type == "refund" && config.email_info.email_file_name == "{{order_name}}") {
            this.state.config.email_info.email_file_name = "{{refund_name}}"
            this.state.config.email_info.email_subject = "Refund for {{order_name}}"
            this.state.config.email_info.custom_email_message = "Here is the refund details for your order"
        }
        if (config.email_info.type == "packing" && config.email_info.email_file_name == "{{order_name}}") {
            this.state.config.email_info.email_file_name = "{{shipment_name}}"
            this.state.config.email_info.email_subject = "Your order is being fulfilled"
            this.state.config.email_info.custom_email_message = "Thank you for purchasing! Please see the attachment below for shipment details."
        }
        if (this.state.config.email_info.email_tags !== false) {
            if (this.state.config.email_info.email_tags.split(",") == "") {
                this.state.selectedTags = [];
            } else {
                this.state.selectedTags = this.state.config.email_info.email_tags.split(",")
            }
        }
        this.setState(this.state)
    }

    onActionEmail(action, data, message, loadingSave = false, loadingTest = false) {
        axios.post(action, {
            data
        }, {
            onUploadProgress: () => {
                this.setState({loading: loadingSave, active: false, loadingTest: loadingTest})
            }
        }).then((res) => {
            setTimeout(() => {
                if (res.data.result.status) {
                    this.setState({loading: false, loadingTest: false, toast: true, message: message, active: true})
                } else {
                    if (res.data.result.message) {
                        this.setState({
                            loading: false,
                            loadingTest: false,
                            toast: true,
                            message: res.data.result.message,
                            active: true
                        })
                    } else {
                        this.setState({
                            loading: false,
                            loadingTest: false,
                            toast: true,
                            message: 'Something went wrong.Please try again!',
                            active: true
                        })
                    }
                }
            }, 1500)
        }).catch(() => {
            this.setState({
                loading: false,
                toast: true,
                loadingTest: false,
                message: 'Something went wrong.Please try again!',
                active: true
            })
        })
    };

    backPrevious() {
        return window.location.replace(window.location.origin + "/pdf/emailautomation");
    }

    capitalize(s) {
        return s[0].toUpperCase() + s.slice(1);
    }

    toggleActive(value) {
        this.state.toast = !this.state.toast;
        this.setState(this.state);
    }

    async handleChange() {
        this.state.activeModal = !this.state.activeModal
        await this.setState(this.state)
        await document.getElementById('search_variables').focus();
    }

    updateValueVariable(e) {
        this.state.valueVariable = e;
        this.setState(this.state)
        if (e == "") {
            this.state.optionFilter = this.state.optionsVariables;
            this.setState(this.state);
            return;
        }
        const filterRegex = new RegExp(e, 'i');
        const resultOptions = [];

        this.state.optionsVariables.forEach((opt) => {
            let lol = [];
            opt.options.forEach((item) => {

                if (item.string.match(filterRegex) != null) {

                    lol.push(item)
                }
            })

            resultOptions.push({
                title: opt.title,
                options: lol,
            });
        });

        this.state.optionFilter = resultOptions;
        this.setState(this.state);
    }

    async handleSelectedVariable(e) {
        this.state.copyVariable = e[0];
        this.setState(this.state)
        var copyText = document.getElementById("hapo_variables");
        await copyText.select();
        await copyText.setSelectionRange(0, 99999);
        await navigator.permissions.query({name:'clipboard-write'}).then(function(result) {
            document.execCommand("copy");
        });
        document.getElementById("hapo_variables").blur();
        this.state.toast = true;
        this.state.message = "Copied!"
        this.setState(this.state);
    }

    search_variables() {
        const textField = <Autocomplete.TextField
            onChange={e => this.updateValueVariable(e)}
            value={this.state.valueVariable}
            prefix={<Icon source={SearchMinor} color="base"/>}
            placeholder="Search by variable name"
            id={"search_variables"}
        />
        return (
            <div>
                <div style={{paddingTop: "10px"}}>
                    <TextField
                        id={"hapo_variables"}
                        value={this.state.copyVariable}
                    />
                    <Autocomplete
                        options={this.state.optionFilter}
                        selected={this.state.selectedVariable}
                        onSelect={e => this.handleSelectedVariable(e)}
                        textField={textField}
                    />
                </div>
            </div>

        )
    }

    open_search_variable() {

        return (<div style={{display: "none"}}>
            <Modal
                open={this.state.activeModal}
                onClose={() => this.handleChange()}
                title={"Click on a variable to copy"}
            >
                <Modal.Section>
                    {
                        this.search_variables()
                    }
                </Modal.Section>
            </Modal>
        </div>)
    }

    removeTag(option) {
        this.state.selectedTags = this.state.selectedTags.filter(function(item) {
            return item !== option
        })
        this.setState(this.state)
        this.state.config.email_info.email_tags = this.state.selectedTags.toString();
        this.state.isChange = true;
        this.setState(this.state);
    }

    handleChangeSettingToggle() {
        this.state.config.email_info.enable_email_automation = !this.state.config.email_info.enable_email_automation;
        this.state.isChange = true;
        this.setState(this.state)
    }

    render() {
        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;

        const wrapper = <div className={"title-wrapper"}>
            <span className={"page-previous"} onClick={this.backPrevious}>Email automation</span><span> / </span><span
            className={"template-name"}>{this.capitalize(this.state.config.email_info.type)}</span>
        </div>

        const contentStatus = this.state.config.email_info.enable_email_automation ? 'Disable' : 'Enable';
        const textStatus = this.state.config.email_info.enable_email_automation ? 'Enable' : 'Disable';

        const tagMarkup = this.state.selectedTags.map((option) => (
            <Tag onClick={() => this.removeTag(option)} key={option}>
                {option}<Icon source={CancelSmallMinor} color="base"/>
            </Tag>
        ));
        return (
            <div>
                <div className={"email-header-setting"}>
                    {this.open_search_variable()}
                    <Page
                        title={wrapper}

                        primaryAction={{
                            content: 'Save',
                            loading: this.state.loading,
                            disabled: !this.state.isChange,
                            onAction: () => {
                                this.onActionEmail('/pdf/emailautomation/save', this.state.config.email_info, "Save successfully", true, false)
                            }
                        }}
                        secondaryActions={<Button loading={this.state.loadingTest} onClick={() => {
                            this.onActionEmail('/pdf/emailautomation/test', this.state.config.email_info, "Send successfully", false, true)

                        }}>Send test email</Button>}
                    />
                    <div style={{height: '0px', display: "none"}}>
                        <Frame>
                            {toastMarkup}
                        </Frame>
                    </div>
                </div>
                <div className={"setting-email-main"}>

                    <Card>
                        <div className={"setting-card-padding"}>
                            <Text variant="headingMd" as="h6">
                                General configuration
                            </Text>
                            <div className={"setting-element"}>
                                <SettingToggle
                                    action={{
                                        content: contentStatus,
                                        onAction: () => this.handleChangeSettingToggle(),
                                    }}
                                    enabled={this.state.config.email_info.enable_email_automation}
                                >
                                    Email automation is <TextStyle variation="strong">{textStatus}</TextStyle>.
                                </SettingToggle>
                            </div>
                            <div className={"setting-element"}>
                                <TextField
                                    label="Send email when"
                                    value={this.state.config.email_info.send_email_when ? this.state.config.email_info.send_email_when : ""}
                                    // onChange={(e) => this.handleChangeSendWhen(e)}
                                    // autoComplete="off"
                                    // placeholder={"Send reply to"}
                                    disabled={true}
                                />
                            </div>
                            <div>

                            </div>
                            <div className={"setting-element"}>
                                <Text variant="headingSm" as="h6">
                                    EMAIL ADDRESS
                                </Text>
                            </div>
                            <div className={"setting-element"}>
                                <TextField

                                    label="Send reply to"
                                    value={this.state.config.email_info.email_reply_to ? this.state.config.email_info.email_reply_to : ""}
                                    onChange={(e) => this.handleChangeReplyTo(e)}
                                    autoComplete="off"
                                    placeholder={"Send reply to"}
                                    helpText={"If not set, store email will be used as reply-to address"}
                                />
                            </div>
                            <div className={"setting-element"}>
                                <TextField
                                    label="BCC"
                                    value={this.state.config.email_info.bcc_to ? this.state.config.email_info.bcc_to : ""}
                                    onChange={(e) => this.handleChangeBCC(e)}
                                    autoComplete="off"
                                    placeholder={"BCC"}
                                />
                                <div className={"help-text"}>
                                    <p>Separated by commas (,)</p>
                                    <p>Maximum 5 email addresses</p>
                                    <p>A copy of the email will be sent to the above email addresses</p>
                                </div>
                            </div>
                            <div className={"setting-element"}>
                                <TextField
                                    label="Test email"
                                    value={this.state.config.email_info.test_email ? this.state.config.email_info.test_email : ""}
                                    onChange={(e) => this.handleChangeTestEmail(e)}
                                    autoComplete="off"
                                />
                            </div>

                        </div>
                    </Card>
                    <Card>

                        <div className={"setting-card-padding"}>
                            <Text variant="headingMd" as="h6">
                                Custom automation rule with order tags
                            </Text>
                            <div className={"setting-element"}>
                                <label style={{marginBottom: '15px'}}>
                                    Only send email for orders with order tags
                                </label>
                                <br/>
                                <Stack spacing="tight">{tagMarkup}</Stack>
                                <div onKeyDown={this.handleKeyPress}>
                                    <TextField
                                        value={this.state.textFieldTag ? this.state.textFieldTag : ""}
                                        onChange={(e) => this.handleChangeRule(e)}
                                        autoComplete="off"
                                        placeholder={""}
                                        helpText={'Press Enter to separate tags'}
                                        id={"enter_tag"}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card>

                        <div className={"setting-card-padding"}>
                            <Text variant="headingMd" as="h6">
                                Email format
                            </Text>
                            <div className={"setting-element"}>
                                <TextField
                                    label="File name format"
                                    value={this.state.config.email_info.email_file_name ? this.state.config.email_info.email_file_name : ""}
                                    onChange={(e) => this.handleChangeFileName(e)}
                                    autoComplete="off"
                                    placeholder={"{{order_name}} - Invoice"}
                                    maxLength={255}
                                    showCharacterCount
                                    labelAction={{
                                        content: 'Variables', onAction: () => {
                                            this.handleChange()
                                        }
                                    }}

                                />
                            </div>
                            <div className={"setting-element"}>
                                <TextField
                                    label="Subject"
                                    value={this.state.config.email_info.email_subject ? this.state.config.email_info.email_subject : ""}
                                    onChange={(e) => this.handleChangeSubject(e)}
                                    autoComplete="off"
                                    placeholder={"New invoice of your purchase at {{store_name}}"}
                                    maxLength={255}
                                    showCharacterCount
                                    labelAction={{
                                        content: 'Variables', onAction: () => {
                                            this.handleChange()
                                        }
                                    }}

                                />
                            </div>
                            <div className={"setting-element"}>
                                <TextField
                                    label="Email message"
                                    value={this.state.config.email_info.custom_email_message ? this.state.config.email_info.custom_email_message : ""}
                                    onChange={(e) => this.handleChangeEmailMessage(e)}
                                    autoComplete="off"
                                    placeholder={"Thank you for purchasing at {{store_name}}! This is your invoice."}
                                    maxLength={255}
                                    showCharacterCount
                                    multiline={4}
                                    labelAction={{
                                        content: 'Variables', onAction: () => {
                                            this.handleChange()
                                        }
                                    }}

                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        )

    }

}

export default EmailAutomation;