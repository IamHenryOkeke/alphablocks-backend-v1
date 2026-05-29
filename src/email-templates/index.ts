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

export const adminInviteEmail = (name: string, inviteUrl: string) => {
  const title = "You're Invited to Join the Alphablocks Admin Team";
  const content = `
    <p>Hi ${name},</p>
    <p>We're thrilled to invite you to join the Alphablocks Admin Team! Your dedication and contributions to our community have not gone unnoticed, and we believe you'd be a great addition to the team.</p>
    <p>As an admin, you'll play a key role in shaping the direction of our community, helping manage events, curating resources, and supporting our growing network of blockchain enthusiasts across Africa.</p>
    <p>Here's what to expect as an admin:</p>
    <div>
      <ul>
        <li>Help moderate and manage our community channels across Telegram and WhatsApp.</li>
        <li style="margin-top: 20px;">Contribute to planning and organizing our quarterly Cohort sessions.</li>
        <li style="margin-top: 20px;">Collaborate with the team to share job opportunities and educational resources.</li>
      </ul>
    </div>
    <p>To accept this invitation and set up your admin account, please click the link below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #4CAF50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
    </div>
    <p style="font-size: 13px; color: #888;">This invitation will expire in 72 hours. If it has expired, please contact a current admin to request a new one.</p>
    <p>If you have any questions or concerns, feel free to reach out to us. We're here to help you get started.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Alphablocks Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};

export const passwordResetEmail = (name: string, resetUrl: string) => {
  const title = "Reset Your Alphablocks Password";
  const content = `
    <p>Hi ${name},</p>
    <p>We received a request to reset the password for your Alphablocks account. If you made this request, you can set a new password using the link below.</p>
    <p>For your security, this link is unique to you and should not be shared with anyone.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #4CAF50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
    </div>
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #555;">${resetUrl}</p>
    <p style="font-size: 13px; color: #888;">This link will expire in 60 minutes. If it has expired, you can request a new one from the login page.</p>
    <p>If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged. If you're concerned about the security of your account, please reach out to us right away.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Alphablocks Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};

export const verifyAccountEmail = (name: string, verifyUrl: string) => {
  const title = "Verify Your Alphablocks Account";
  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to Alphablocks! We're excited to have you join our growing community of blockchain enthusiasts across Africa.</p>
    <p>Before you can get started, we just need to confirm that this email address belongs to you. Please verify your account by clicking the button below.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #4CAF50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Account</a>
    </div>
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #555;">${verifyUrl}</p>
    <p style="font-size: 13px; color: #888;">This verification link will expire in 24 hours. If it has expired, you can request a new one from the sign-in page.</p>
    <p>Once your account is verified, you'll be able to access cohort sessions, community channels, curated resources, and job opportunities shared with our network.</p>
    <p>If you didn't create an Alphablocks account, you can safely ignore this email.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Alphablocks Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};

export const deleteTeamMemberEmail = (name: string) => {
  const title = "Your Alphablocks Team Membership Has Ended";
  const content = `
    <p>Hi ${name},</p>
    <p>We're writing to let you know that your team membership at Alphablocks has been removed, and your access to team-specific tools and resources has now ended.</p>
    <p>This means you'll no longer appear on our public team page or have access to internal team channels and admin resources. Any team-related responsibilities tied to your account have also been deactivated.</p>
    <p>Please note that this change applies to your role on the Alphablocks team only. If you'd like to continue engaging with us as a community member, you're more than welcome to do so, you'll still have access to cohort sessions, community channels, and curated resources available to our wider network.</p>
    <p>We're truly grateful for the time, energy, and contributions you brought to the team. Your work helped shape what Alphablocks is today, and we genuinely appreciate everything you did during your time with us.</p>
    <p>If you believe this was done in error, or if you have any questions about this change, please reach out to us and we'll be happy to look into it.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Alphablocks Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};
