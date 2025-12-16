import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

type CsvRow = Record<string, string>;

/**
 * Find the header row by looking for specific column names
 */
function findHeaderRowIndex(rows: any[][], requiredColumns: string[]): number {
    console.log(`🔍 Recherche de l'en-tête dans les ${Math.min(rows.length, 10)} premières lignes...`);

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (!row) continue;

        // Convert row to strings and normalize
        const rowStrings = row.map(cell =>
            String(cell || '').trim().toUpperCase()
        );

        // Check if this row contains the required columns
        const matchCount = requiredColumns.filter(col =>
            rowStrings.some(cell => cell.includes(col.toUpperCase()))
        ).length;

        console.log(`   Ligne ${i + 1}: ${matchCount}/${requiredColumns.length} colonnes trouvées`);

        // If we find at least half of the required columns, consider this the header row
        if (matchCount >= Math.ceil(requiredColumns.length / 2)) {
            console.log(`✅ En-tête détecté à la ligne ${i + 1}`);
            return i;
        }
    }

    console.log(`⚠️  Aucun en-tête détecté, utilisation de la ligne 1 par défaut`);
    return 0; // Default to first row if not found
}

/**
 * Parse file content and automatically detect header row
 */
export function parseFileContent(
    buffer: Buffer,
    filename: string,
    requiredColumns?: string[]
): CsvRow[] {
    const extension = filename.toLowerCase().split('.').pop();

    if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const worksheet = workbook.Sheets[sheetName];

        // Get all rows as array of arrays
        const allRows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Return as array of arrays
            raw: false,
            defval: '',
        }) as any[][];

        // Find header row
        const headerRowIndex = requiredColumns
            ? findHeaderRowIndex(allRows, requiredColumns)
            : 0;

        if (headerRowIndex >= allRows.length) {
            console.log(`❌ Index d'en-tête (${headerRowIndex}) hors limites`);
            return [];
        }

        // Get headers
        const headers = allRows[headerRowIndex].map((h: any) => String(h || '').trim());
        console.log(`📋 Colonnes trouvées: ${headers.join(', ')}`);

        // Parse data rows (skip up to and including header row)
        const dataRows: CsvRow[] = [];
        for (let i = headerRowIndex + 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.length === 0) continue;

            // Check if row is empty
            const isEmpty = row.every(cell => !cell || String(cell).trim() === '');
            if (isEmpty) continue;

            // Map row to object using headers
            const rowObj: CsvRow = {};
            headers.forEach((header, index) => {
                if (header) {
                    rowObj[header] = String(row[index] || '').trim();
                }
            });

            dataRows.push(rowObj);
        }

        console.log(`✅ ${dataRows.length} lignes de données extraites (en-tête à la ligne ${headerRowIndex + 1})`);
        return dataRows;
    } else {
        // Parse CSV file
        const content = buffer.toString('utf8');

        // Parse without headers first to find header row
        const allRows = parseCsv(content, {
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        }) as string[][];

        // Find header row
        const headerRowIndex = requiredColumns
            ? findHeaderRowIndex(allRows, requiredColumns)
            : 0;

        if (headerRowIndex >= allRows.length) {
            console.log(`❌ Index d'en-tête (${headerRowIndex}) hors limites`);
            return [];
        }

        // Get headers
        const headers = allRows[headerRowIndex].map(h => String(h || '').trim());
        console.log(`📋 Colonnes trouvées: ${headers.join(', ')}`);

        // Parse data rows
        const dataRows: CsvRow[] = [];
        for (let i = headerRowIndex + 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.length === 0) continue;

            // Check if row is empty
            const isEmpty = row.every(cell => !cell || String(cell).trim() === '');
            if (isEmpty) continue;

            // Map row to object using headers
            const rowObj: CsvRow = {};
            headers.forEach((header, index) => {
                if (header) {
                    rowObj[header] = String(row[index] || '').trim();
                }
            });

            dataRows.push(rowObj);
        }

        console.log(`✅ ${dataRows.length} lignes de données extraites (en-tête à la ligne ${headerRowIndex + 1})`);
        return dataRows;
    }
}

export function isExcelFile(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return extension === 'xlsx' || extension === 'xls';
}

export function isCsvFile(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return extension === 'csv';
}

export function isSupportedFile(filename: string): boolean {
    return isExcelFile(filename) || isCsvFile(filename);
}

