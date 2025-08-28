export function buildGoogleCalUrl(opts: {
    title: string;
    description: string;
    location: string;
    startLocal: Date;       // local date/time for Toronto
    durationHours?: number; // default 6
  }) {
    const { title, description, location, startLocal, durationHours = 6 } = opts;
  
    // The Date already represents the correct moment.
    const startUtc = startLocal;
    const endUtc = new Date(startLocal.getTime() + durationHours * 3600_000);
  
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmtZ = (d: Date) =>
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z";
  
    const dates = `${fmtZ(startUtc)}/${fmtZ(endUtc)}`;
  
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      details: description,
      location,
      dates,
    });
  
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
  
  
  