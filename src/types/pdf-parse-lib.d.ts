declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  };

  function pdfParse(
    dataBuffer: Buffer,
    options?: {
      pagerender?: (pageData: unknown) => string | Promise<string>;
      max?: number;
      version?: string;
    },
  ): Promise<PdfParseResult>;

  export default pdfParse;
}
