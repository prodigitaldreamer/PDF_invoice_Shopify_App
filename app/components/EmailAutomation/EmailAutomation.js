import React, {Component} from "react";
import {
    AppProvider,
    Card,
    ProgressBar,
    Text,
    Page,
    Badge, ResourceList, ResourceItem, Heading
} from "@shopify/polaris"
import "@shopify/polaris/build/esm/styles.css";
import "./email_automation.css"
import {MobileHorizontalDotsMajor} from "@shopify/polaris-icons";

const config = window.config
console.log(config)

class EmailAutomation extends Component {

    state = {
        config: config,
        emails: [],
        itemAction: [{content: 'Duplicate'}, {content: 'Delete', color: "red"}],
        totalSend: 400,
        limitInMonth: 1000,
        selectedItems: []

    }

    get_limit_email(total, limit) {
        let layout;
        if (limit !== -1) {
            layout = <Card>
                <div className={"status-email-content"}>
                    <div className={"status-email"}>
                        <div className={"status-title"}>
                            <Text variant="headingSm" as="h6">
                                Online store dashboard
                            </Text>
                        </div>
                        <div className={"limit-email"}>
                            {total + '/' + limit}
                        </div>
                    </div>
                    <div className={"progress-status"}>
                        <ProgressBar progress={total / limit * 100}/>
                    </div>
                    <div className={"email-support"}>
                                <span>Have questions about email limit? Chat with our support team or contact us at <a
                                    style={{textDecoration: "none"}}
                                    href="mailto:support@email.com">support@email.com</a>.
                                </span>
                    </div>
                </div>
            </Card>
        }
        return layout
    }

    get_list_email() {
        this.get_data_mail()
        const items = this.state.emails

        const resourceName = {
            singular: 'emails',
            plural: 'emails',
        }
        const setSelectedItems = (id) => {
            this.state.selectedItems = id;
            this.setState(this.state)
        }

        return (<div>
                <Heading>
                    <div className={'resource-item'} style={{paddingTop: '15px', paddingBottom: '15px', borderBottom: 'thin solid #f0f0f0'}}>
                        <span className={'name-template'} style={{paddingLeft: '20px'}}>Email type</span>
                        <span className={'title-template'}>Rule</span>
                        <span className={'status-template'} style={{paddingRight: '30px'}}>Status</span>
                    </div>
                </Heading>
                <ResourceList
                    resourceName={resourceName}
                    items={items}
                    selectedItems={this.state.selectedItems}
                    onSelectionChange={e => setSelectedItems(e)}
                    renderItem={(item) => {
                        const {id, name, rule, status} = item;
                        // const shortcutActions = [
                        //     {
                        //         content: "Duplicate",
                        //     },
                        //     {
                        //         content: "Delete",
                        //     }
                        // ]
                        return (
                            <ResourceItem
                                id={id}
                                url={`emailautomation/${id}/edit`}
                                // shortcutActions={shortcutActions}
                                persistActions={true}

                            >
                                <div className={'resource-item'}>
                                    <span className={'name-template'}>{name}</span>
                                    <span className={'title-template'}>{rule}</span>
                                    <span className={'status-template'}>{status ?
                                        <Badge status="success">Enabled</Badge> :
                                        <Badge>Disabled</Badge>}
                                </span>
                                </div>


                            </ResourceItem>
                        );
                    }}
                />
            </div>

        )
    }

    capitalize(s) {
        return s[0].toUpperCase() + s.slice(1);
    }

    get_data_mail() {
        const data = this.state.config.email_automation_settings
        const result = [];
        data.forEach((item) => {
            result.push({
                id: item.id,
                name: this.capitalize(item.type),
                rule: `Send when ${item.send_email_when}`,
                status: item.enable_email_automation,
            })
        })
        this.state.emails = result
    }

    render() {

        return (
            <AppProvider>
                <div>
                    <div className={"email-header"}>
                        <Page title={"Email automation"}/>
                    </div>
                    <div className={"email-detail-content"}>
                        {
                            this.get_limit_email(this.state.config.email_month_counts, this.state.config.current_plan.automation_email_limits)
                        }

                        <Card>
                            {
                                this.get_list_email()
                            }

                        </Card>
                    </div>

                </div>
            </AppProvider>
        )
    }


}

export default EmailAutomation;