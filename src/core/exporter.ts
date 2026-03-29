import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import puppeteer from 'puppeteer';
import { Exporter, FinalDocument } from '../types';

export class BaseExporter implements Exporter {
    async exportToDocx(doc: FinalDocument): Promise<Buffer> {
        const docx = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "Documento de Proyecto de Grado", heading: HeadingLevel.TITLE }),
                    new Paragraph({ text: "1. Introducción", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ children: [new TextRun(doc.sections.introduction)] }),

                    new Paragraph({ text: "2. Problemática de Investigación", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ children: [new TextRun(doc.sections.researchProblematic)] }),

                    new Paragraph({ text: "3. Problema de Investigación", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ children: [new TextRun(doc.sections.researchProblem)] }),

                    new Paragraph({ text: "4. Objetivo General", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ children: [new TextRun(doc.sections.generalObjective)] }),

                    new Paragraph({ text: "5. Objetivos Específicos", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ children: [new TextRun(doc.sections.specificObjectives)] }),

                    new Paragraph({ text: "6. Estado de la Cuestión", heading: HeadingLevel.HEADING_1 }),
                    ...(doc.sections.stateOfArt?.entries || []).map(entry =>
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Referencia: ", bold: true }),
                                new TextRun(entry.bibliographicReference),
                                new TextRun({ text: "\nProblema abordado: ", bold: true }),
                                new TextRun(entry.addressedProblem),
                                new TextRun({ text: "\nRelación: ", bold: true }),
                                new TextRun(entry.relationToResearch),
                            ]
                        })
                    )
                ]
            }]
        });

        return await Packer.toBuffer(docx);
    }

    async exportToPdf(doc: FinalDocument): Promise<Buffer> {
        const browser = await puppeteer.launch({ headless: true });
        try {
            const page = await browser.newPage();

            const html = `
        <html>
        <head>
          <style>
            body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; margin: 40px; }
            h1 { font-size: 16pt; margin-top: 24pt; margin-bottom: 12pt; }
            p { margin-bottom: 12pt; }
          </style>
        </head>
        <body>
          <h1>Documento de Proyecto de Grado</h1>
          
          <h1>1. Introducción</h1>
          <p>${doc.sections.introduction.replace(/\n/g, '<br>')}</p>
          
          <h1>2. Problemática de Investigación</h1>
          <p>${doc.sections.researchProblematic.replace(/\n/g, '<br>')}</p>
          
          <h1>3. Problema de Investigación</h1>
          <p>${doc.sections.researchProblem.replace(/\n/g, '<br>')}</p>
          
          <h1>4. Objetivo General</h1>
          <p>${doc.sections.generalObjective.replace(/\n/g, '<br>')}</p>
          
          <h1>5. Objetivos Específicos</h1>
          <p>${doc.sections.specificObjectives.replace(/\n/g, '<br>')}</p>
          
          <h1>6. Estado de la Cuestión</h1>
          ${(doc.sections.stateOfArt?.entries || []).map(e => `
            <p>
              <strong>Referencia:</strong> ${e.bibliographicReference}<br>
              <strong>Problema abordado:</strong> ${e.addressedProblem}<br>
              <strong>Relación:</strong> ${e.relationToResearch}
            </p>
          `).join('')}
        </body>
        </html>
      `;

            await page.setContent(html);
            const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '2.54cm', bottom: '2.54cm', left: '2.54cm', right: '2.54cm' } });
            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }
}

export const exporter = new BaseExporter();
