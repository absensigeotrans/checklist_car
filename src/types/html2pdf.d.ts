declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
  }

  interface Html2PdfChain {
    set(options: Html2PdfOptions): Html2PdfChain;
    from(element: HTMLElement | string): Html2PdfChain;
    save(): Promise<void>;
    output(type?: string): Promise<unknown>;
  }

  function html2pdf(): Html2PdfChain;
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2PdfChain;

  export default html2pdf;
}
