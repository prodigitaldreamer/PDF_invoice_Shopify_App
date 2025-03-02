from pdfkit.pdfkit import PDFKit


class PDFKitExtend(PDFKit):
    def command(self, path=None):
        command = list(self._command(path))
        command.insert(0, '30')
        command.insert(0, 'timeout')
        return command


PDFKit.command = PDFKitExtend.command

