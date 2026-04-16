export function moduleOpenEmail({ userName, workshopName, moduleName, appUrl, userId }) {
  const subject = `New Module Open — ${workshopName}`;

  // MTC3 palette – matches svgAssets.js and the Figma artboard
  const tileColors = [
    { bg: '#57A15E', border: '#000000' }, // green
    { bg: '#D2A478', border: '#000000' }, // tan
    { bg: '#994242', border: '#000000' }, // red
    { bg: '#D9D9D9', border: '#000000' }, // gray
    { bg: '#000000', border: '#333333' }, // black
    { bg: '#FFFFFF', border: '#000000' }, // white
  ];

  const tilesHtml = tileColors
    .map(
      ({ bg, border }) =>
        `<tr><td style="padding-bottom:6px;">` +
        `<div style="width:50px;height:60px;background-color:${bg};` +
        `border:1px solid ${border};border-radius:10px;` +
        `box-shadow:-3px 3px 0px #000000;"></div>` +
        `</td></tr>`
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#e8e8e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<center>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
       style="margin:0 auto;max-width:600px;background-color:#ffffff;">

  <!-- ═══ HEADER ═══ -->
  <tr>
    <td style="background-color:#000000;padding:20px 30px;">
      <span style="color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:0.5px;">
        Machine Theatre Collective
      </span>
    </td>
  </tr>

  <!-- ═══ BODY ═══ -->
  <tr>
    <td style="background-color:#ffffff;padding:45px 30px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>

          <!-- Left column: content card + CTA -->
          <td valign="top" style="width:380px;padding-right:20px;">

            <!-- Content card -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                   style="width:100%;max-width:340px;">
              <tr>
                <td style="background-color:#ffffff;border:1px solid #000000;border-radius:15px;padding:26px 28px;box-shadow:-4px 4px 0px #000000;">
                  <p style="margin:0 0 6px;color:#555555;font-size:13px;font-style:italic;line-height:18px;">
                    &ldquo;${workshopName}&rdquo;
                  </p>
                  <p style="margin:0 0 14px;font-size:21px;font-weight:700;color:#000000;line-height:28px;">
                    ${moduleName},
                    <span style="font-weight:400;">is now</span>
                  </p>
                  <p style="margin:0 0 8px;font-size:14px;color:#333333;line-height:21px;">
                    open for submissions.
                  </p>
                  <p style="margin:0;font-size:14px;color:#333333;line-height:21px;">
                    Closing for review in 2&nbsp;days.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Spacer -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="height:55px;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <!-- CTA button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border:1px solid #000000;border-radius:15px;box-shadow:-4px 4px 0px #000000;">
                  <a href="${appUrl}" target="_blank"
                     style="display:inline-block;padding:14px 26px;color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;">
                    Production Machinery&ensp;&rarr;
                  </a>
                </td>
              </tr>
            </table>

          </td>

          <!-- Right column: decorative color tiles -->
          <td valign="top" align="right" style="width:160px;padding-top:20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              ${tilesHtml}
            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ FOOTER ═══ -->
  <tr>
    <td style="background-color:#000000;padding:20px 30px;">
      <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#ffffff;line-height:16px;">
        <a href="${appUrl}" style="color:#ffffff;text-decoration:none;">account</a>
        &ensp;&middot;&ensp;
        <a href="${appUrl}" style="color:#ffffff;text-decoration:none;">contact</a>
        &ensp;&middot;&ensp;
        <a href="${appUrl}" style="color:#ffffff;text-decoration:none;">unsubscribe</a>
      </span>
    </td>
  </tr>

</table>
</center>
</body>
</html>`;

  return { subject, html };
}
