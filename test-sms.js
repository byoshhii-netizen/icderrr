const axios = require('axios');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>8503051855</usercode>
    <password>8bdc#54</password>
    <type>1:n</type>
    <msgheader>iCDER</msgheader>
  </header>
  <body>
    <msg><![CDATA[Test mesaji]]></msg>
    <no>905555555555</no>
  </body>
</mainbody>`;

axios.post('https://api.netgsm.com.tr/sms/send/xml', xml, {
  headers: { 'Content-Type': 'text/xml' },
  timeout: 10000
}).then(r => {
  console.log('YANIT:', r.data);
  console.log('STATUS:', r.status);
}).catch(e => {
  console.log('HATA:', e.message);
  if (e.response) console.log('RESPONSE:', e.response.data);
});
