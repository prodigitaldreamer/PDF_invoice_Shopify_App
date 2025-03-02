import React, {Component} from "react";
import "./template_general.css";
import {
    Page,
    Button,
    Card,
    Icon,
    TextField,
    Select,
    Text,
    Toast,
    Frame,
    Modal,
    TextContainer,
    Autocomplete, Stack, Collapsible
} from "@shopify/polaris";
import {MobileChevronMajor, SearchMinor} from '@shopify/polaris-icons';
// Import PDF
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import PDFViewer from "./PDFViewer";
import axios from "axios";
import EmailEditor from "react-email-editor";
import {data} from "./DataVariable";

const config = window.config

class TemplateFormat extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        info: config,
        selectedOrientation: 'portrait',
        optionsPaperSize: [
            {label: 'A4', value: 'a4'},
            {label: 'A5', value: 'a5'},
            {label: 'A6', value: 'a6'},
            {label: 'Letter', value: 'Letter'},
            {label: 'Legal', value: 'Legal'}
        ],
        optionsOrientation: [
            {label: 'Portrait', value: 'portrait'},
            {label: 'Landscape', value: 'landscape'},
        ],
        optionsFont: [""].concat(config.custom_fonts),
        optionsDateFormat: [
            {label: '31/12/1999', value: '%d/%m/%Y'},
            {label: '12/31/1999', value: '%m/%d/%Y'},
            {label: '1999/12/31', value: '%Y/%m/%d'},
            {label: '31-12-1999', value: '%d-%m-%Y'},
            {label: '12-31-1999', value: '%m-%d-%Y'},
            {label: '1999-12-31', value: '%Y-%m-%d'},
            {label: '31.12.1999', value: '%d.%m.%Y'},
            {label: '12.31.1999', value: '%m.%d.%Y'},
            {label: '1999.12.31', value: '%Y.%m.%d'},
            {label: '31 Oct 1999', value: '%d %b %Y'},
            {label: 'Oct 31 1999', value: '%b %d %Y'},
            {label: '1999 Oct 31', value: '%Y %b %d'},
        ],
        filePDF: config.template_info.embed,
        activeModal: false,
        emailEditorRef: null,
        htmlExport: null,
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
        isChange: false,

    }
    //handle Select
    handleChange() {
        this.state.activeModal = !this.state.activeModal
        this.state.isReady = false;
        this.state.isChange = true
        this.resetAutocomplete()
        this.setState(this.state)
    }

    handleSelectOrientation(value) {
        this.state.info.template_info.orientation = value;
        this.state.isChange = true
        this.setState(this.state)
    }

    handleSelectPaperSize(value) {
        this.state.info.template_info.page_size = value;
        this.state.isChange = true
        this.setState(this.state)
    }

    handleSelectFont(value) {
        this.state.info.template_info.font_family = value;
        this.state.isChange = true
        this.setState(this.state)
    }

    handleSelectDateFormat(value) {
        this.state.info.template_info.date_format = value;
        this.state.isChange = true
        this.setState(this.state)
    }

    handleChangeTopMargin(value) {
        this.state.info.template_info.top_margin = value;
        this.state.isChange = true
        this.setState(this.state)
        document.getElementById("top_margin").focus();
    }

    handleChangeBottomMargin(value) {
        this.state.info.template_info.bottom_margin = value;
        this.state.isChange = true
        this.setState(this.state)
        document.getElementById("bottom_margin").focus();
    }

    handleChangeLeftMargin(value) {
        this.state.info.template_info.left_margin = value;
        this.state.isChange = true
        this.setState(this.state)
        document.getElementById("left_margin").focus();
    }

    handleChangeRightMargin(value) {
        this.state.info.template_info.right_margin = value;
        this.state.isChange = true
        this.setState(this.state)
        document.getElementById("right_margin").focus();
    }

    handleChangeFontSize(value) {
        this.state.info.template_info.font_size = value;
        this.state.isChange = true
        this.setState(this.state)
        document.getElementById("font_size").focus();
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

    reloadPDF(pdf) {
        this.state.filePDF = ""
        this.setState(this.state)
        this.state.filePDF = pdf
        this.setState(this.state)
    }

    onSaveTemplate(action, data, pdf, message, showToast = true, reloadPDF = true) {
        axios.post(action, {
            data
        }, {
            onUploadProgress: () => {
                this.setState({loading: true, active: false})
            }
        }).then((res) => {
            console.log(res)
            console.log(res.data.result)
            setTimeout(() => {
                if (res.data.result) {
                    if(reloadPDF == true) {
                        this.reloadPDF(pdf)
                    }
                    this.setState({loading: false, toast: showToast, message: message, active: true})
                    this.state.isChange = false
                    if (!this.state.info.template_info.id) {
                        window.location.pathname = `/pdf/templates/${res.data.result.record}/format`
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

    exportHtml(e) {
        this.state.emailEditorRef = e
    };

    onLoad() {
        console.log('format')
        this.state.loadingDesign = true
        this.setState(this.state)
        try {
            if (this.state.isReady) {
                    if (this.state.info.template_info.json !== '' && typeof this.state.info.template_info.json !== 'undefined') {
                        this.state.emailEditorRef.loadDesign(this.convertWidthByPageSize(this.state.info.template_info.json));
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

    handleChangeModalLeave() {
        this.state.activeModalLeave = !this.state.activeModalLeave;
        this.setState(this.state)
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

    convertPageSizeTopx(page_size) {
        let width = "0px";
        if (page_size === "a4") {
            width = "794px"
        } else if (page_size === "a5") {
            width = '559px'
        } else if (page_size === "a6") {
            width = '397px'
        } else if (page_size === "Letter") {
            width = '816px'
        } else if (page_size === "Legal") {
            width = '816px'
        }
        return width
    }
    convertWidthByPageSize(json){
        const pixel = this.convertPageSizeTopx(this.state.info.template_info.page_size)
        if (typeof json == "string"){
            json = JSON.parse(json)
        }
        json.body.values.contentWidth = pixel
        return json
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
            <span className={"title-title"}>Format</span>
        </span>

        )
        return (
            <Card title={titleOption}>
                <div className={"input-general"}>
                    <Text variant="headingSm" as="h6">
                        LAYOUT
                    </Text>
                </div>
                <div className={"input-general"}>
                    <Select
                        label="Paper size"
                        options={this.state.optionsPaperSize}
                        onChange={value => this.handleSelectPaperSize(value)}
                        value={this.state.info.template_info.page_size}
                    />
                </div>
                <div className={"input-general"}>
                    <Select
                        label="Orientation"
                        options={this.state.optionsOrientation}
                        onChange={value => this.handleSelectOrientation(value)}
                        value={this.state.info.template_info.orientation}
                    />
                </div>
                <div className={"input-general"}>
                    <TextField
                        label="Top margin (px)"
                        type="number"
                        value={this.state.info.template_info.top_margin}
                        onChange={value => this.handleChangeTopMargin(value)}
                        autoComplete="off"
                        id={"top_margin"}
                    />
                </div>
                <div className={"input-general"}>
                    <TextField
                        label="Bottom margin (px)"
                        type="number"
                        value={this.state.info.template_info.bottom_margin}
                        onChange={value => this.handleChangeBottomMargin(value)}
                        autoComplete="off"
                        id={"bottom_margin"}
                    />
                </div>
                <div className={"input-general"}>
                    <TextField
                        label="Left margin (px)"
                        type="number"
                        value={this.state.info.template_info.left_margin}
                        onChange={value => this.handleChangeLeftMargin(value)}
                        autoComplete="off"
                        id={"left_margin"}
                    />
                </div>
                <div className={"input-general"}>
                    <TextField
                        label="Right margin (px)"
                        type="number"
                        value={this.state.info.template_info.right_margin}
                        onChange={value => this.handleChangeRightMargin(value)}
                        autoComplete="off"
                        id={"right_margin"}
                    />
                </div>
                {/*<div className={"input-general"}>*/}
                {/*    <Select*/}
                {/*        label="Font Family"*/}
                {/*        options={this.state.optionsFont}*/}
                {/*        onChange={value => this.handleSelectFont(value)}*/}
                {/*        value={this.state.info.template_info.font_family}*/}
                {/*    />*/}
                {/*</div>*/}
                {/*<div className={"input-general"}>*/}
                {/*    <TextField*/}
                {/*        label="Font size (px)"*/}
                {/*        type="number"*/}
                {/*        value={this.state.info.template_info.font_size}*/}
                {/*        onChange={value => this.handleChangeFontSize(value)}*/}
                {/*        autoComplete="off"*/}
                {/*        id={"font_size"}*/}
                {/*    />*/}
                {/*</div>*/}
                <div className={"input-general"}>
                    <Text variant="headingSm" as="h6">
                        DATE FORMAT
                    </Text>
                </div>
                <div className={"input-general"}>

                    <Select
                        options={this.state.optionsDateFormat}
                        onChange={value => this.handleSelectDateFormat(value)}
                        value={this.state.info.template_info.date_format}
                    />
                </div>
            </Card>
        )
    }

    render() {
        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;
        const wrapper = (
            <div className={"title-wrapper"}>
                <span className={"page-previous"} onClick={() => this.backPrevious(`/pdf/templates`)}>Templates</span>
                <span> / </span>
                <span className={"template-name"}
                      onClick={() => this.backPrevious(`/pdf/templates/${this.state.info.template_info.id ? this.state.info.template_info.id : 0}/edit`)}>{this.state.info.template_info.name ? this.state.info.template_info.name : "New"}</span>
                <span> / </span>
                <span className={"template-name"}>Format</span>
            </div>
        )
        return (
            <div>
                <div className={"template-header"}>
                    <Page
                        title={wrapper}
                        primaryAction={{
                            content: 'Save',
                            loading: this.state.loading,
                            disabled: !this.state.isChange,
                            onAction: async () => {
                                await this.onSaveTemplate("/pdf/template/update/clipboard", {info: this.state.info.template_info}, config.template_info.embed_clipboard, null, false, false)
                                await this.onSaveTemplate("/pdf/template/update/edit", {info: this.state.info.template_info}, config.template_info.embed, "Save successfully");
                            }
                        }}
                        secondaryActions={<Button onClick={() => this.handleChange()}>Open editor</Button>}
                    />
                </div>

                <div className={"template-detail-content"}>
                    <div className={"template-detail-menu"}>
                        <Page>

                            {this.open_template_editor()}
                            <div style={{height: '0px', display: "none"}}>
                                <Frame>
                                    {toastMarkup}
                                </Frame>
                            </div>
                            {this.render_menu()}
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

export default TemplateFormat;