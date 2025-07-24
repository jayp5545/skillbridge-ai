import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Alert, Platform } from "react-native";
import { format } from "date-fns";

export const generateCertificateHTML = (certificate, userData) => {
  const date = format(new Date(), "MMMM dd, yyyy");
//  HTML template for the certificate
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body {
            height: 100%;
            padding: 0;
            margin: 0;
          }
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            background-color: #ffffff;
          }
      
          .certificate {
            border: 20px solid #0066cc;
            padding: 40px;
            text-align: center;
            position: relative;
            min-width: 100%;
            box-sizing: border-box;
          }
          .logo {
            margin-bottom: 20px;
            color: #0066cc;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          }
          .subtitle {
            font-size: 24px;
            color: #666;
            margin-bottom: 30px;
          }
          .name {
            font-size: 32px;
            font-weight: bold;
            color: #0066cc;
            margin: 20px 0;
          }
          .course {
            font-size: 28px;
            color: #333;
            margin: 20px 0;
          }
          .date {
            font-size: 20px;
            color: #666;
            margin-top: 30px;
          }
          .signature {
            margin-top: 40px;
            border-top: 2px solid #333;
            width: 200px;
            display: inline-block;
            padding-top: 10px;
            font-size: 18px;
            color: #333;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.1;
            font-size: 100px;
            color: #0066cc;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="watermark">SkillBridge AI</div>
          <div class="logo">SkillBridge AI</div>
          <div class="title">Certificate of Completion</div>
          <div class="subtitle">This is to certify that</div>
          <div class="name">${userData.name}</div>
          <div class="subtitle">has successfully completed the course</div>
          <div class="course">${certificate.courseTitle}</div>
          <div class="date">Issued on ${format(
            certificate.issued_at.toDate(),
            "MMMM dd, yyyy"
          )}</div>
          <div class="signature">
            SkillBridge AI
          </div>
        </div>
      </body>
    </html>
  `;
};

// Function to download the certificate as a PDF
export const downloadCertificate = async (certificate, userData) => {
  try {
    // Generate the HTML for the certificate
    const html = generateCertificateHTML(certificate, userData);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Handling sharing/saving based on the operating system
    if (Platform.OS === "ios") {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } else {
      const fileName = `certificate_${certificate.courseTitle.replace(
        /\s+/g,
        "_"
      )}_${Date.now()}.pdf`;
      const downloadDir = FileSystem.documentDirectory;
      const filePath = `${downloadDir}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: filePath,
      });
      // Share the PDF file
      await Sharing.shareAsync(filePath, {
        mimeType: "application/pdf",
        dialogTitle: "Save Certificate",
        UTI: "com.adobe.pdf",
      });
    }
  } catch (error) {
    console.error("Error generating certificate:", error);
    Alert.alert(
      "Error",
      "Failed to generate certificate. Please try again.",
      [{ text: "OK" }]
    );
  }
};
