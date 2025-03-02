import React, {Component} from "react";
import ReactDOM from "react-dom";
import {AppProvider} from "@shopify/polaris"
import translations from '@shopify/polaris/locales/en.json';
import "@shopify/polaris/build/esm/styles.css";
import createApp from '@shopify/app-bridge';
import {AppLink, NavigationMenu} from '@shopify/app-bridge/actions';
import Home from "../components/Home/Home";
import EmailAutomation from "../components/EmailAutomation/EmailAutomation";
import EmailAutomationSettings from "../components/EmailAutomation/EmailAutomationSettings";
import Settings from "../components/Settings/Settings";
import Templates from "../components/Templates/Templates";
import TemplateDetail from "../components/Templates/TemplateDetail";
import TemplateGeneral from "../components/Templates/TemplateGeneral";
import TemplateDesign from "../components/Templates/TemplateDesign";
import TemplateFormat from "../components/Templates/TemplateFormat";
import Account from "../components/Account/Account";
import Preview from "../components/Preview/Preview";


const config = window.config
var Buffer = require('buffer/').Buffer

class Index extends Component {

    render() {
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
        this._build_navigation_menu(config_render)
        return (
            <AppProvider i18n={translations}>
                {this._render_layout_pdf_invoice()}
            </AppProvider>
        )
    }

    _build_navigation_menu(config_render) {
        const app = createApp({
            apiKey: config_render.apiKey,
            host: config_render.host,
        });
        const homeLink = AppLink.create(app, {
            label: 'Home',
            destination: '/pdf/main',
        });
        const templateLink = AppLink.create(app, {
            label: 'Templates',
            destination: '/pdf/templates',
        });
        // const emaiAutomationlLink = AppLink.create(app, {
        //     label: 'Email automation',
        //     destination: '/pdf/emailautomation',
        // });
        const settingLink = AppLink.create(app, {
            label: 'Settings',
            destination: '/pdf/settings',
        });
        const navigationMenu = NavigationMenu.create(app, {
            items: [homeLink, templateLink, settingLink],
        });
    }

    _render_layout_pdf_invoice() {
        let layout;
        if (config.page == "main") {
            layout = <Home/>
        } else if (config.page == "templates") {
            if (config.mode == "set") {
                layout = <Templates/>
            } else if (config.mode == "edit") {
                layout = <TemplateDetail/>
            } else if (config.mode == "general") {
                layout = <TemplateGeneral/>
            } else if (config.mode == "format") {
                layout = <TemplateFormat/>
            } else if (config.mode == "design") {
                layout = <TemplateDesign/>
            }
        } else if (config.page == "settings") {
            layout = <Settings/>
        } else if (config.page == "accounts") {
            layout = <Account/>
        } else if (config.page == "emailautomation") {
            if (config.mode == "edit") {
                layout = <EmailAutomationSettings/>
            } else {
                layout = <EmailAutomation/>
            }
        } else {
            layout = <Home/>
        }
        return layout;
    }

}

export default Index;

if (typeof document != "undefined") {
    const wrapper = document.getElementById("pdf_invoice_main");
    wrapper ? ReactDOM.render(<Index/>, wrapper) : false;
}
if (typeof document != "undefined") {
    const wrapper = document.getElementById("pdf_invoice_preview");
    wrapper ? ReactDOM.render(<Preview/>, wrapper) : false;
}