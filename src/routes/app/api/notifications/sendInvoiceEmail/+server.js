import fetch from "node-fetch";
import { json } from "@sveltejs/kit";
import fs from "fs/promises";
import path from "path";

async function getHTMLTemplate(content) {
  const baseTemplatePath = path.resolve(
    "src/routes/app/api/sendInvoiceEmail/base-email-template.html"
  );
  // const baseTemplate = await fs.readFile(baseTemplatePath, "utf8");
  const baseTemplate = ""

  if (!baseTemplate) {
    return content;
  }

  content.replace('<table width="600"', "<table");

  return baseTemplate.replace("{{{content}}}", content);
}

// Utility function to generate CSV content from data
function generateCSV(data) {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(","));
  return [headers, ...rows].join("\n");
}

export async function POST({ request }) {
  const { billingContactEmail, subjectLine, emailHtml, ccArray, pdfURL, shipmentLineItemsForClientExport } =
    await request.json();

  const apiKey = import.meta.env.VITE_SEND_GRID_API_KEY;
  const endpoint = "https://api.sendgrid.com/v3/mail/send";

  const emailHtmlContent = await getHTMLTemplate(emailHtml);

  let data = {
    personalizations: [
      {
        to: [{ email: billingContactEmail }], // Replace with the recipient's email address
        subject: subjectLine,
        bcc: [
          {
            email: "accountsreceivable@hometown-industries.com",
          },
        ],
      },
    ],
    from: {
      email: "accountsreceivable@hometown-industries.com",
      name: "Hometown Industries Invoicing",
    },
    content: [{ type: "text/html", value: emailHtmlContent }],
  };

  // If PDF URL is valid add the attachments property to the payload
  if (pdfURL !== undefined && pdfURL !== null && pdfURL !== "") {
    // Fetch PDF as base64
    async function fetchPDFasBase64(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    }

    const pdfBase64 = await fetchPDFasBase64(pdfURL);

    data.attachments = [
      {
        content: pdfBase64,
        filename: "Invoice.pdf",
        type: "application/pdf",
        disposition: "attachment",
      },
    ];
  }

  // Generate CSV from shipmentLineItemsForClientExport and attach it
  if (shipmentLineItemsForClientExport && shipmentLineItemsForClientExport.length > 0) {
    const csvContent = generateCSV(shipmentLineItemsForClientExport);
    const csvBase64 = Buffer.from(csvContent).toString("base64");

    data.attachments = [
      ...(data.attachments || []), // Keep existing attachments if any
      {
        content: csvBase64,
        filename: "Client_Shipments.csv",
        type: "text/csv",
        disposition: "attachment",
      },
    ];
  }

  // If the cc array has any data in it add it to the payload
  if (ccArray.length > 0) {
    data.personalizations[0].cc = ccArray;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  console.log("RESPONSE", response);

  if (response.ok) {
    return json({
      status: 200,
      body: { message: "Email sent successfully" },
    });
  } else {
    return json({
      status: response.status,
      body: { message: "Failed to send email" },
    });
  }
}
