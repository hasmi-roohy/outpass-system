const nodemailer = require('nodemailer')

const emailPassword = (process.env.EMAIL_PASS || '').replace(/\s/g, '')
const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword
  },
  tls: {
    rejectUnauthorized
  }
})

const formatDate = value => new Date(value).toDateString()
const formatDateTime = value => new Date(value).toLocaleString()
const getServerUrl = () =>
  (process.env.SERVER_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`)
    .replace(/\/$/, '')

const baseEmail = ({ title, subtitle, body, footer = 'This email was sent by the College Outpass Management System.' }) => `
  <div style="font-family: Segoe UI, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f4f7fb; padding: 20px;">
    <div style="background: #2563eb; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${title}</h1>
      <p style="color: rgba(255,255,255,0.84); margin: 8px 0 0; font-size: 14px;">${subtitle}</p>
    </div>
    <div style="background: #ffffff; padding: 28px; border-radius: 0 0 12px 12px; box-shadow: 0 8px 24px rgba(15,23,42,0.08);">
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">${footer}</p>
    </div>
  </div>
`

const requestDetailsTable = ({ student, outpass, wardenNote }) => `
  <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; padding: 18px; margin: 20px 0;">
    <h3 style="color: #2563eb; margin: 0 0 14px; font-size: 16px;">Request Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 38%;">Student</td>
        <td style="padding: 8px 0; color: #172033; font-size: 14px; font-weight: 700;">${escapeHtml(student.name)} (${escapeHtml(student.rollNumber || 'N/A')})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Reason</td>
        <td style="padding: 8px 0; color: #172033; font-size: 14px;">${escapeHtml(outpass.reason)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Destination</td>
        <td style="padding: 8px 0; color: #172033; font-size: 14px;">${escapeHtml(outpass.destination)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">From Date</td>
        <td style="padding: 8px 0; color: #172033; font-size: 14px;">${formatDate(outpass.fromDate)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">To Date</td>
        <td style="padding: 8px 0; color: #172033; font-size: 14px;">${formatDate(outpass.toDate)}</td>
      </tr>
      ${outpass.wardenNote ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Warden Note</td>
          <td style="padding: 8px 0; color: #172033; font-size: 14px;">${wardenNote}</td>
        </tr>
      ` : ''}
    </table>
  </div>
`

const sendOutpassMail = async (student, outpass, parentTokens) => {
  try {
    const emailPromises = parentTokens.map(parent => {
      if (!parent.email || parent.email.trim() === '') {
        console.log(`Skipped: ${parent.name} - no email provided`)
        return Promise.resolve({ skipped: true, name: parent.name })
      }

      const approveLink = `${getServerUrl()}/api/outpass/parent/${parent.token}/approve-direct`
      const rejectLink = `${getServerUrl()}/api/outpass/parent/${parent.token}/reject-direct`
      const parentName = escapeHtml(parent.name)

      const body = `
        <p style="color: #334155; font-size: 15px;">Dear <strong>${parentName}</strong>,</p>
        <p style="color: #334155; font-size: 15px;">
          Your ward <strong style="color: #2563eb;">${escapeHtml(student.name)}</strong> has submitted an outpass request.
        </p>

        ${requestDetailsTable({
          student,
          outpass,
          wardenNote: escapeHtml(outpass.wardenNote)
        })}

        <div style="text-align: center; margin: 28px 0 12px;">
          <a href="${approveLink}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 26px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 800; margin: 6px;">
            Approve Request
          </a>
          <a href="${rejectLink}" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 26px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 800; margin: 6px;">
            Decline Request
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px; text-align: center;">
          Approve grants the outpass immediately. Decline rejects the outpass immediately.
          These buttons are unique to you and expire after the request is completed or the link expires.
        </p>
      `

      return transporter.sendMail({
        from: `"College Outpass System" <${process.env.EMAIL_USER}>`,
        to: parent.email,
        subject: `Outpass Request - ${student.name} (${student.rollNumber})`,
        html: baseEmail({
          title: 'Outpass Request',
          subtitle: 'Action required from you',
          body
        })
      })
    })

    const results = await Promise.allSettled(emailPromises)

    results.forEach((result, index) => {
      const parent = parentTokens[index]
      if (result.status === 'fulfilled') {
        if (result.value?.skipped) {
          console.log(`Skipped: ${parent.name} - no email`)
        } else {
          console.log(`Email sent to: ${parent.name} (${parent.email})`)
        }
      } else {
        console.log(`Failed: ${parent.name} - ${result.reason?.message}`)
      }
    })

    return results.reduce((summary, result) => {
      if (result.status === 'rejected') summary.failed += 1
      else if (result.value?.skipped) summary.skipped += 1
      else summary.sent += 1
      return summary
    }, { sent: 0, skipped: 0, failed: 0 })
  } catch (error) {
    console.log('Notification error:', error.message)
    return { sent: 0, skipped: 0, failed: parentTokens.length }
  }
}

const sendApprovalMailToStudent = async (student, outpass, approvedBy) => {
  try {
    if (!student.email) return

    const body = `
      <p style="color: #334155; font-size: 15px;">Dear <strong>${escapeHtml(student.name)}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">
        Your outpass request has been <strong style="color: #16a34a;">approved</strong> by ${escapeHtml(approvedBy)}.
      </p>
      ${requestDetailsTable({ student, outpass, wardenNote: escapeHtml(outpass.wardenNote) })}
      <div style="background: #fff7ed; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #9a3412; font-size: 14px; margin: 0;">
          Important: Report to the gate before expiry. Face scan is required when leaving and returning to campus.
        </p>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        Expires at: <strong>${formatDateTime(outpass.expiresAt)}</strong>
      </p>
    `

    await transporter.sendMail({
      from: `"College Outpass System" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: 'Your Outpass Has Been Approved',
      html: baseEmail({
        title: 'Outpass Approved',
        subtitle: 'Your request has been approved',
        body
      })
    })
    console.log(`Approval email sent to student: ${student.email}`)
  } catch (error) {
    console.log('Student approval email error:', error.message)
  }
}

const sendRejectionMailToStudent = async (student, outpass, rejectedBy, reason) => {
  try {
    if (!student.email) return

    const body = `
      <p style="color: #334155; font-size: 15px;">Dear <strong>${escapeHtml(student.name)}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">
        Your outpass request to <strong>${escapeHtml(outpass.destination)}</strong> was
        <strong style="color: #dc2626;">rejected</strong> by ${escapeHtml(rejectedBy)}.
      </p>
      ${reason ? `
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
            <strong>Reason:</strong> ${escapeHtml(reason)}
          </p>
        </div>
      ` : ''}
      <p style="color: #64748b; font-size: 14px;">Please contact your warden if you have questions.</p>
    `

    await transporter.sendMail({
      from: `"College Outpass System" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: 'Your Outpass Request Was Rejected',
      html: baseEmail({
        title: 'Outpass Rejected',
        subtitle: 'Your request was not approved',
        body
      })
    })
    console.log(`Rejection email sent to student: ${student.email}`)
  } catch (error) {
    console.log('Student rejection email error:', error.message)
  }
}

module.exports = {
  sendOutpassMail,
  sendApprovalMailToStudent,
  sendRejectionMailToStudent
}
