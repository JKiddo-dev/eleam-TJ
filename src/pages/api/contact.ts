import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['Enfermería', 'TENS', 'Cuidado', 'Cocina', 'Aseo'];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';

    let formType = 'contacto';
    let name = '';
    let phone = '';
    let email = '';
    let message = '';
    let role = '';
    let cvLink = '';
    let cvFile: File | null = null;

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formType = String(formData.get('formType') ?? 'contacto').trim();
      name = String(formData.get('name') ?? '').trim();
      phone = String(formData.get('phone') ?? '').trim();
      email = String(formData.get('email') ?? '').trim();
      message = String(formData.get('message') ?? '').trim();
      role = String(formData.get('role') ?? '').trim();
      cvLink = String(formData.get('cvLink') ?? '').trim();

      const uploaded = formData.get('cvFile');
      if (uploaded instanceof File && uploaded.size > 0) {
        cvFile = uploaded;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'El formato de los datos enviados no es válido.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      formType = typeof body.formType === 'string' ? body.formType.trim() : 'contacto';
      name = typeof body.name === 'string' ? body.name.trim() : '';
      phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      email = typeof body.email === 'string' ? body.email.trim() : '';
      message = typeof body.message === 'string' ? body.message.trim() : '';
      role = typeof body.role === 'string' ? body.role.trim() : '';
      cvLink = typeof body.cvLink === 'string' ? body.cvLink.trim() : '';
    }

    const errors: Record<string, string> = {};

    if (!name || name.length < 2) {
      errors.name = 'Por favor ingrese su nombre completo.';
    }

    if (!phone || phone.length < 6) {
      errors.phone = 'Por favor ingrese un teléfono de contacto válido.';
    }

    if (formType === 'postulacion') {
      if (!email || !EMAIL_REGEX.test(email)) {
        errors.email = 'Por favor ingrese un correo electrónico válido.';
      }
      if (!role || !VALID_ROLES.includes(role)) {
        errors.role = 'Seleccione la especialidad o cargo al que postula.';
      }
      if (cvFile && cvFile.size > 5 * 1024 * 1024) {
        errors.cvFile = 'El archivo adjunto no debe superar los 5 MB.';
      }
    } else {
      if (email && !EMAIL_REGEX.test(email)) {
        errors.email = 'El formato del correo electrónico no es válido.';
      }
      if (!message || message.length < 5) {
        errors.message = 'Por favor ingrese una breve consulta o motivo de contacto.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Por favor revise los campos requeridos del formulario.',
          errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const emailTo =
      import.meta.env.CONTACT_EMAIL_TO ||
      process.env.CONTACT_EMAIL_TO ||
      'contacto@residenciateresitadejesus.cl';
    const emailFrom =
      import.meta.env.CONTACT_EMAIL_FROM ||
      process.env.CONTACT_EMAIL_FROM ||
      'Residencia Teresita de Jesús <onboarding@resend.dev>';

    if (!resendApiKey || resendApiKey === 're_tu_api_key_aqui') {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'El servicio de correo aún no tiene configurada una clave RESEND_API_KEY válida en el entorno. Puede contactarnos directamente al +56 9 7965 5573.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);

    const subject =
      formType === 'postulacion'
        ? `[Postulación Laboral - ${role}] ${name} — Residencia Teresita de Jesús`
        : `[Solicitud de Contacto / Visita Vitacura] ${name} — Residencia Teresita de Jesús`;

    const htmlContent =
      formType === 'postulacion'
        ? `
          <div style="font-family: Georgia, serif; color: #141E2B; max-width: 600px; line-height: 1.6;">
            <h2 style="margin-bottom: 4px; color: #15251E;">Nueva Postulación Laboral</h2>
            <p style="font-size: 13px; color: #736255; margin-top: 0;">Residencia Teresita de Jesús · Sede Vitacura</p>
            <hr style="border: 0; border-top: 1px solid #E6E1D6; margin: 20px 0;" />
            <p><strong>Nombre completo:</strong> ${escapeHtml(name)}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Correo electrónico:</strong> ${escapeHtml(email)}</p>
            <p><strong>Especialidad / Cargo al que postula:</strong> ${escapeHtml(role)}</p>
            ${cvLink ? `<p><strong>Enlace a CV / Perfil:</strong> <a href="${escapeHtml(cvLink)}">${escapeHtml(cvLink)}</a></p>` : ''}
            ${cvFile ? `<p><strong>Archivo CV adjunto:</strong> ${escapeHtml(cvFile.name)}</p>` : ''}
            ${message ? `<p><strong>Presentación / Experiencia:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
          </div>
        `
        : `
          <div style="font-family: Georgia, serif; color: #141E2B; max-width: 600px; line-height: 1.6;">
            <h2 style="margin-bottom: 4px; color: #15251E;">Nueva Consulta / Solicitud de Visita</h2>
            <p style="font-size: 13px; color: #736255; margin-top: 0;">Residencia Teresita de Jesús · Islas Marianas 1791, Vitacura</p>
            <hr style="border: 0; border-top: 1px solid #E6E1D6; margin: 20px 0;" />
            <p><strong>Nombre completo:</strong> ${escapeHtml(name)}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
            ${email ? `<p><strong>Correo electrónico:</strong> ${escapeHtml(email)}</p>` : ''}
            <p><strong>Mensaje / Consulta:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
          </div>
        `;

    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (cvFile) {
      const arrayBuffer = await cvFile.arrayBuffer();
      attachments.push({
        filename: cvFile.name,
        content: Buffer.from(arrayBuffer),
      });
    }

    const { error } = await resend.emails.send({
      from: emailFrom,
      to: [emailTo],
      replyTo: email || undefined,
      subject,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No fue posible enviar su mensaje en este momento. Por favor intente nuevamente o llámenos al +56 9 7965 5573.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          formType === 'postulacion'
            ? 'Su postulación ha sido enviada correctamente a nuestro equipo de selección en Vitacura.'
            : 'Su mensaje ha sido recibido. Nuestro equipo en Vitacura se comunicará con usted a la brevedad.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ocurrió un error inesperado al procesar su solicitud.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
