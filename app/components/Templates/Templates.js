import React, {Component} from "react";
import "./templates.css";
import {
    Page,
    Card,
    Badge,
    Text,
    ResourceList,
    ResourceItem,
    Frame,
    Modal,
    FormLayout,
    Toast, Button, TextField, InlineError, Select, Heading, TextContainer
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import axios from "axios";

const config = window.config;

class Templates extends Component {

    constructor(props) {
        super(props);
    }

    state = {
        info: config,
        selectedResources: [],
        selectedItems: [],
        toast: false,
        message: "",
        loading: false,
        saving: false,
        openPopupSubmit: false,
        allResourcesSelected: '',
        request_data: {
            type: 'invoice',
            error: false,
            email: '',
            description: ''
        }, request_count: 0,
        limit_request: false,
        activeModalConfirm: false,
        selectItem: []
    }

    toggleActive(value) {
        this.state.toast = !this.state.toast;
        this.setState(this.state);
    }

    template_action(action, data, message) {
        axios.post(action, {
            data
        }, {
            onUploadProgress: () => {
                this.setState({loading: true, active: false})
            }
        }).then((res) => {
            setTimeout(() => {
                if (res.data.result) {
                    if (res.data.result.templates.length == 0) {
                        this.state.info.templates.length = 0;
                    }
                    const templates = res.data.result;
                    this.state.info.all_templates = templates.templates
                    this.setState(this.state)
                    this.setState({loading: false, toast: true, message: message, active: true})

                } else {
                    this.setState({
                        loading: false,
                        toast: true,
                        message: 'Something went wrong.Please try again!',
                        active: true
                    })
                }

            }, 1500)
        }).catch(() => {
            this.setState({
                loading: false,
                toast: true,
                message: 'Something went wrong.Please try again!',
                active: true
            })
        })
    }

    get_list_templates() {
        const resourceName = {
            singular: 'template',
            plural: 'templates',
        }
        const promotedBulkActions = [
            {
                title: 'Action',
                actions: [
                    {
                        content: 'Delete',
                        destructive: true,
                        onAction: () => {
                            this.state.activeModalConfirm = true
                            this.setState(this.state)
                        },
                    },
                ],
            }, {
                content: 'Cancel',
                onAction: () => {
                    this.state.selectedItems = []
                    this.setState(this.state)
                },

            }

        ];
        const setSelectedItems = (id) => {
            this.state.selectedItems = id;
            this.setState(this.state)
        }

        let layout;
        if (this.state.info.templates.length > 0) {
            layout = <div><Heading>
                    <div className={'resource-item'} style={{paddingTop: '15px', paddingBottom: '15px', borderBottom: 'thin solid #f0f0f0'}}>
                        <span className={'name-template'} style={{paddingLeft: '20px'}}>Templates</span>
                        <span className={'title-template'}>Type</span>
                        <span className={'status-template'} style={{paddingRight: '62px'}}>Status</span>
                    </div>
                </Heading>
            <ResourceList
                showHeader={true}
                resourceName={resourceName}
                items={this.state.info.all_templates}
                selectedItems={this.state.selectedItems}
                onSelectionChange={e => setSelectedItems(e)}
                loading={this.state.loading}
                promotedBulkActions={promotedBulkActions}
                headings={[
                    {title: 'Name'},
                    {title: 'Location'},
                    {title: 'Order count'},
                    {title: 'Amount spent'}]}
                renderItem={(item) => {

                    const {id, title, type, default_set, available_set, avatarSource, shortcut, url} = item;
                    const shortcutActions = [
                        {
                            content: "Duplicate",
                            onAction: () => {
                                this.template_action('/pdf/template/duplicate', {ids: [id]}, "Duplicated!")
                            }
                        },
                        {
                            content: "Delete",
                            destructive: true,
                            onAction: () => {
                                this.state.activeModalConfirm = true
                                this.state.selectItem = [id]
                                this.setState(this.state)
                            }
                        }
                    ]
                    return (
                        <ResourceItem
                            id={id}
                            url={url}
                            shortcutActions={shortcutActions}
                            persistActions
                        >
                            <div className={'resource-item'}>
                                <span className={'name-template'}>{title}</span>
                                <span className={'title-template'}>{type}</span>
                                <span className={'status-template'}>{default_set ?
                                    <Badge status="success">Default</Badge> : null}
                                </span>
                            </div>
                        </ResourceItem>
                    );
                }}
            /></div>
        } else {
            layout = <div className={"template-empty"}>
                <div className={"empty-image"}>
                    <svg width="172" height="171" viewBox="0 0 172 171" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M31.804 19.3711C46.5558 7.26683 65.4286 0 86 0C106.571 0 125.444 7.26683 140.196 19.3711H54.1369H44.5459H31.804ZM24.44 49.0683V46.7839V38.2569V26.1714C9.61844 41.5467 0.5 62.4574 0.5 85.5C0.5 108.543 9.61844 129.453 24.44 144.829V49.0683Z"
                            fill="#82CD64"/>
                        <path
                            d="M24.44 123.09V144.828C9.61844 129.453 0.5 108.543 0.5 85.5C0.5 62.4575 9.61844 41.5467 24.44 26.1714V28.5387C15.4361 42.0807 10.1855 58.3334 10.1855 75.8145C10.1855 93.2956 15.4361 109.548 24.44 123.09Z"
                            fill="#78BE5A"/>
                        <path
                            d="M156.161 36.6334C157.175 38.0862 156.149 40.0781 154.378 40.0781H42.248H22.209C21.9785 40.0781 21.7588 40.0314 21.5591 39.9469C21.1593 39.7779 20.5391 37.1357 20.5391 36.9053V30.5048V18.3691C20.5391 17.447 21.2869 16.6992 22.209 16.6992H35.237H42.248H136.763C144.262 22.2414 150.821 28.9798 156.161 36.6334Z"
                            fill="#509137"/>
                        <path
                            d="M171.5 85.5C171.5 132.72 133.22 171 86 171C59.7251 171 36.223 159.144 20.5391 140.495V36.7383H30.5586V25.0488C30.5586 24.1267 31.3064 23.3789 32.2285 23.3789H65.627C66.5491 23.3789 67.2969 24.1267 67.2969 25.0488V36.7383H156.234C165.855 50.5699 171.5 67.3743 171.5 85.5Z"
                            fill="#E6FAFF"/>
                        <path
                            d="M60.6172 30.7266V32.7305C60.6172 33.0995 60.3183 33.3984 59.9492 33.3984H37.9062C37.5375 33.3984 37.2383 33.0995 37.2383 32.7305V30.7266C37.2383 30.3578 37.5375 30.0586 37.9062 30.0586H59.9492C60.3183 30.0586 60.6172 30.3578 60.6172 30.7266Z"
                            fill="#B4EBFF"/>
                        <path
                            d="M151.104 140.918C135.421 159.323 112.076 171 86 171C59.7251 171 36.223 159.144 20.5391 140.495V116.63C35.0276 143.249 63.2466 161.314 95.6855 161.314C116.83 161.314 136.178 153.635 151.104 140.918Z"
                            fill="#CDF5FF"/>
                        <path d="M130.754 66.7969H60.6172V136.934H130.754V66.7969Z" fill="#B4EBFF"/>
                        <path d="M130.754 110.215V126.914H60.6172V110.215H130.754Z" fill="#46A5CD"/>
                        <path
                            d="M130.754 123.574V136.934H60.6172V123.574H68.6355L83.5956 103.004C84.641 101.567 86.684 101.313 88.0493 102.451L100.017 112.424V123.574H130.754Z"
                            fill="#64A54B"/>
                        <path
                            d="M130.754 104.975V126.914V136.934H60.6172V126.914H79.5631L106.518 89.8518C107.761 88.1418 110.191 87.8399 111.816 89.1935L130.754 104.975Z"
                            fill="#78BE5A"/>
                        <path d="M130.754 126.914V136.934H60.6172V126.914H130.754Z" fill="#4BB9E1"/>
                        <path
                            d="M87.3359 78.4863C87.3359 88.6314 79.1119 96.8555 68.9668 96.8555C58.8217 96.8555 50.5977 88.6314 50.5977 78.4863C50.5977 68.3412 58.8217 60.1172 68.9668 60.1172C79.1119 60.1172 87.3359 68.3412 87.3359 78.4863Z"
                            fill="#FFF573"/>
                        <path
                            d="M77.3164 78.4863C77.3164 83.0977 73.5781 86.8359 68.9668 86.8359C64.3555 86.8359 60.6172 83.0977 60.6172 78.4863C60.6172 73.875 64.3555 70.1367 68.9668 70.1367C73.5781 70.1367 77.3164 73.875 77.3164 78.4863Z"
                            fill="#FFE13C"/>
                    </svg>

                </div>
                <div>
                    <div>
                        <Text variant="headingLg" as="h5">
                            Looks like you have no templates here
                        </Text>
                    </div>

                    <div className={"help-text-empty"}>
                        <span>Easily customize your templates from our designs or create from scratch with our drag-and-drop tool</span>
                    </div>
                </div>
                <div className={"empty-button"}>
                    <div style={{margin: "0 20px 50px 0"}}>
                        <Button
                            primary
                            onClick={() => {
                                window.location.pathname = "/pdf/templates/0/edit/" + config.info.shop
                            }}
                        >Create new template</Button>
                    </div>
                    <div>
                        <Button>Learn more</Button>
                    </div>
                </div>
            </div>
        }
        return layout
    }

    submit_request_form() {
        var self = this;
        return axios.post(
            '/request/submit',
            self.state.request_data
            ,{
                onUploadProgress: () => {
                    this.state.saving = true
                    self.setState(this.state)
                }
            }
        ).then((res) => {
            setTimeout(() => {
                if (res.data.result.status) {
                    this.state.request_count = this.state.request_count + 1
                    if (this.state.request_count >= 2) {
                        this.state.limit_request = true
                    }
                    this.state.request_status = true
                    this.state.openPopupSubmit = false
                    this.state.saving = false
                    this.state.toast = true
                    this.state.message = "Submit successfully"
                    this.setState(this.state)
                } else {
                    this.state.request_data.error = true
                    this.setState(this.state)
                }
            }, 1500)
        }).catch(() => {
            setTimeout(() => {
                self.setState({saving: false})
            }, 1500)
        })
    }

    handleChangeModalConfirm() {
        this.state.activeModalConfirm = !this.state.activeModalConfirm;
        this.state.selectItem = []
        this.state.selectedItems = []
        this.setState(this.state)
    }

    get_delete_confirm() {
        return (
            <Modal
                open={this.state.activeModalConfirm}
                title={this.state.selectedItems.length == 0 ? "Are you sure you want to delete this template?" : "Are you sure you want to delete these template?"}
                onClose={() => this.handleChangeModalConfirm()}
                primaryAction={{
                    content: 'Delete',
                    destructive: true,
                    onAction: () => {
                        this.template_action('/pdf/template/delete', {ids: this.state.selectedItems.length == 0 ? this.state.selectItem : this.state.selectedItems, shop: config.info.shop}, "Template deleted")
                        this.state.activeModalConfirm = false;
                        this.state.selectItem = []
                        this.state.selectedItems = []
                        this.setState(this.state)
                    },
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => this.handleChangeModalConfirm(),
                    },
                ]}
            >
                <Modal.Section>
                    <TextContainer>
                        <p>
                            This action cannot be undone.
                        </p>
                    </TextContainer>
                </Modal.Section>
            </Modal>
        )
    }

    get_request_form() {
        return (
            <Modal
                small
                open={this.state.openPopupSubmit}
                onClose={() => {
                    this.state.openPopupSubmit = false
                    this.state.request_data.error = false
                    this.setState(this.state)
                }}
                title="Request Form"
                primaryAction={{
                    content: 'Submit',
                    loading: this.state.saving,
                    onAction: () => {
                        if (typeof this.state.request_data.email != 'undefined' && this.state.request_data.email != '') {
                            this.submit_request_form()
                        } else {
                            this.state.request_data.error = true
                            this.setState(this.state)
                        }
                    },
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => {
                            this.state.openPopupSubmit = false
                            this.state.request_data.error = false
                            this.setState(this.state)
                        },
                    },
                ]}
            >
                <Modal.Section>
                    <FormLayout>
                        <TextField label="Your Email"
                                   id="email_contact"
                                   value={this.state.request_data.email}
                                   inputMode="email"
                                   onChange={(value) => {
                                       this.state.request_data.email = value;
                                       this.setState(this.state);

                                   }}
                        />
                        {this.state.request_data.error ?
                            <InlineError message="Invalid Your Email" fieldID="email_contact"/> : false}
                        <Select
                            label="Template Type"
                            options={[
                                {label: 'Invoice', value: 'invoice'},
                                {label: 'Refund', value: 'refund'},
                                {label: 'Packing', value: 'packing'},
                            ]}
                            onChange={(value) => {
                                this.state.request_data.type = value;
                                this.setState(this.state);

                            }}
                            value={this.state.request_data.type}
                        />
                        <TextField label="Description"
                                   id="description"
                                   value={this.state.request_data.description}
                                   onChange={(value) => {
                                       this.state.request_data.description = value;
                                       this.setState(this.state);

                                   }}
                                   maxLength={255}
                                   showCharacterCount
                                   multiline={13}
                        />
                    </FormLayout>
                </Modal.Section>
            </Modal>
            )
    }

    render() {
        const toastMarkup = this.state.toast ? (
            <Toast content={this.state.message} onDismiss={(e) => this.toggleActive(e)}/>
        ) : null;
        console.log(this.state)
        return (
            <div>
                <div className={"template-header"}>
                    <Page
                        title="Templates"
                        primaryAction={{
                            content: 'New template',
                            onAction: () => {
                                window.location.pathname = "/pdf/templates/0/edit/" + config.info.shop
                            }
                        }}
                        secondaryActions={[
                            {
                                content: 'On-demand customization',
                                disabled: false,
                                onAction: () => {
                                    this.state.openPopupSubmit = true;
                                    this.setState(this.state)
                                }
                            },
                        ]}
                    />
                </div>

                <Page>
                    <div className={"template-list"}>
                        <Card>
                            {this.get_request_form()}
                            {this.get_delete_confirm()}
                            {this.get_list_templates()}
                        </Card>
                    </div>
                    <div style={{height: '0px', display: "none"}}>
                        <Frame>
                            {toastMarkup}
                        </Frame>
                    </div>
                </Page>
            </div>

        )
    }


}

export default Templates;