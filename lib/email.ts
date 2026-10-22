export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function emailHtml(data: {
  brand: string;
  title: string;
  subtitle: string;
  cta: string;
  color: string;
  url: string;
}) {
  const safe = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, escapeHtml(value)]),
  );
  const color = /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : "#6654c0";
  const url = /^https?:\/\//i.test(data.url) ? safe.url : "#";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe.brand}</title></head><body style="margin:0;padding:32px 12px;background:#f3f2ef;font-family:Arial,sans-serif"><table role="presentation" style="width:100%;max-width:600px;margin:auto;background:#ffffff;border-collapse:collapse"><tr><td style="padding:48px 32px;text-align:center"><p style="font-size:20px;font-weight:bold;color:${color}">${safe.brand}</p><h1 style="font-size:36px;line-height:1.2;color:#252525;white-space:pre-line">${safe.title}</h1><p style="font-size:16px;line-height:1.8;color:#666">${safe.subtitle}</p><p style="padding:24px"><a href="${url}" style="display:inline-block;padding:16px 24px;background:${color};color:#fff;text-decoration:none;border-radius:6px">${safe.cta}</a></p><p style="font-size:12px;color:#777">Sent with care by ${safe.brand}.</p></td></tr></table></body></html>`;
}
