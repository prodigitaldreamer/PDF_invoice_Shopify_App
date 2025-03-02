import React, {Component} from "react";
import "./home.css"
import {Button, Card, Icon, Page, ProgressBar, Text} from "@shopify/polaris"
import {
    ChevronDownMinor,
    ChevronUpMinor,
    CircleMinusMajor,
    CircleTickMajor,
    FollowUpEmailMajor,
    IllustrationMajor,
    MobileCancelMajor,
    PageDownMajor
} from '@shopify/polaris-icons';
import $ from 'jquery';
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

class Home extends Component {

    constructor(props) {
        super(props);
        this.check_setup_status();
        console.log(config);

    }

    state = {
        info: config.info,
        review_card: true,
        setup_state: true,
        finish_setup: false,
        show_finish: true,
    }

    check_setup_status() {
        // check setup step 1
        if (this.state.info.allow_frontend || this.state.info.allow_backend) {
            this.state.info.setup_status.is_allow_frontend = true;
        } else {
            this.state.info.setup_status.is_allow_frontend = false;
        }
        // check setup step 2
        if (this.state.info.name !=="" || this.state.info.phone !=="") {
            this.state.info.setup_status.is_open_setup_info = true;
        } else {
            this.state.info.setup_status.is_open_setup_info = false;
        }
        // check setup step 3
        if (config.templates.length == 0) {
            this.state.info.setup_status.is_open_template_setting = false;
        } else {
            this.state.info.setup_status.is_open_template_setting = true;
        }
    }

