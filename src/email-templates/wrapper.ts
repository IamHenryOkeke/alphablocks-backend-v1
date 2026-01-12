export const emailTemplate = (
  title: string,
  content: string,
  bannerImageURL?: string,
) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Montserrat Font -->
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <title>${title}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background-color:#f5f7fa;
      font-family:'Montserrat', Arial, Helvetica, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!-- Container -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              background:#ffffff;
              border-radius:8px;
              overflow:hidden;
            "
          >
            <!-- Banner -->
            <tr>
              <td style="background:#006BFF; text-align:center;">
                <img
                  src=${bannerImageURL || "https://res.cloudinary.com/dfquzvx4n/image/upload/v1740317628/Alphablocks/wfdfrulispe1uye59vqw.jpg"}
                  alt="Alphablocks"
                  style="
                    width:100%;
                    max-width:600px;
                    display:block;
                  "
                />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 24px; color:#0f172a;">
                <h2
                  style="
                    margin-top:0;
                    font-size:20px;
                    font-weight:600;
                  "
                >
                  ${title}
                </h2>

                <div style="font-size:14px; line-height:1.6;">
                  ${content}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background:#f8fafc;
                  padding:24px;
                  text-align:center;
                  font-size:12px;
                  color:#64748b;
                "
              >
                <p style="margin:0 0 12px;">
                  Follow us on
                </p>

                <p style="margin:0 0 16px;">
                  <a
                    href="#"
                    style="color:#006BFF; text-decoration:none; margin:0 8px;"
                  >
                    Twitter
                  </a>
                  |
                  <a
                    href="#"
                    style="color:#006BFF; text-decoration:none; margin:0 8px;"
                  >
                    LinkedIn
                  </a>
                  |
                  <a
                    href="#"
                    style="color:#006BFF; text-decoration:none; margin:0 8px;"
                  >
                    Instagram
                  </a>
                </p>

                <p style="margin:0;">
                  © ${new Date().getFullYear()} Alphablocks. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
