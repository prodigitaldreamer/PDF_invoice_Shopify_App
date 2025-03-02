import React, {Component} from "react";
import "./template_general.css";
import {
    Page,
    Button,
    Card,
    Icon,
    TextField,
    Select,
    Checkbox,
    Modal,
    TextContainer,
    Toast,
    Frame,
    Autocomplete,
    Stack,
    Collapsible
} from "@shopify/polaris";
import {MobileChevronMajor, SearchMinor} from '@shopify/polaris-icons';
// Import PDF
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import PDFViewer from "./PDFViewer";
import EmailEditor from 'react-email-editor';
import axios from "axios";
import {data} from "./DataVariable";

const config = window.config

class TemplateGeneral extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        info: config,
        selectedTemplate: "Invoice",
        checkedDefault: false,
        optionsTemplate: [
            // {label: "Orders", value: 'order'},
            {label: "Invoice", value: 'invoice'},
            {label: "Packing", value: 'packing'},
            {label: "Refund", value: 'refund'}
        ],
        filePDF: config.template_info.embed,
        activeModal: false,
        emailEditorRef: null,
        htmlExport: null,
        jsonData: null,
        isReady: false,
        loading: false,
        loadingDesign: false,
        toast: false,
        message: null,
        active: false,
        backPrevious: null,
        activeModalLeave: false,
        openVariables: false,
        selectedVariable: [],
        valueVariable: "",
        optionsVariables: data,
        optionFilter: data,
        copyVariable: "",
        isChange: false,
    }
    handleChangeSelected(list) {
        this.state.info.template_info.type = list
        this.state.isChange = true
        this.setState(this.state)
    }

    handleSetDefault(value) {
        this.state.info.template_info.default = value
        this.state.isChange = true
        this.setState(this.state)
    }

    handleSetTemplateName(value) {
        this.state.info.template_info.name = value
        this.state.isChange = true
        this.setState(this.state)
    }

    backPrevious(pathName) {
        this.state.backPrevious = pathName
        if (pathName == "/pdf/templates" && this.state.isChange == true) {
            this.state.activeModalLeave = true;
            this.setState(this.state)
        } else if (pathName == "/pdf/templates") {
            window.location.replace(window.location.origin + "/pdf/templates?shop=" + config.info.shop);
        } else {
            this.onSaveTemplateDraft("/pdf/template/update/edit", {info: this.state.info.template_info});
        }
    }

    handleChange() {
        this.state.activeModal = !this.state.activeModal
        this.state.isReady = false;
        this.resetAutocomplete()
        this.setState(this.state)
    }

    exportHtml(e) {
        this.state.emailEditorRef = e

    };

    onLoad() {
        this.state.loadingDesign = true
        this.setState(this.state)
        try {
            if (this.state.isReady) {
                if (this.state.info.template_info.json !== '' && typeof this.state.info.template_info.json !== 'undefined') {
                    this.state.emailEditorRef.loadDesign(JSON.parse(this.state.info.template_info.json));
                }
                this.state.loadingDesign = false
                this.setState(this.state)

            } else {
                setTimeout(() => {
                    this.onLoad()
                }, 500)
            }
        } catch (e) {
            axios.post("/pdf/get/template", {id: this.state.info.template_info.id}).then((res) => {
                this.state.emailEditorRef.loadDesign(JSON.parse(res.data.result.data.json));
                this.state.loadingDesign = false
                this.setState(this.state)
            })
        }
    }

    onSave() {
        this.state.emailEditorRef.saveDesign((data) => {
            this.state.info.template_info.json = JSON.stringify(data)
        })
        this.state.emailEditorRef.exportHtml((data) => {
            const {design, html} = data;
            this.state.info.template_info.html = html;
        });
        this.state.activeModal = false
        this.state.isChange = true

        this.setState(this.state)
        setTimeout(() => {
            if (this.state.info.template_info.embed == "/pdf/invoice/0/preview/load") {
                this.onSaveTemplate("/pdf/template/update/clipboard", {info: this.state.info.template_info}, config.template_info.embed_clipboard, null, false)
            } else {
                this.onSaveTemplate("/pdf/template/update/edit", {info: this.state.info.template_info}, config.template_info.embed, "Save successfully");
            }
        }, 200)

    }


    onReady(e) {
        this.state.isReady = true;
        this.setState(this.state);
    };

    handleOpenVariables() {
        this.state.openVariables = !this.state.openVariables
        this.setState(this.state)
    }

    resetAutocomplete() {
        this.state.valueVariable = ""
        this.state.openVariables = false
        this.setState(this.state)
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
        this.setState(this.state)
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

    search_variables() {
        const textField = <Autocomplete.TextField
            onChange={e => this.updateValueVariable(e)}
            value={this.state.valueVariable}
            prefix={<Icon source={SearchMinor} color="base"/>}
            placeholder="Search and click on variable to copy"
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

    open_template_editor() {
        const titleModal = <div>
            <div className={"copy-variables"}>


                Template Editor <Stack>
                <Button onClick={() => this.handleOpenVariables()}
                        ariaControls="copy-variables"> {this.state.openVariables ? "Hide variables" : "Search variables"} </Button>


            </Stack>
            </div>
            <Collapsible
                id={"copy-variables"} open={this.state.openVariables}
            >
                {this.search_variables()}
            </Collapsible></div>

        return (<div style={{display: "none"}}>
            <Modal
                open={this.state.activeModal}
                onClose={() => this.handleChange()}
                shouldCloseOnOverlayClick={false}
                title={titleModal}
                primaryAction={{
                    content: 'Save design', loading: this.state.loadingDesign, onAction: () => this.onSave(),
                }}
                secondaryActions={[{
                    content: 'Discard', onAction: () => this.handleChange(),
                },]}
            >
                <Modal.Section>
                    <EmailEditor
                        ref={(e) => this.exportHtml(e)}
                        onLoad={(e) => this.onLoad(e)}
                        onReady={() => this.onReady()}
                        minHeight={"90%"}
                    />
                </Modal.Section>
            </Modal>

            <Modal
                open={this.state.activeModalLeave}
                onClose={() => this.handleChangeModalLeave()}
                title="Your changes have not been saved"
                primaryAction={{
                    content: 'Leave page',
                    destructive: true,
                    onAction: () => {
                        this.state.isChange = false
                        window.location.pathname = "/pdf/templates";
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

    reloadPDF(pdf) {
        this.state.filePDF = ""
        this.setState(this.state)
        this.state.filePDF = pdf
        this.setState(this.state)
    }

    onSaveTemplate(action, data, pdf, message, showToast = true) {
        axios.post(action, {
            data
        }, {
            onUploadProgress: () => {
                this.setState({loading: true, active: false})
            }
        }).then((res) => {
            setTimeout(() => {
                if (res.data.result) {
                    this.reloadPDF(pdf)
                    this.setState({loading: false, toast: showToast, message: message, active: true})
                    this.state.isChange = false
                    if (!this.state.info.template_info.id) {
                        window.location.pathname = `/pdf/templates/${res.data.result.record}/general`
                    }
                } else {
                    this.setState({
                        loading: false,
                        toast: showToast,
                        message: 'Something went wrong.Please try again!',
                        active: true
                    })
                }

            }, 1500)
        }).catch(() => {
            this.setState({
                loading: false,
                toast: showToast,
                message: 'Something went wrong.Please try again!',
                active: true
            })
        })
    }

    onSaveTemplateDraft(action, data) {
        axios.post(action, {
            data
        }).then((res) => {
            if (res.data.result) {
                window.location.pathname = `/pdf/templates/${res.data.result.record}/edit`
            } else {
                window.location.pathname = `/pdf/templates`
            }
        })
    }

    toggleActive(value) {
        this.state.toast = !this.state.toast;
        this.setState(this.state);
    }

    render_menu = () => {
        var url_back;
        if (typeof this.state.info.template_info.id != 'undefined') {
            url_back = `/pdf/templates/${this.state.info.template_info.id}/edit`
        } else {
            url_back = `/pdf/templates/0/edit`;
        }
        const titleOption = (<span className={"title-option"}>
            <span onClick={() => this.backPrevious(url_back)}
                  className={"icon-option"}>
                <Icon source={MobileChevronMajor}/>
            </span>
            <span className={"title-title"}>General</span>
        </span>)

        return (<Page>
            {this.open_template_editor()}
            <Card title={titleOption}>
                <div className={"input-general"}>
                    <TextField
                        label="Template name"
                        autoComplete="off"
                        placeholder={"New Invoice Template"}
                        value={this.state.info.template_info.name}
                        onChange={value => this.handleSetTemplateName(value)}
                    />
                </div>
                <div className={"input-general"}>
                    <Select
                        label="Type"
                        options={this.state.optionsTemplate}
                        onChange={list => this.handleChangeSelected(list)}
                        value={this.state.info.template_info.type}
                    />
                </div>
                <div className={"input-general"}>
                    <Checkbox
                        label="Use this template as default"
                        checked={this.state.info.template_info.default}
                        onChange={value => this.handleSetDefault(value)}
                        helpText={"Default template will be used for previewing and printing PDF Invoice on Shopify admin order page"}
                    />
                </div>
            </Card>
        </Page>)
    }

    render() {
        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;
        const wrapper = (<div className={"title-wrapper"}>
            <span className={"page-previous"} onClick={() => this.backPrevious(`/pdf/templates`)}>Templates</span>
            <span> / </span>
            <span className={"template-name"}
                  onClick={() => this.backPrevious(`/pdf/templates/${this.state.info.template_info.id ? this.state.info.template_info.id : 0}/edit`)}>{this.state.info.template_info.name ? this.state.info.template_info.name : "New"}</span>
            <span> / </span>
            <span className={"template-name"}>General</span>
        </div>)


        return (<div>
            <div className={"template-header"}>
                <Page
                    title={wrapper}
                    primaryAction={{
                        content: 'Save',
                        loading: this.state.loading,
                        disabled: !this.state.isChange,
                        onAction: () => {
                            this.onSaveTemplate("/pdf/template/update/edit", {info: this.state.info.template_info}, config.template_info.embed, "Save successfully");
                        }
                    }}
                    secondaryActions={<Button onClick={() => this.handleChange()}>Open editor</Button>}
                />
            </div>

            <div className={"template-detail-content"}>
                <div className={"template-detail-menu"}>
                    {this.render_menu()}
                    <div style={{height: '0px', display: "none"}}>
                        <Frame>
                            {toastMarkup}
                        </Frame>
                    </div>
                </div>
                <div className={"template-detail-frame"}>
                    <PDFViewer filePDF={this.state.filePDF}/>
                </div>

            </div>

        </div>)
    }


};

export default TemplateGeneral;