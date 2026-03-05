/* eslint-disable @typescript-eslint/no-var-requires */
const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');
const fs = require('fs');
const handlebars = require('handlebars');

// async function createTestCreds(){
//     const creds = await nodemailer.createTestAccount();
//     console.log({creds});
// }
// createTestCreds();

// async function sendEmail() {

// }

// export default sendEmail;

const smtp = {
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
};

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  auth: {
    user: smtp.user,
    pass: smtp.pass,
  },
});

const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve('./views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./views/'),
};

transporter.use('compile', hbs(handlebarOptions));

/**
 * Function to send an email.
 * @param {Object} options - Email options, including 'to', 'from', 'subject', 'template', and any additional variables.
 */
async function sendEmail(options: any) {
  // Destructure the options object to get firstName and verificationCode
  const {
    to,
    from,
    subject,
    template,
    firstName,
    email,
    password,
    entity,
    passwordToken,
    ...rest
  } = options;

  // Read the email template file
  const emailTemplate = fs.readFileSync(
    path.resolve(`./views/${template}.handlebars`),
    'utf-8',
  );

  // Compile the email template using handlebars
  const compiledTemplate = handlebars.compile(emailTemplate);

  const context = { firstName, email, password, entity, passwordToken };

  // Render the email template with the provided context
  const html = compiledTemplate(context);

  // Send the email with the rendered template
  transporter.sendMail(
    {
      to,
      from,
      subject,
      html,
      ...rest,
    },
    (err, info) => {
      if (err) {
        console.log(err, 'Error sending mail');
        return;
      }

      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    },
  );
}

export default sendEmail;
