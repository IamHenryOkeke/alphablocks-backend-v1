import { emailTemplate } from "./wrapper";

export const getStartedEmail = (name: string) => {
  const title = "Welcome to Alphablocks";
  const content = `
    <p>Hi ${name}, </p>
    <p>We hope this message finds you well. We're genuinely excited to welcome you to Alphablocks.</p>
    <p>We're a web3 community that is committed to teaching and providing educational resources about Blockchain and cryptocurrencies in Africa. We share some blockchain-related job opportunities and skill-related resources.</p>
    <p>We also run Cohort sessions on the basics of Blockchain technology and cryptocurrency quarterly every year.</p>
    <p>To help you get started, here are a few things you might enjoy:</p>
    <div>
      <ul>
        <li>Join the Conversation: Hop into our community, <a href="https://t.me/AlphaBlocksTech" target="_blank" rel="noopener noreferrer">TG</a>, <a href="https://forms.gle/UTHXUDpJzEYxF3Cz6" target="_blank" rel="noopener noreferrer">WhatsApp</a>, and introduce yourself; we can't wait to meet you.</li>
        <li style="margin-top: 20px;">Stay in the Loop: Follow us on <a href="https://x.com/AlphaBlocksTech" target="_blank" rel="noopener noreferrer">X</a> for updates, community highlights, and interesting insights.</li>
      </ul>
    </div>
    <p>Thank you for choosing to be part of Alphablocks. Your presence makes our community richer, and we're looking forward to all the learning and fun we'll have together.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Alphablocks Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};

export const successCohortRegistration = (
  name: string,
  cohortTitle: string,
  thumbnailImage: string,
  whatsappGroup: string,
) => {
  const title = `Welcome to ${cohortTitle}`;
  const content = `
    <p>Hello ${name}, </p>
    <p>Congratulations on signing up for the ${cohortTitle}. We're glad to have you onboard for this exciting journey into the world of Web3.</p>
    <p>We are pleased to confirm that your payment has been successfully received. As we count down to the start of the cohort, kindly join the WhatsApp group linked below to stay updated with further important information and announcements:</p>
    <div>
      <p>
        Join Whatsapp Group: <a href="${whatsappGroup}" target="_blank" rel="noopener noreferrer">${whatsappGroup}</a>
      </p>
    </div>
    <div>
      <p>Endevour to follow us on our social media platforms:</p>
      <p>Twitter: <a href="https://x.com/AlphaBlocksTech" target="_blank" rel="noopener noreferrer">@AlphablocksTech</a></p>
      <p>Telegram: <a href="https://t.me/AlphaBlocksTech" target="_blank" rel="noopener noreferrer">AlphaBlocksTech</a></p>
    </div>
    <p>Thank you, and we look forward to seeing you in the cohort!</p>
    <p style="margin-top: 30px;">Best regards,</p>
    <div style="display: grid;">
      <span style="margin-top: 8px;">Somkene</span>
      <span style="margin-top: 8px;">Community Manager, Alphablocks</span>
    </div>
  `;
  return emailTemplate(title, content, thumbnailImage);
};
