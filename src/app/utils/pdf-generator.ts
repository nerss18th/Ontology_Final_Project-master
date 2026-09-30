import html2pdf from 'html2pdf.js';

export class PdfGenerator {
  static generateUseCasePdf(projectName: string, data: any[], filename: string) {
    const tableRows = data.map(uc => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${uc.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${uc.type || 'Use Case'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${uc.caption || uc.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${uc.description || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <div style="padding: 20px; font-family: 'Sarabun', sans-serif;">
        <h2 style="text-align: center; margin-bottom: 10px;">Use Case Diagram Report</h2>
        <h4 style="text-align: center; margin-bottom: 20px; color: #555;">Project: ${projectName}</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Type</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.length ? tableRows : '<tr><td colspan="4" style="text-align:center; padding:10px;">No Use Cases</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    this.downloadPdf(html, filename);
  }

  static generateClassPdf(projectName: string, classes: any[], filename: string) {
    let html = `
      <div style="padding: 20px; font-family: 'Sarabun', sans-serif;">
        <h2 style="text-align: center; margin-bottom: 10px;">Class Diagram Report</h2>
        <h4 style="text-align: center; margin-bottom: 20px; color: #555;">Project: ${projectName}</h4>
    `;

    if (classes.length === 0) {
      html += `<p style="text-align:center;">No Classes defined.</p>`;
    }

    classes.forEach(cls => {
      const attrs = (cls.attributes || []).map((a: any) => `<li>${a.attribute_encapsulation || ''} ${a.attribute_name}: ${a.attribute_data_type}</li>`).join('');
      const methods = (cls.methods || []).map((m: any) => `<li>${m.method_encapsulation || ''} ${m.method_name}(): ${m.return_data_type}</li>`).join('');

      html += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="background: #e9ecef; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
             ${cls.type || 'Class'}: ${cls.name}
          </h3>
          <p><strong>Description:</strong> ${cls.description || '-'}</p>
          ${cls.extend_class_name ? `<p><strong>Extends:</strong> ${cls.extend_class_name}</p>` : ''}
          
          <div style="display: flex; gap: 20px;">
            <div style="flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
              <strong>Attributes:</strong>
              <ul style="margin: 5px 0 0 20px; padding: 0;">${attrs || '<li>None</li>'}</ul>
            </div>
            <div style="flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
              <strong>Methods:</strong>
              <ul style="margin: 5px 0 0 20px; padding: 0;">${methods || '<li>None</li>'}</ul>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.downloadPdf(html, filename);
  }

  static generateActivityPdf(projectName: string, activities: any[], filename: string) {
    let html = `
      <div style="padding: 20px; font-family: 'Sarabun', sans-serif;">
        <h2 style="text-align: center; margin-bottom: 10px;">Activity Diagram Report</h2>
        <h4 style="text-align: center; margin-bottom: 20px; color: #555;">Project: ${projectName}</h4>
    `;

    if (activities.length === 0) {
      html += `<p style="text-align:center;">No Activity Diagrams defined.</p>`;
    }

    activities.forEach(act => {
      const actions = (act.actions || []).map((a: any) => `<li>[Lane ${a.laneNo}] ${a.caption}</li>`).join('');
      
      html += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="background: #e9ecef; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
            Activity: ${act.activity_name || `Activity ${act.id}`}
          </h3>
          <p><strong>Description:</strong> ${act.description || '-'}</p>
          
          <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; margin-top: 10px;">
            <strong>Actions:</strong>
            <ul style="margin: 5px 0 0 20px; padding: 0;">${actions || '<li>None</li>'}</ul>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.downloadPdf(html, filename);
  }

  private static downloadPdf(htmlContent: string, filename: string) {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt as any).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  }
}
