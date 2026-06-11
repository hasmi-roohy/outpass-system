const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
})

// ─────────────────────────────────────
// Email to parents when warden forwards
// ─────────────────────────────────────
const sendOutpassMail = async (student, outpass, parentTokens) => {
  try {
    const emailPromises = parentTokens.map(parent => {
      if (!parent.email || parent.email.trim() === '') {
        console.log(`⚠️ Skipping ${parent.name} — no email provided`)
        return Promise.resolve({ skipped: true, name: parent.name })
      }

      const approveLink = `${process.env.CLIENT_URL}/parent/approve?token=${parent.token}`

      const mailOptions = {
        from:    `"College Outpass System" <${process.env.EMAIL_USER}>`,
        to:      parent.email,
        subject: `Outpass Request — ${student.name} (${student.rollNumber})`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            
            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🎓 Outpass Request</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Action required from you</p>
            </div>

            <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
              
              <p style="color: #555; font-size: 15px;">Dear <strong>${parent.name}</strong>,</p>
              <p style="color: #555; font-size: 15px;">Your ward <strong style="color: #4f46e5;">${student.name}</strong> has submitted an outpass request that requires your approval.</p>

              <div style="background: #f8f9ff; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #4f46e5; margin: 0 0 16px; font-size: 16px;">📋 Request Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px; width: 40%;">Student</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${student.name} (${student.rollNumber})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Reason</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${outpass.reason}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Destination</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${outpass.destination}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">From Date</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date(outpass.fromDate).toDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">To Date</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date(outpass.toDate).toDateString()}</td>
                  </tr>
                  ${outpass.wardenNote ? `
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Warden Note</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${outpass.wardenNote}</td>
                  </tr>` : ''}
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${approveLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px;">
                  👉 View & Respond to Request
                </a>
              </div>

              <p style="color: #888; font-size: 13px; text-align: center;">
                You will need to verify your identity via face scan before responding.<br/>
                This link is unique to you and will expire once someone responds.
              </p>

              <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;" />

              <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
                This email was sent by the College Outpass Management System.<br/>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      }

      return transporter.sendMail(mailOptions)
    })

    const results = await Promise.allSettled(emailPromises)

    results.forEach((result, index) => {
      const parent = parentTokens[index]
      if (result.status === 'fulfilled') {
        if (result.value?.skipped) {
          console.log(`⚠️ Skipped: ${parent.name} — no email`)
        } else {
          console.log(`✅ Email sent to: ${parent.name} (${parent.email})`)
        }
      } else {
        console.log(`❌ Failed: ${parent.name} — ${result.reason?.message}`)
      }
    })

  } catch (error) {
    console.log('❌ Notification error:', error.message)
  }
}

// ─────────────────────────────────────
// Email to student when outpass approved
// ─────────────────────────────────────
const sendApprovalMailToStudent = async (student, outpass, approvedBy) => {
  try {
    if (!student.email) return

    const mailOptions = {
      from:    `"College Outpass System" <${process.env.EMAIL_USER}>`,
      to:      student.email,
      subject: `✅ Your Outpass Has Been Approved!`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">

          <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Outpass Approved!</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your request has been approved</p>
          </div>

          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            
            <p style="color: #555; font-size: 15px;">Dear <strong>${student.name}</strong>,</p>
            <p style="color: #555; font-size: 15px;">Great news! Your outpass request has been <strong style="color: #16a34a;">approved</strong> by ${approvedBy}.</p>

            <div style="background: #f0fff4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #16a34a; margin: 0 0 16px; font-size: 16px;">📋 Approved Outpass Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px; width: 40%;">Destination</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${outpass.destination}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">Reason</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px;">${outpass.reason}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">From Date</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date(outpass.fromDate).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">To Date</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date(outpass.toDate).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">Expires At</td>
                  <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600;">${new Date(outpass.expiresAt).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0;">
                ⚠️ <strong>Important:</strong> Please report to the gate before your outpass expires. 
                You must complete the face scan at the gate when leaving and returning to campus.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;" />

            <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
              This email was sent by the College Outpass Management System.<br/>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Approval email sent to student: ${student.email}`)

  } catch (error) {
    console.log('❌ Student approval email error:', error.message)
  }
}

// ─────────────────────────────────────
// Email to student when outpass rejected
// ─────────────────────────────────────
const sendRejectionMailToStudent = async (student, outpass, rejectedBy, reason) => {
  try {
    if (!student.email) return

    const mailOptions = {
      from:    `"College Outpass System" <${process.env.EMAIL_USER}>`,
      to:      student.email,
      subject: `❌ Your Outpass Request Was Rejected`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">

          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">❌</div>
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Outpass Rejected</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your request was not approved</p>
          </div>

          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            
            <p style="color: #555; font-size: 15px;">Dear <strong>${student.name}</strong>,</p>
            <p style="color: #555; font-size: 15px;">Unfortunately, your outpass request to <strong>${outpass.destination}</strong> has been <strong style="color: #dc2626;">rejected</strong> by ${rejectedBy}.</p>

            ${reason ? `
            <div style="background: #fff0f0; border-left: 4px solid #dc2626; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
                <strong>Reason:</strong> ${reason}
              </p>
            </div>` : ''}

            <p style="color: #555; font-size: 14px;">
              If you have questions, please contact your warden directly.
            </p>

            <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;" />

            <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
              This email was sent by the College Outpass Management System.
            </p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Rejection email sent to student: ${student.email}`)

  } catch (error) {
    console.log('❌ Student rejection email error:', error.message)
  }
}

module.exports = {
  sendOutpassMail,
  sendApprovalMailToStudent,
  sendRejectionMailToStudent
}