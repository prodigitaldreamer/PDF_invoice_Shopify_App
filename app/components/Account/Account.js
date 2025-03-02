import React, {Component} from "react";
import {
    Page,
    Card,
    DataTable,
    Icon,
    Button,
    Text,
    Form,
    Modal,
    FormLayout, TextContainer, Banner
} from "@shopify/polaris"
import "@shopify/polaris/build/esm/styles.css";
import "./account.css"
import {TickMinor, MinusMinor} from "@shopify/polaris-icons";
import axios from "axios";

const config = window.config

class Account extends Component {
    constructor(props) {
        super(props);

    }

    state = {
        info: config,
        downgrades_confirm_popup: false,
        downgrades_loading: false
    }

    downgrades_modal() {
        return (
            <Modal
                open={this.state.downgrades_confirm_popup}
                onClose={() => {
                    this.state.downgrades_confirm_popup = false
                    this.setState(this.state)
                }}
                title="Confirmation"
                primaryAction={{
                    content: 'Confirm',
                    onAction: () => {

                        axios.post(
                            '/pdf/downgrades/plan/free',
                            {}, {
                                onUploadProgress: () => {
                                    this.state.downgrades_loading = true;
                                    this.setState(this.state);
                                }
                            }
                        ).then((res) => {
                                this.state.downgrades_loading = false;
                                this.state.downgrades_confirm_popup = false;
                                this.state.message = res.result.message + '. Page will reload in 5 seconds.';
                                this.setState(this.state);
                                setTimeout(() => {
                                    console.log("reload")
                                    location.reload()
                                }, 5000)
                            }).catch(() => {
                            this.state.downgrades_loading = false;
                            this.setState(this.state);
                        })
                    },
                    loading: this.state.downgrades_loading
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => {
                            this.state.downgrades_confirm_popup = false
                            this.setState(this.state)
                        },
                    },
                ]}
            >
                <Modal.Section>
                    <TextContainer>
                        <Banner status='warning'
                                title="If you confirm to cancel your current subscription plan, we will automatically cancel it in the next few hours (maximum 12 hours), and you will no longer be charged in next month. Also, you won't be able to use features of this current plan after cancelling.">
                        </Banner>
                    </TextContainer>
                </Modal.Section>
            </Modal>
        )
    }

    get_sign_up_button(plan) {
        let current_plan = this.state.info.current_plan;

        if (plan.name === 'Free') {
            var button = current_plan.price === plan.price ?
                <Button primary submit disabled={current_plan.price === plan.price}>
                    Current Plan
                </Button> : ''
        } else {
            button = <Form method="post" preventDefault={false}
                           action={"/pdf/plan/charge?plan=" + plan.name}
                           onSubmit={() => {
                           }}>
                <FormLayout>
                    <Button primary submit disabled={current_plan.price === plan.price}>
                        {current_plan.price !== plan.price ? 'Start 7-day free trial' : 'Current Plan'}
                    </Button>
                    {
                        current_plan.price === plan.price && current_plan.name !== 'Free' &&
                        <Button plain
                                onClick={() => {
                                    this.state.downgrades_confirm_popup = true
                                    this.setState(this.state)
                                }}
                                disabled={!current_plan.charge_id}
                        >{!current_plan.charge_id ? 'Canceled' : 'Cancel'} plan
                        </Button>
                    }
                </FormLayout>
            </Form>
        }
        return (
            button
        )

    }

    render() {
        const heading = [
            '',
            <div className={"plan-title"}>
                <Text variant="headingMd" as="h6">
                    Free
                </Text>
            </div>,

            <div className={"plan-title"}>
                <div className={"plan-recommend"}>
                    Most popular
                </div>
                <Text variant="headingMd" as="h6">
                    Basic
                </Text>
                <span>$8.99/month</span>
            </div>,

            <div className={"plan-title"}>
                <Text variant="headingMd" as="h6">
                    Advanced
                </Text>
                <span>$19.99/month</span>
            </div>,

        ]
        const tick = <Icon source={TickMinor} color="primary"/>
        const untick = <Icon source={MinusMinor} color="base"/>
        const rows = [
            ['Drag-and-drop editor', tick, tick, tick],
            ['Print and export orders', "50 views/month to print/export", "Unlimited", "Unlimited"],
            ['Print and export draft orders', untick, tick, tick],
            ['Print orders in bulk', "5 orders at once", "20 orders at once", "Unlimited"],
            ['Multiple currencies', tick, tick, tick],
            ['Multiple languages', tick, tick, tick],
            ['Add PDF links to Shopify emails', tick, tick, tick],
            ['Email automation (with attached PDF)', untick, "500 emails/month", "Unlimited"],
            ['Custom invoice numbering', untick, tick, tick],
            ['HS code, country of origin variables', untick, tick, tick],
            ['Custom order tags for emailing filters', untick, untick, tick],
            ['On-demand setup & template customizations', untick, 1, tick,],
            ['Paper size', "A4", "A4, A5, A6, Legal, US letter, Tabloid", "A4, A5, A6, Legal, US letter, Tabloid"],
            ['Customer support', "Live chat/Email", "Priority support", "Priority support",],
            ['', this.get_sign_up_button({name: 'Free', price: 0.0}), this.get_sign_up_button({
                name: 'Basic',
                price: 8.99
            }), this.get_sign_up_button({
                name: 'Advanced',
                price: 19.99
            })],

        ];
        return (
            <div>
                <div>
                    <div className={"account-header"}>
                        <Page title={"Email automation"}/>
                    </div>
                    <Page fullWidth>
                        <Card>
                            <div className={"account-plan"}>
                                <DataTable
                                    firstColumnMinWidth="2000px"
                                    columnContentTypes={[
                                        'text',
                                        'text',
                                        'text',
                                        'text',
                                    ]}
                                    headings={heading}
                                    rows={rows}
                                />
                            </div>

                        </Card>
                        {this.downgrades_modal()}
                    </Page>
                </div>
            </div>
        )
    }
}

export default Account;