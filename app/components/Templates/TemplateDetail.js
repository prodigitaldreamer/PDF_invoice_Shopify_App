import React, {useCallback, useState, Component} from "react";
import "./templates_detail.css";
import {
    Page,
    Button,
    Card,
    OptionList,
    Icon,
    Modal,
    Autocomplete,
    Stack,
    Collapsible, Toast, Frame, TextField, TextContainer

} from "@shopify/polaris";
import {SettingsMajor, TextMajor, ImportMinor, SearchMinor} from '@shopify/polaris-icons';
import {} from '@shopify/polaris-icons';
import PDFViewer from "./PDFViewer";
import axios from "axios";
import EmailEditor from "react-email-editor";
import {data} from "./DataVariable";
import $ from "jquery";

const config = window.config

class TemplateDetail extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        info: config,
        selected: [],
        filePDF: config.template_info.embed,
        activeModalLeave: false,
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
        openVariables: false,
        selectedVariable: [],
        valueVariable: "",
        optionsVariables: data,
        optionFilter: data,
        isChange: false
    }

    backPrevious() {
        if (this.state.isChange == true) {
            this.state.activeModalLeave = true;
            this.setState(this.state);
        } else {
            window.location.replace(window.location.origin + "/pdf/templates?shop=" + config.info.shop);
        }
    }

    render_menu() {
        const setSelected = (item) => {
            this.state.selected = item
            this.setState(this.state)
        }
        return (
            <OptionList
                title="Configuration"
                onChange={e => setSelected(e)}
                id={"configuration"}
                options={[
                    {
                        media: <Icon source={SettingsMajor}/>,
                        value: 'general',
                        label: 'General',
                    },
                    {
                        media: <Icon source={TextMajor}/>,
                        value: 'format',
                        label: 'Format'
                    }, {
                        media: <Icon source={ImportMinor}/>,
                        value: 'design',
                        label: 'Import design',

                    },
                ]}
                selected={this.state.selected}
            />
        )
    }

    reloadPDF(pdf) {
        this.state.filePDF = ""
        this.setState(this.state)
        this.state.filePDF = pdf
        this.setState(this.state)
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
        console.log('detail')
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

    handleChangeModalLeave() {
        this.state.activeModalLeave = !this.state.activeModalLeave;
        this.setState(this.state)
    }

    onSaveTemplate(action, data, pdf, message, showToast = true,) {
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
                        window.location.pathname = `/pdf/templates/${res.data.result.record}/edit`
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
    };

    resetAutocomplete() {
        this.state.valueVariable = ""
        this.state.openVariables = false
        this.setState(this.state)
    }

    handleOpenVariables() {
        this.state.openVariables = !this.state.openVariables
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
        this.setState(this.state);
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

    toggleActive(value) {
        this.state.toast = !this.state.toast;
        this.setState(this.state);
    }

    render() {
        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;
        let layout;
        const wrapper = <div className={"title-wrapper"}>
            <span className={"page-previous"} onClick={() => this.backPrevious()}>Templates</span><span> / </span><span
            className={"template-name"}>{this.state.info.template_info.name ? this.state.info.template_info.name : "New"}</span>
        </div>


        const tabs = this.state.selected
        if (tabs == 'general')
            window.location.pathname = `/pdf/templates/${this.state.info.template_info.id ? this.state.info.template_info.id : 0}/general/` + config.info.shop
        else if (tabs == 'format')
            window.location.pathname = `/pdf/templates/${this.state.info.template_info.id ? this.state.info.template_info.id : 0}/format/` + config.info.shop
        else if (tabs == 'design')
            window.location.pathname = `/pdf/templates/${this.state.info.template_info.id ? this.state.info.template_info.id : 0}/design/` + config.info.shop
        else
            return (
                <div>
                    <div className={"template-header"}>
                        {this.open_template_editor()}
                        <Page
                            title={wrapper}
                            primaryAction={{
                                content: 'Save',
                                loading: this.state.loading,
                                onAction: () => {
                                    this.onSaveTemplate("/pdf/template/update/edit", {info: this.state.info.template_info}, config.template_info.embed, "Save successfully");
                                }
                            }}
                            secondaryActions={<Button onClick={() => this.handleChange()}>Open editor</Button>}
                        />
                    </div>

                    <div className={"template-detail-content"}>
                        <div className={"template-detail-menu"}>
                            <Page>
                                <Card>
                                    <div style={{height: '0px', display: "none"}}>
                                        <Frame>
                                            {toastMarkup}
                                        </Frame>
                                    </div>
                                    {
                                        this.render_menu()
                                    }
                                </Card>
                            </Page>
                        </div>
                        <div className={"template-detail-frame"}>
                            {
                                <PDFViewer filePDF={this.state.filePDF}/>
                            }
                        </div>
                    </div>
                </div>
            )
    }
};

export default TemplateDetail;