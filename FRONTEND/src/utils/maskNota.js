// Utility to format/normalize NF (nota) and search input
export function formatNota(value, onlyDigits = false) {
    if (value === undefined || value === null) return "";
    let s = String(value).trim();

    // Remove diacritics (acentos)
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (onlyDigits) {
        // Keep only digits
        return s.replace(/\D+/g, "");
    }

    // Remove control chars and uncommon punctuation but keep letters, digits, spaces and -/_
    s = s.replace(/[^\w\s\-_/]/g, "");

    // Collapse multiple spaces
    s = s.replace(/\s+/g, " ").trim();

    return s;
}

// Format digits into pattern XX-XXXXXX (max 8 digits). Keeps partial typing friendly.
export function formatNotaPattern(value) {
    if (value === undefined || value === null) return "";
    const digits = String(value).replace(/\D+/g, "");
    if (!digits) return "";
    const d = digits.slice(0, 8); // limit to 8 digits (2 + 6)
    if (d.length <= 2) return d;
    return d.slice(0, 2) + "-" + d.slice(2);
}
