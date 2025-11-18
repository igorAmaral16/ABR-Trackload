// src/utils/formatDate.js
// Utilitários simples para parse e formatação de datas
// Objetivo: tratar strings no formato "YYYY-MM-DD" como data no fuso local
// para evitar que o `new Date('YYYY-MM-DD')` seja interpretado como UTC
// e cause a exibição do dia anterior em fusos negativos (ex: Brasil UTC-3).

function parseToDate(value) {
	if (!value && value !== 0) return null;

	// Se já for um objeto Date
	if (value instanceof Date) return value;

	// Se for timestamp numérico
	if (typeof value === "number") return new Date(value);

	// Strings do tipo 'YYYY-MM-DD' -> construir como data local
	if (typeof value === "string") {
		const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
		if (dateOnlyMatch) {
			const [y, m, d] = value.split("-").map((s) => Number(s));
			return new Date(y, m - 1, d);
		}

		// Caso contrário, usar o construtor normal (suporta ISO com timezone)
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) return parsed;
	}

	// Fallback: tentar criar Date e retornar (pode resultar em Invalid Date)
	return new Date(value);
}

function formatDate(value, options = {}, locale = "pt-BR") {
	const d = parseToDate(value);
	if (!d || Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(locale, options);
}

export default formatDate;
export { parseToDate };
