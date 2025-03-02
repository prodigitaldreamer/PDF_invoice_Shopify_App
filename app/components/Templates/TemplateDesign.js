import React, {Component} from "react";
import "./template_design.css";
import {
    Page,
    Button,
    Card,
    Icon,
    TextField,
    Select,
    Modal,
    Toast,
    Frame,
    Layout,
    TextContainer,
    Collapsible,
    Stack,
    Autocomplete
} from "@shopify/polaris";
import {SearchMinor, MobileChevronMajor} from '@shopify/polaris-icons';

import PDFViewer from "./PDFViewer";
import EmailEditor from "react-email-editor";
import axios from "axios";
import {data} from "./DataVariable.js"

const config = window.config

class TemplateDesign extends Component {
    constructor(props) {
        super(props);
    }
    state = {
        info: config,
        name: config.template_info.name,
        selectedTemplate: "",
        filePDF: config.template_info.embed,
        templateDefault: null,
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
        import_loading: false,
        activeModalLibrary: false,
        reset_loading: false,
        activeModalLeave: false,
        backPrevious: null,
        openVariables: false,
        selectedVariable: [],
        valueVariable: "",
        optionsVariables: data,
        optionFilter: data,
        isChange: false,
    }


    handleSelectChange(value) {
        this.state.selectedTemplate = value
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

    get_template_option() {
        let email_option = [{label: "Please select a template", value: ""}];
        config.templates.forEach((e) => {
            email_option.push({label: e.label, value: e.value.toString()})
        });
        return email_option
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


    toggleActive(value) {
        this.state.toast = !this.state.toast;
        this.setState(this.state);
    }

    exportHtml(e) {
        this.state.emailEditorRef = e

    };

    onLoad() {
        console.log('design')
        this.state.loadingDesign = true
        this.setState(this.state)

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

    }

    onSave() {
        this.state.emailEditorRef.saveDesign((data) => {
            console.log(data)
            this.state.info.template_info.json = JSON.stringify(data)
        })
        this.state.emailEditorRef.exportHtml((data) => {
            const {design, html} = data;
            this.state.info.template_info.html = html;
        });
        // console.log(this.state.emailEditorRef)
        this.state.activeModal = false

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
                        window.location.pathname = `/pdf/templates/${res.data.result.record}/design`
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

    _save_data(data) {
        console.log(data)
        this.state.info.template_info.html = data.template_info.html
        this.state.info.template_info.json = data.template_info.json
        this.state.info.template_info.page_size = data.template_info.page_size
        this.state.info.template_info.orientation = data.template_info.orientation
        this.state.info.template_info.font_size = data.template_info.font_size
        this.state.info.template_info.font_family = data.template_info.font_family
        this.state.info.template_info.top_margin = data.template_info.top_margin
        this.state.info.template_info.bottom_margin = data.template_info.bottom_margin
        this.state.info.template_info.left_margin = data.template_info.left_margin
        this.state.info.template_info.right_margin = data.template_info.right_margin
        this.state.info.template_info.date_format = data.template_info.date_format
        this.state.info.template_info.embed = data.template_info.embed
        this.state.info.template_info.embed_clipboard = data.template_info.embed_clipboard
    }

    import_templates() {
        axios.post(`/pdf/templates/info/${this.state.selectedTemplate}`, {}, {
            onUploadProgress: () => {
                this.setState({loading: true, active: false})
            }
        }).then((res) => {
            const data = res.data.result
            this._save_data(data)
            this.state.isChange = true
            this.state.loading = false,
            this.state.toast = true,
            this.state.message = 'Imported!',
            this.state.active = true
            this.setState(this.state)
            this.reloadPDF(res.data.result.template_info.embed)
        }).catch((reason) => {
            this.setState({
                loading: false,
                toast: true,
                message: 'Something went wrong.Please try again!',
                active: true
            })
        })
    }

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
        </div>)
    }

    load_template(html, json) {
        this.state.info.template_info.html = html;
        this.state.info.template_info.json = JSON.stringify(json);
        this.state.activeModalLibrary = false;
        this.state.isChange = true
        this.setState(this.state);
        setTimeout(() => {
            this.onSaveTemplate("/pdf/template/update/clipboard", {info: this.state.info.template_info}, this.state.info.template_info.embed_clipboard, null, false)
        }, 200)
    }

    render_default_template_library() {
        let template = [];
        if (this.state.templateDefault)
            this.state.templateDefault.map((item) => {
                template.push(<div className="col-md-4">
                    <div className="default-content"><a href="#">
                        <div className="default-content-overlay"></div>
                        <img className="default-content-image"
                             src={'data:image/gif;base64,' + item.thumbnail}/>
                        <div className="default-content-details af-fadeIn-bottom">
                            <Button primary loading={this.state.reset_loading}
                                    onClick={() => {
                                        this.load_template(item.html, item.json)
                                    }}
                            >Choose Template</Button>
                        </div>
                    </a>
                        <h5 className="default-content-title">{item.name}</h5>
                    </div>


                </div>)
            })
        return template;
    }


    handleOpenLibrary() {
        console.log('handleOpenLibrary');
        this.state.activeModalLibrary = !this.state.activeModalLibrary
        if (this.state.activeModalLibrary)
            axios.post('/pdf/templateDefault', {}, {
                onUploadProgress: () => {
                    this.state.reset_loading = true;
                }
            }).then((res) => {
                const templates = res.data.result.templates;
                this.state.templateDefault = templates;
                this.state.reset_loading = false;
                this.setState(this.state);
                console.log('handleOpenLibrary ok');

            }).catch(() => {
                this.state.message = "Something went wrong.Please try again!";
                this.state.toast = true;
            });
        this.setState(this.state);
    }

    open_template_library() {
        return (<div style={{display: "none"}}>
            <div className={"modal-leave"}>
                <Modal
                    open={this.state.activeModalLeave}
                    onClose={() => this.handleChangeModalLeave()}
                    title="Your changes have not been saved"
                    primaryAction={{
                        content: 'Leave page',
                        destructive: true,
                        onAction: () => {
                            this.state.isChange = false
                            this.backPrevious(this.state.backPrevious)
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
            </div>


            <Modal
                open={this.state.activeModalLibrary}
                onClose={() => this.handleOpenLibrary()}
                title="Template Editor"
                loading={this.state.reset_loading}
                secondaryActions={[{
                    content: 'Cancel', onAction: () => this.handleOpenLibrary(),
                },]}
            >
                <Modal.Section>
                    <Layout>
                        <Layout.Section oneThird>
                            <div className="af-container">
                                <div className="row">
                                    {
                                        this.render_default_template_library()
                                    }
                                </div>
                            </div>
                        </Layout.Section>
                    </Layout>
                </Modal.Section>
            </Modal>
        </div>)
    }

    render_menu() {
        var url_back;
        if (typeof this.state.info.template_info.id != 'undefined') {
            url_back = `/pdf/templates/${this.state.info.template_info.id}/edit`
        } else {
            url_back = `/pdf/templates/0/edit`;
        }
        const titleOption = (
            <span className={"title-option"}>
            <span onClick={() => this.backPrevious(url_back)}
                  className={"icon-option"}>
                <Icon source={MobileChevronMajor}/>
            </span>
            <span className={"title-title"}>Import design</span>
        </span>

        )
        return (
            <Page>
                <Card title={titleOption}>
                    {this.open_template_library()}
                    {this.open_template_editor()}
                    <div className={"input-general"}>
                        <Select
                            label="Import design from another template"
                            options={this.get_template_option()}
                            onChange={value => this.handleSelectChange(value)}
                            value={this.state.selectedTemplate}
                        />
                    </div>
                    <div className={"input-general"}>
                        <div className={"design-button"}>
                            <div className={"button-import"}>
                                <Button primary onClick={() => {
                                    if (this.state.selectedTemplate != '') {
                                        this.import_templates()
                                    }
                                }} loading={this.state.import_loading}>
                                    Import
                                </Button>
                            </div>
                            <div className={"button-library"}>
                                <Button onClick={() => this.handleOpenLibrary()}>
                                    Open template library
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </Page>
        )
    }

    handleChangeModalLeave() {
        this.state.activeModalLeave = !this.state.activeModalLeave;
        this.setState(this.state)
    }

    render() {
        console.log(this.state)
        const wrapper = (
            <div className={"title-wrapper"}>
                <span className={"page-previous"} onClick={() => this.backPrevious(`/pdf/templates`)}>Templates</span>
                <span> / </span>
                <span className={"template-name"}
                      onClick={() => this.backPrevious(`/pdf/templates/${this.state.info.template_info.id ? this.state.info.template_info.id : 0}/edit`)}>{this.state.name ? this.state.name : "New"}</span>
                <span> / </span>
                <span className={"template-name"}>Design</span>
            </div>
        )
        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;
        return (
            <div>
                <div className={"template-header"}>
                    <Page
                        title={wrapper}
                        primaryAction={{
                            content: 'Save',
                            loading: this.state.loading,
                            onAction: () => {
                                this.onSaveTemplate("/pdf/template/update/edit", {info: this.state.info.template_info}, this.state.info.template_info.embed, "Save successfully");
                            }
                        }}
                        secondaryActions={<Button onClick={() => this.handleChange()}>Open editor</Button>}
                    />
                </div>

                <div className={"template-detail-content"}>
                    <div className={"template-detail-menu"}>
                        <div style={{height: '0px', display: "none"}}>
                            <Frame>
                                {toastMarkup}
                            </Frame>
                        </div>
                        {
                            this.render_menu()
                        }
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

export default TemplateDesign;