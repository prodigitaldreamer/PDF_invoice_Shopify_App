import React, {Component} from "react";
import "./preview.css";
import {
    AppProvider,
    Page,
    Card,
    Tabs,
    Spinner,
    ResourceList,
    ResourceItem,
    Frame,
    Toast, Button
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import axios from "axios";
import PDFViewer from "../Templates/PDFViewer";

const config = window.config;

class Preview extends Component {

    constructor(props) {
        super(props);
        console.log(config);
    }

    state = {
        info: config,
        tabsSelected: 0,
        tabsOption: [],
        pdf: '',
        loading: true,
        Url_pdf: []
    }

    tabsHandleChange(value) {
        if(this.state.tabsSelected != value) {
            this.state.loading = true
        }
        this.state.tabsSelected = value
        this.state.pdf = this.state.tabsOption[value].id
        this.setState(this.state)
    }

    remove_loading = () => {
        this.state.loading = false
        this.setState(this.state)
    }

    get_preview() {

        console.log(this.state.loading)
        const preview = <div style={{height: '80%'}}>
            {this.state.loading ?
                <div style={{margin: '10% 50% 0% 50%'}}>
                    <Spinner accessibilityLabel="Spinner example" size="large" color="teal"/>
                </div> : null}
            <embed id='myIframe_2' className="pdf_object" src={this.state.pdf} type="application/pdf"
                   style={{
                       width: '100%',
                       height: '100%',
                   }}

                   onLoad={this.remove_loading}
            />
        </div>


        return (preview)
    }

    uppercaseFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    getTabsOptions (option){
        let result = []
        for(const key in option){
            result.push({id: option[key], content: this.uppercaseFirst(key) + " template" })
        }
        console.log(result)
        return result
    }

    convertToFormattedUrls(originalUrl) {
        // Phân tích URL
        const urlParams = new URLSearchParams(originalUrl);

        // Lấy giá trị của tham số 'url'
        const urlValues = urlParams.get('url');

        // Chia các giá trị của 'url' thành mảng
        const urlsArray = urlValues.split(',');

        // Tạo mảng mới với các URL đã được chia
        const formattedUrls = urlsArray.map(url => originalUrl.split('url=')[0] + 'url=' + encodeURIComponent(url));

        // Trả về mảng các URL đã được chuyển đổi
        return formattedUrls;
    }

    downloadAllPDF(Url_pdf) {
        console.log(Url_pdf)

        const pdfUrls = Url_pdf

        pdfUrls.forEach((pdfUrl, index) => {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `pdf_${index + 1}.pdf`; // Tên tệp PDF khi tải xuống
            link.style.display = 'none'; // Ẩn liên kết
            document.body.appendChild(link); // Thêm liên kết vào body
            link.click(); // Kích hoạt sự kiện click trên liên kết
            document.body.removeChild(link); // Xóa liên kết sau khi đã click
        });
    }

    render() {
        this.state.tabsOption = this.getTabsOptions(this.state.info.preview.embed)

        this.state.pdf = this.state.tabsOption[this.state.tabsSelected].id
        if (this.state.pdf.includes("bulk")) {
            this.state.Url_pdf = this.convertToFormattedUrls(this.state.pdf);
        }

        console.log(this.state)
        return (
            <AppProvider>
                <div className={"template-header"}>
                    <Page
                        title="Preview"
                    />
                </div>
                <Tabs tabs={this.state.tabsOption} selected={this.state.tabsSelected}
                      onSelect={e => this.tabsHandleChange(e)}
                >
                    <div className={"button-single-pdf"} style={this.state.pdf.includes("bulk")?{display: "flex", justifyContent: "flex-end", padding: "15px 15px 0 0"} : {display: "none"}}>
                         <Button primary onClick={() => this.downloadAllPDF(this.state.Url_pdf)}>Download PDFs in different files</Button>
                    </div>
                    <div className={"preview-pdf"}>
                        {this.get_preview()}
                    </div>
                </Tabs>
                <br/>
            </AppProvider>

        )
    }


}

export default Preview;