    show_review_card() {
        const close_review_card = () => {
            this.state.review_card = false
            this.setState(this.state)
        }
        return (
            <div className={"home-setup"}>
                <div className={"home-card"}>
                    <div className={"home-feedback"}>
                        <div className={"feedback-content"}>
                            <div className={"feedback-title"}>
                                <div className={"feedback-title-title"}>
                                    <span style={{fontWeight: 'bold'}}>We would love to hear your feedback!</span>
                                </div>
                                <div className={"feedback-title-detail"}>
                                    <span>Tell us what you think about the app and share your experience with other users on Shopify App Store</span>
                                </div>
                                <div className={"feedback-button"}>
                                    <Button onClick={() => window.open("https://apps.shopify.com/hapo-pdf-invoice#modal-show=WriteReviewModal", "_blank")}>
                                        Write a review
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className={"feedback-image"}>
                            <svg width="118" height="118" viewBox="0 0 118 118" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_3756_13035)">
                                    <path
                                        d="M91.0757 39.7246V86.1682C91.0757 92.4507 85.964 97.5625 79.6815 97.5625H58.6883L45.5379 106.735L29.4167 117.982V97.5625H11.3943C5.11175 97.5625 0 92.4507 0 86.1682V39.7246C0 33.4398 5.11175 28.3303 11.3943 28.3303H79.6815C85.964 28.3303 91.0757 33.4398 91.0757 39.7246Z"
                                        fill="#F5D34F"/>
                                    <path
                                        d="M91.0757 39.7246V86.1682C91.0757 92.4507 85.964 97.5625 79.6815 97.5625H58.6883L45.5379 106.735V28.3303H79.6815C85.964 28.3303 91.0757 33.4398 91.0757 39.7246Z"
                                        fill="#FFA320"/>
                                    <path
                                        d="M115.412 15.0992L69.9028 60.6088L56.8738 61.1448L57.4099 48.1159L102.919 2.60658C106.369 -0.84327 111.964 -0.844883 115.414 2.60497C117.138 4.32909 118.002 6.59112 118 8.8513C118 11.1133 117.136 13.3751 115.412 15.0992Z"
                                        fill="#619CED"/>
                                    <path d="M15.8607 46.0532H45.5379V52.9672H15.8607V46.0532Z" fill="#FFA320"/>
                                    <path d="M15.8607 59.4733H45.5379V66.3873H15.8607V59.4733Z" fill="#FFA320"/>
                                    <path d="M15.8607 72.8933H75.056V79.8073H15.8607V72.8933Z" fill="#FFA320"/>
                                    <path
                                        d="M115.412 15.0992L69.9028 60.6088L56.8738 61.1448L115.414 2.60497C117.138 4.32909 118.002 6.59111 118 8.8513C118 11.1133 117.136 13.3751 115.412 15.0992Z"
                                        fill="#4773CC"/>
                                    <path
                                        d="M72.9292 57.5826L69.9029 60.6089L56.8738 61.1452L57.4099 48.1159L60.4362 45.0896L72.9292 57.5826Z"
                                        fill="#514C7E"/>
                                    <path
                                        d="M72.9292 57.5826L69.9029 60.6089L56.8738 61.1452L66.6826 51.3362L72.9292 57.5826Z"
                                        fill="#2D2F5C"/>
                                    <path d="M45.5379 72.8933H75.056V79.8073H45.5379V72.8933Z" fill="#F78002"/>
                                    <path
                                        d="M7 4L9.163 8.60833L14 9.348L10.5 12.9343L11.326 18L7 15.6083L2.674 18L3.5 12.9343L0 9.348L4.837 8.60833L7 4Z"
                                        fill="#FFA320"/>
                                    <g opacity="0.1">
                                        <path
                                            d="M14 9.34788L10.9783 8.88588L8.16666 11.7675L8.97049 16.6979L11.326 17.9999L10.5 12.9342L14 9.34788Z"
                                            fill="black"/>
                                    </g>
                                    <path
                                        d="M24 4L26.163 8.60833L31 9.348L27.5 12.9343L28.326 18L24 15.6083L19.674 18L20.5 12.9343L17 9.348L21.837 8.60833L24 4Z"
                                        fill="#FFA320"/>
                                    <g opacity="0.1">
                                        <path
                                            d="M31 9.34788L27.9783 8.88588L25.1667 11.7675L25.9705 16.6979L28.326 17.9999L27.5 12.9342L31 9.34788Z"
                                            fill="black"/>
                                    </g>
                                    <path
                                        d="M41 4L43.163 8.60833L48 9.348L44.5 12.9343L45.326 18L41 15.6083L36.674 18L37.5 12.9343L34 9.348L38.837 8.60833L41 4Z"
                                        fill="#FFA320"/>
                                    <g opacity="0.1">
                                        <path
                                            d="M48 9.34788L44.9783 8.88588L42.1667 11.7675L42.9705 16.6979L45.326 17.9999L44.5 12.9342L48 9.34788Z"
                                            fill="black"/>
                                    </g>
                                    <path
                                        d="M58 4L60.163 8.60833L65 9.348L61.5 12.9343L62.326 18L58 15.6083L53.674 18L54.5 12.9343L51 9.348L55.837 8.60833L58 4Z"
                                        fill="#FFA320"/>
                                    <g opacity="0.1">
                                        <path
                                            d="M65 9.34788L61.9783 8.88588L59.1667 11.7675L59.9705 16.6979L62.326 17.9999L61.5 12.9342L65 9.34788Z"
                                            fill="black"/>
                                    </g>
                                    <path
                                        d="M75 4L77.163 8.60833L82 9.348L78.5 12.9343L79.326 18L75 15.6083L70.674 18L71.5 12.9343L68 9.348L72.837 8.60833L75 4Z"
                                        fill="#FFA320"/>
                                    <g opacity="0.1">
                                        <path
                                            d="M82 9.34788L78.9783 8.88588L76.1667 11.7675L76.9705 16.6979L79.326 17.9999L78.5 12.9342L82 9.34788Z"
                                            fill="black"/>
                                    </g>
                                </g>
                                <defs>
                                    <clipPath id="clip0_3756_13035">
                                        <rect width="118" height="118" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>


                        </div>
                        <div className={"feedback-close"} onClick={close_review_card}>
                            <Icon
                                source={MobileCancelMajor}
                                color="base"
                            />
                        </div>

                    </div>
                </div>
            </div>

        )
    }

    goto_setting(data, redirectURL) {
        $.ajax('/pdf/setupCheck/',
            {
                method: 'GET',
                data: data,
            }).done((res) => {
            return redirect.dispatch(Redirect.Action.APP, redirectURL);
        })
    }

    state_setup() {

        const layout = <div>
            <div className={"setup-home setup-shadow"}>
                <div className={"print-tick"}>
                    <Icon
                        source={this.state.info.setup_status.is_allow_frontend ? CircleTickMajor : CircleMinusMajor}
                        color={this.state.info.setup_status.is_allow_frontend ? 'success' : 'base'}
                    />
                </div>
                <div className={"setup-print-content"}>
                    <div className={"setup-print-title"}>
                        <span>Allow printing buttons on Shopify order pages</span>
                    </div>
                    <div className={"setup-print-detail"}>
                        <span>This allows you to preview and print invoices on Shopify order page</span>
                    </div>
                </div>

                <div className={"setup-print-button"}>
                    <Button primary onClick={() => this.goto_setting({page: 'allow_frontend', shop: config.info.shop}, '/pdf/settings')}>Go to
                        settings</Button>
                </div>
            </div>
            <div className={"setup-home"}>
                <div className={"print-tick"}>
                    <Icon
                        source={this.state.info.setup_status.is_open_setup_info ? CircleTickMajor : CircleMinusMajor}
                        color={this.state.info.setup_status.is_open_setup_info ? 'success' : 'base'}
                    />
                </div>
                <div className={"setup-print-content"}>
                    <div className={"setup-print-title"}>
                        <span>Set up your store information</span>
                    </div>
                    <div className={"setup-print-detail"}>
                        <span>These information will be automatically filled on your invoices</span>
                    </div>
                </div>

                <div className={"setup-print-button"}>
                    <Button primary onClick={() => this.goto_setting({page: 'setup_info', shop: config.info.shop}, '/pdf/settings')}>Go to
                        settings</Button>
                </div>
            </div>
            <div className={"setup-home"}>
                <div className={"print-tick"}>
                    <Icon
                        source={this.state.info.setup_status.is_open_template_setting ? CircleTickMajor : CircleMinusMajor}
                        color={this.state.info.setup_status.is_open_template_setting ? 'success' : 'base'}
                    />
                </div>
                <div className={"setup-print-content"}>
                    <div className={"setup-print-title"}>
                        <span>Set up your PDF templates</span>
                    </div>
                    <div className={"setup-print-detail"}>
                        <span>Edit our preset templates or create your own with drag-and-drop tool</span>
                    </div>
                </div>

                <div className={"setup-print-button"}>
                    <Button primary onClick={() => this.goto_setting({page: 'is_open_template', shop: config.info.shop}, '/pdf/templates')}>Go
                        to
                        Templates</Button>
                </div>
            </div>
        </div>

        return layout
    }

    progress_bar_setup() {
        let perCent = 0;
        const show_state_setup = () => {
            this.state.setup_state = !this.state.setup_state
            this.setState(this.state)

        }
        const get_state_setup = () => {
            let count = 0;
            const setup_status = this.state.info.setup_status
            let length_status = 0
            for (var e in setup_status) {
                length_status++;
                if (setup_status[e] === true) {
                    count++;
                }
            }

            perCent = count / length_status * 100
            return count
        }
        const layout = <div className={"progress-setup"}>
            <div className={"progress-title"}>
                <div className={"progress-title-text"}>

                    <span>Let’s complete your setup</span>
                </div>
                <div className={"progress-title-icon"} onClick={show_state_setup}>
                    <Icon
                        source={this.state.setup_state ? ChevronUpMinor : ChevronDownMinor}
                        color="base"
                    />
                </div>
            </div>

            <div className={"progress-progress"}>
                <span
                    className={"progress-progress-text"}>{get_state_setup().toString() + ' of 3 steps completed'} </span>
                <div className={"progress-progress-bar"}>
                    <ProgressBar progress={perCent} size={"small"} color={"success"}/>
                </div>
            </div>
        </div>
        return layout
    }

    action_close_congratulation(action, data) {
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
            }
        )
    }

    check_finish_first_setup() {
        const handleChangeShowFinish = () => {
            this.state.show_finish = !this.state.finish_setup
            if (this.state.finish_setup) {
                this.state.info.close_congratulation = true
            }
            this.setState(this.state)
            this.action_close_congratulation('/pdf/save/settings', this.state.info)
        }
        let layout;
        if (this.state.finish_setup && this.state.info.close_congratulation == false) {
            layout = this.state.show_finish ? <div className={"home-setup"}>
                <div className={"home-card"}>

                    <Card>
                        <div className={"finish-card"}>
                            <div className={"finish-content"}>
                                <svg width="83" height="83" viewBox="0 0 83 83" fill="none"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.8594 47.9844C16.1432 47.9844 15.5625 47.4037 15.5625 46.6875V41.2774C15.5625 39.2584 14.7762 37.3602 13.3487 35.9327C12.8421 35.4262 12.8421 34.6052 13.3486 34.0986C13.8551 33.5921 14.6762 33.5921 15.1825 34.0986C17.1001 36.016 18.1562 38.5655 18.1562 41.2774V46.6875C18.1562 47.4037 17.5756 47.9844 16.8594 47.9844Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M10.375 28.5312H7.78125V24.6406C7.78125 23.9244 8.36193 23.3438 9.07812 23.3438C9.79432 23.3438 10.375 23.9244 10.375 24.6406V28.5312Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M9.07812 36.3125C8.36193 36.3125 7.78125 35.7318 7.78125 35.0156V31.125H10.375V35.0156C10.375 35.7318 9.79432 36.3125 9.07812 36.3125Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M10.375 31.125V28.5312H14.2656C14.9818 28.5312 15.5625 29.1119 15.5625 29.8281C15.5625 30.5443 14.9818 31.125 14.2656 31.125H10.375Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M2.59375 29.8281C2.59375 29.1119 3.17443 28.5312 3.89062 28.5312H7.78125V31.125H3.89062C3.17443 31.125 2.59375 30.5443 2.59375 29.8281Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M66.1406 47.9844C65.4244 47.9844 64.8438 47.4037 64.8438 46.6875V41.2774C64.8438 38.5655 65.8999 36.016 67.8175 34.0986C68.3239 33.5921 69.145 33.5923 69.6514 34.0986C70.1579 34.605 70.1579 35.4262 69.6513 35.9327C68.2237 37.3602 67.4375 39.2584 67.4375 41.2774V46.6875C67.4375 47.4037 66.8568 47.9844 66.1406 47.9844Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M47.9844 45.3906H35.0156C34.2994 45.3906 33.7188 44.8099 33.7188 44.0938V41.5H49.2812V44.0938C49.2812 44.8099 48.7006 45.3906 47.9844 45.3906Z"
                                        fill="#555A6E"/>
                                    <path d="M33.7188 41.5H49.2812V42.7969H33.7188V41.5Z" fill="#463C4B"/>
                                    <path
                                        d="M49.2812 42.7969H41.5V45.3906H47.9844C48.7006 45.3906 49.2812 44.8099 49.2812 44.0938V42.7969Z"
                                        fill="#463C4B"/>
                                    <path
                                        d="M67.4375 80.4062H15.5625C12.6975 80.4062 10.375 78.0837 10.375 75.2188V46.6875H72.625V75.2188C72.625 78.0837 70.3025 80.4062 67.4375 80.4062Z"
                                        fill="#C8733C"/>
                                    <path
                                        d="M36.3125 80.4062H15.5625C12.6975 80.4062 10.375 78.0837 10.375 75.2188V46.6875H41.5V75.2188C41.5 78.0837 39.1775 80.4062 36.3125 80.4062Z"
                                        fill="#F0915A"/>
                                    <path
                                        d="M41.5 46.6875C38.635 46.6875 36.3125 49.01 36.3125 51.875V57.0625C36.3125 57.7787 35.7318 58.3594 35.0156 58.3594H6.48438C5.76818 58.3594 5.1875 57.7787 5.1875 57.0625V51.875C5.1875 49.01 7.51004 46.6875 10.375 46.6875H41.5Z"
                                        fill="#FAB991"/>
                                    <path
                                        d="M41.5 46.6875C44.365 46.6875 46.6875 49.01 46.6875 51.875V57.0625C46.6875 57.7787 47.2682 58.3594 47.9844 58.3594H76.5156C77.2318 58.3594 77.8125 57.7787 77.8125 57.0625V51.875C77.8125 49.01 75.49 46.6875 72.625 46.6875H41.5Z"
                                        fill="#F0915A"/>
                                    <path
                                        d="M49.2812 41.5H41.5V2.59375C43.1608 2.59375 44.7535 3.25354 45.9279 4.42786C49.7358 8.2358 51.875 13.4004 51.875 18.7856V38.9062C51.875 40.3388 50.7138 41.5 49.2812 41.5Z"
                                        fill="#A5C3DC"/>
                                    <path
                                        d="M33.7188 41.5H41.5V2.59375C39.8392 2.59375 38.2465 3.25354 37.0721 4.42786C33.2642 8.2358 31.125 13.4004 31.125 18.7856V38.9062C31.125 40.3388 32.2862 41.5 33.7188 41.5Z"
                                        fill="#D7E6F0"/>
                                    <path
                                        d="M41.5 25.9375C45.0812 25.9375 47.9844 23.0343 47.9844 19.4531C47.9844 15.8719 45.0812 12.9688 41.5 12.9688C37.9188 12.9688 35.0156 15.8719 35.0156 19.4531C35.0156 23.0343 37.9188 25.9375 41.5 25.9375Z"
                                        fill="#1C489D" fill-opacity="0.9"/>
                                    <path
                                        d="M47.9844 19.4531C47.9844 15.872 45.0812 12.9688 41.5 12.9688V25.9375C45.0812 25.9375 47.9844 23.0343 47.9844 19.4531Z"
                                        fill="#1C489D"/>
                                    <path
                                        d="M41.5 23.3438C43.6487 23.3438 45.3906 21.6019 45.3906 19.4531C45.3906 17.3044 43.6487 15.5625 41.5 15.5625C39.3513 15.5625 37.6094 17.3044 37.6094 19.4531C37.6094 21.6019 39.3513 23.3438 41.5 23.3438Z"
                                        fill="#00D2D2"/>
                                    <path
                                        d="M41.5 28.5312C40.7838 28.5312 40.2031 29.1119 40.2031 29.8281V42.7969C40.2031 43.5131 40.7838 44.0938 41.5 44.0938C42.2162 44.0938 42.7969 43.5131 42.7969 42.7969V29.8281C42.7969 29.1119 42.2162 28.5312 41.5 28.5312Z"
                                        fill="#1C489D"/>
                                    <path
                                        d="M51.875 38.9062L56.5253 43.5565C56.8693 43.9005 57.3357 44.0938 57.8221 44.0938C58.835 44.0938 59.6562 43.2727 59.6562 42.2596V37.924C59.6562 36.8922 59.2463 35.9025 58.5168 35.1729L51.875 28.5312V38.9062Z"
                                        fill="#1C489D"/>
                                    <path
                                        d="M31.125 38.9062L26.4747 43.5565C26.1307 43.9005 25.6643 44.0938 25.1779 44.0938C24.165 44.0938 23.3438 43.2727 23.3438 42.2596V37.924C23.3438 36.8922 23.7537 35.9025 24.4832 35.1729L31.125 28.5312V38.9062Z"
                                        fill="#1C489D" fill-opacity="0.9"/>
                                    <path
                                        d="M41.5 2.59375V7.78125H34.3656C35.1405 6.5784 36.0451 5.45498 37.0728 4.42721C37.6597 3.84037 38.3519 3.3816 39.1041 3.07035C39.8562 2.7591 40.67 2.59375 41.5 2.59375Z"
                                        fill="#1C489D" fill-opacity="0.9"/>
                                    <path
                                        d="M48.6344 7.78125H41.5V2.59375C42.33 2.59375 43.1438 2.7591 43.896 3.07035C44.6482 3.3816 45.3404 3.84037 45.9272 4.42721C46.955 5.45498 47.8596 6.5784 48.6344 7.78125Z"
                                        fill="#1C489D"/>
                                    <path d="M35.0156 45.3906H47.9844V46.6875H35.0156V45.3906Z" fill="#00D2D2"/>
                                    <path
                                        d="M72.625 28.5312H75.2188V24.6406C75.2188 23.9244 74.6381 23.3438 73.9219 23.3438C73.2057 23.3438 72.625 23.9244 72.625 24.6406V28.5312Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M73.9219 36.3125C74.6381 36.3125 75.2188 35.7318 75.2188 35.0156V31.125H72.625V35.0156C72.625 35.7318 73.2057 36.3125 73.9219 36.3125Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M72.625 31.125V28.5312H68.7344C68.0182 28.5312 67.4375 29.1119 67.4375 29.8281C67.4375 30.5443 68.0182 31.125 68.7344 31.125H72.625Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M80.4062 29.8281C80.4062 29.1119 79.8256 28.5312 79.1094 28.5312H75.2188V31.125H79.1094C79.8256 31.125 80.4062 30.5443 80.4062 29.8281Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M58.3594 7.78125H60.9531V5.1875C60.9531 4.4713 60.3724 3.89062 59.6562 3.89062C58.9401 3.89062 58.3594 4.4713 58.3594 5.1875V7.78125Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M59.6562 14.2656C60.3724 14.2656 60.9531 13.6849 60.9531 12.9688V10.375H58.3594V12.9688C58.3594 13.6849 58.9401 14.2656 59.6562 14.2656Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M58.3594 10.375V7.78125H55.7656C55.0494 7.78125 54.4688 8.36193 54.4688 9.07812C54.4688 9.79432 55.0494 10.375 55.7656 10.375H58.3594Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M64.8438 9.07812C64.8438 8.36193 64.2631 7.78125 63.5469 7.78125H60.9531V10.375H63.5469C64.2631 10.375 64.8438 9.79432 64.8438 9.07812Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M59.6562 27.2344C58.9401 27.2344 58.3594 26.6537 58.3594 25.9375V18.1562C58.3594 17.4401 58.9401 16.8594 59.6562 16.8594C60.3724 16.8594 60.9531 17.4401 60.9531 18.1562V25.9375C60.9531 26.6537 60.3724 27.2344 59.6562 27.2344Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M59.6562 32.4219C58.9401 32.4219 58.3594 31.8412 58.3594 31.125V29.8281C58.3594 29.1119 58.9401 28.5312 59.6562 28.5312C60.3724 28.5312 60.9531 29.1119 60.9531 29.8281V31.125C60.9531 31.8412 60.3724 32.4219 59.6562 32.4219Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M22.0469 7.78125H24.6406V5.1875C24.6406 4.4713 24.0599 3.89062 23.3438 3.89062C22.6276 3.89062 22.0469 4.4713 22.0469 5.1875V7.78125Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M23.3438 14.2656C24.0599 14.2656 24.6406 13.6849 24.6406 12.9688V10.375H22.0469V12.9688C22.0469 13.6849 22.6276 14.2656 23.3438 14.2656Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M22.0469 10.375V7.78125H19.4531C18.7369 7.78125 18.1562 8.36193 18.1562 9.07812C18.1562 9.79432 18.7369 10.375 19.4531 10.375H22.0469Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M28.5312 9.07812C28.5312 8.36193 27.9506 7.78125 27.2344 7.78125H24.6406V10.375H27.2344C27.9506 10.375 28.5312 9.79432 28.5312 9.07812Z"
                                        fill="#FAA037"/>
                                    <path
                                        d="M23.3438 27.2344C22.6276 27.2344 22.0469 26.6537 22.0469 25.9375V18.1562C22.0469 17.4401 22.6276 16.8594 23.3438 16.8594C24.0599 16.8594 24.6406 17.4401 24.6406 18.1562V25.9375C24.6406 26.6537 24.0599 27.2344 23.3438 27.2344Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M23.3438 32.4219C22.6276 32.4219 22.0469 31.8412 22.0469 31.125V29.8281C22.0469 29.1119 22.6276 28.5312 23.3438 28.5312C24.0599 28.5312 24.6406 29.1119 24.6406 29.8281V31.125C24.6406 31.8412 24.0599 32.4219 23.3438 32.4219Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M72.625 18.1562C74.0575 18.1562 75.2188 16.995 75.2188 15.5625C75.2188 14.13 74.0575 12.9688 72.625 12.9688C71.1925 12.9688 70.0312 14.13 70.0312 15.5625C70.0312 16.995 71.1925 18.1562 72.625 18.1562Z"
                                        fill="#EF693F"/>
                                    <path
                                        d="M10.375 18.1562C11.8075 18.1562 12.9688 16.995 12.9688 15.5625C12.9688 14.13 11.8075 12.9688 10.375 12.9688C8.94251 12.9688 7.78125 14.13 7.78125 15.5625C7.78125 16.995 8.94251 18.1562 10.375 18.1562Z"
                                        fill="#EF693F"/>
                                </svg>
                                <Text variant="headingSm" as="h6">
                                    <br/>Congratulation! You’re all set up.
                                </Text>
                                <div className={"finish-help-text"}>
                                    <span>
                                        Feel free to explore PDF Invoice and discover even more useful features for merchants. For more information, visit our Help Center or contact our support.
                                    </span>
                                </div>
                                <div className={"finish-button"}>
                                    <Button onClick={handleChangeShowFinish}>I got it!</Button>

                                </div>
                            </div>

                            <div className={"finish-icon"} onClick={handleChangeShowFinish}>
                                <Icon
                                    source={MobileCancelMajor}
                                    color="base"
                                />
                            </div>
                        </div>

                    </Card>


                </div>
            </div> : null
        }
        return layout
    }

    render() {
        const setup_status = this.state.info.setup_status

        for (var e in setup_status) {
            if (setup_status[e] == true) {
                this.state.finish_setup = true;

            } else {
                this.state.finish_setup = false;
                break;
            }
        }
        return (
            <div>
                <Page>
                    <div className={"home-sayhi"}>
                        <p className={"sayhi-name"}>Welcome
                            back, {this.state.info ? this.state.info.shop_owner : 'PDF Invoice'}</p>
                        <p className={"sayhi-what"}>What would you like to do today?</p>
                    </div>

                    <div className={"home-setup"}>
                        <div className={"home-card"}>
                            {this.state.finish_setup == false ? this.progress_bar_setup() : null}
                            {this.state.setup_state && this.state.finish_setup == false ? this.state_setup() : null}

                        </div>
                    </div>
                    {this.state.finish_setup ? this.check_finish_first_setup() : null}
                    {this.state.review_card ? this.show_review_card() : null}

                    <div className={"home-setup"}>
                        <div className={"home-card"}>
                            <div style={{padding: "20px 20px 20px 20px"}}>
                                <div className={"explore-title"}>
                                    <span>Explore PDF Invoice</span>
                                </div>
                                <div className={"explore-detail "}>
                                    <span>Utilize your app usage with these features</span>
                                </div>
                            </div>
                            <div className={"explore-card setup-shadow"}>
                                <div className={"explore-icon"}>
                                    <Icon
                                        source={IllustrationMajor}
                                        color="base"/>
                                </div>
                                <div className={"explore-content"}>
                                    <div className={"explore-content-title"}>
                                        <span>Create your own templates</span>
                                    </div>
                                    <div className={"explore-content-detail"}>
                                        <span>Design PDF templates that match your brand with our drag-and-drop editor</span>
                                    </div>

                                </div>
                                <div className={"explore-button"}>
                                    <Button primary onClick={() =>{
                                        redirect.dispatch(Redirect.Action.APP, '/pdf/templates');
                                    }}>Jump to section</Button>
                                </div>
                            </div>
                            <div className={"explore-card setup-shadow"}>
                                <div className={"explore-icon"}>
                                    <Icon
                                        source={PageDownMajor}
                                        color="base"/>
                                </div>
                                <div className={"explore-content"}>
                                    <div className={"explore-content-title"}>
                                        <span>Add download link to email notification</span>
                                    </div>
                                    <div className={"explore-content-detail"}>
                                        <span>Allow your customer to download invoice from Shopify order email</span>
                                    </div>

                                </div>
                                <div className={"explore-button"}>
                                    <Button primary onClick={() =>{
                                        redirect.dispatch(Redirect.Action.APP, '/pdf/settings#notify_email');
                                    }}>Jump to section</Button>
                                </div>
                            </div>
                            {/*<div className={"explore-card setup-shadow"}>*/}
                            {/*    <div className={"explore-icon"}>*/}
                            {/*        <Icon*/}
                            {/*            source={FollowUpEmailMajor}*/}
                            {/*            color="base"/>*/}
                            {/*    </div>*/}
                            {/*    <div className={"explore-content"}>*/}
                            {/*        <div className={"explore-content-title"}>*/}
                            {/*            <span>Set up automated email</span>*/}
                            {/*        </div>*/}
                            {/*        <div className={"explore-content-detail"}>*/}
                            {/*            <span>Automatically send PDF invoices to customers when they order</span>*/}
                            {/*        </div>*/}

                            {/*    </div>*/}
                            {/*    <div className={"explore-button"}>*/}
                            {/*        <Button primary onClick={() =>{*/}
                            {/*            redirect.dispatch(Redirect.Action.APP, '/pdf/emailautomation');*/}
                            {/*        }}>Jump to section</Button>*/}
                            {/*    </div>*/}
                            {/*</div>*/}
                        </div>
                    </div><br/>
                </Page>

            </div>

        );
    }


}

export default Home;