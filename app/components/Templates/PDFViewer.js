import React from "react";

import {Viewer, Worker} from '@react-pdf-viewer/core';
import {defaultLayoutPlugin} from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

function PDFViewer(props) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    return (
        <div>
            {
                props.filePDF && <><Worker
                    workerUrl="https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js">
                    <Viewer
                        fileUrl={props.filePDF}
                        plugins={[defaultLayoutPluginInstance]}
                        theme={{
                            theme: 'dark',
                        }}
                        defaultScale={1}
                    />
                </Worker></>
            }
        </div>
    )
}
export default PDFViewer