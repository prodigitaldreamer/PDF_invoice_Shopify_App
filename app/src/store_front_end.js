import React, {Component} from "react";
import ReactDOM from "react-dom";
// import "bootstrap/dist/css/bootstrap.min.css";
import {faPrint} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import "../css/cart.css";
// import {Translations} from "./translation";
import fetch from 'isomorphic-fetch';
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            label: 'Print your invoice here',
            allow_pint: false
        }
        const pathname = window.location.pathname;
        const check_load_button = pathname.includes("orders") || pathname.includes("thank_you");
        if (check_load_button) {
            this.retrieveButtonLabel()
        }
    }

    retrieveButtonLabel(){
        var self = this;
        const live_base_url = 'https://app.hapoapps.com'
        const url =  live_base_url + '/get/button/label' + '?shop=' + Shopify.shop
        // return $.ajax
        // (live_base_url + '/get/button/label',
        //     {
        //         method: 'GET',
        //         dataType: 'json',
        //         contentType: 'application/json',
        //         beforeSend: () => {
        //
        //         }
        //     }
        // ).done((res) => {
        //     console.log(res)
        // }).always(() => {
        //
        // })
        fetch(url, {
            cache: 'no-cache',
        }).then(
            (response) => response.json()
        ).then((data) => {
            if (typeof data == 'object'){
                 self.state.label = data.label
                 self.state.allow_frontend = data.allow_frontend
                 self.setState(self.state);
            }
        })
    }

    render() {
        var url = false
        if (typeof window.Shopify.checkout != "undefined") {
            // var base_url = window.origin + '/apps/pdf-invoice/pdf/print/order_status_page/PDF_INVOICE'
            var base_url = 'https://app.hapoapps.com/pdf/print/order_status_page/PDF_INVOICE'
            var shop_url = window.Shopify.shop
            var order_id = window.Shopify.checkout.order_id * 78
            var token = window.Shopify.checkout.token
            url = base_url + '?' + 'id=' + order_id + '&' + 'shop=' + shop_url + '&' + 'token=' + token
        } else {
            if (typeof window.object != "undefined") {
                var base_url = window.origin + '/apps/pdf-invoice/pdf/print/customer_order_page/PDF_INVOICE'
                var shop_url = window.Shopify.shop
                var order_id = window.object
                var token = window.location.pathname.split('/').pop()
                url = base_url + '?' + 'id=' + order_id + '&' + 'shop=' + shop_url + '&' + 'token=' + token
            }
        }

        // var text = 'PRINT YOUR PDF INVOICE HERE !'
        // if (typeof window.Shopify.locale != "undefined") {
        //     if (Translations.store_button_text[window.Shopify.locale] !== undefined) {
        //         text = Translations.store_button_text[window.Shopify.locale]
        //     }
        // }
        if (url && this.state.allow_frontend) {
            return (
                <div style={{marginTop: "5px"}}>
                    <strong>{this.state.label}</strong>
                    <button type="button" className="print_button" style={{marginLeft: "5px"}}
                            onClick={() => {
                                window.open(url);
                            }}>
                        <FontAwesomeIcon icon={faPrint}/>
                    </button>
                </div>
            )
        } else {
            return false
        }

    }
}

export default Index

if (typeof document != "undefined") {
    var wrapper = document.createElement("div");
    wrapper ? ReactDOM.render(<Index/>, wrapper) : false;
    // add on order status page
    if (typeof window.Shopify.checkout != "undefined") {
        var footer = document.getElementsByClassName("step__footer");
        footer.length > 0 ? footer[0].parentNode.insertBefore(wrapper, wrapper.nextSibling) : false;
    }
    // add on customer order page
    if (typeof window.object != "undefined") {
        var order_table = document.getElementsByClassName("order-table");
        order_table.length > 0  ? order_table[0].parentNode.insertBefore(wrapper, wrapper.nextSibling) : false;
        if (!order_table.length > 0) {
            var force_order_table = document.getElementsByTagName("table")
            force_order_table.length > 0 ? force_order_table[0].parentNode.insertBefore(wrapper, wrapper.nextSibling) : false;
        }
    }

}