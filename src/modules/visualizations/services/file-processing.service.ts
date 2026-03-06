import { Injectable, BadRequestException } from '@nestjs/common';
import { CsvImportDto } from '../dto/csv-import.dto';
import { File as MulterFile } from 'multer';

@Injectable()
export class FileProcessingService {
  async processCsvFile(file: MulterFile, importDto: CsvImportDto) {
    try {
      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty');
      }

      const csvContent = file.buffer.toString('utf-8');

      if (!csvContent.trim()) {
        throw new BadRequestException('CSV file is empty');
      }

      const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length === 0) {
        throw new BadRequestException('No valid data found in CSV');
      }

      const delimiter = importDto.delimiter || ',';
      const rawHeaders = lines[0].split(delimiter);
      const headers = rawHeaders.map((h) =>
        h.trim().replace(/^["']|["']$/g, ''),
      );

      if (headers.length === 0) {
        throw new BadRequestException('No headers found in CSV');
      }

      const dataStartLine = importDto.hasHeader ? 1 : 0;
      const dataLines = lines.slice(dataStartLine);

      if (dataLines.length === 0) {
        throw new BadRequestException('No data rows found in CSV');
      }

      const processedRows = [];
      const maxRowsToProcess = Math.min(dataLines.length, 1000);
      const previewRows = Math.min(maxRowsToProcess, 10);

      for (let i = 0; i < maxRowsToProcess; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue;

        try {
          const rawValues = line.split(delimiter);
          const values = rawValues.map((v) =>
            v.trim().replace(/^["']|["']$/g, ''),
          );

          while (values.length < headers.length) {
            values.push('');
          }

          const rowData: Record<string, any> = {};
          headers.forEach((header, index) => {
            let value = values[index] || '';

            const mapping = importDto.columnMappings?.find(
              (m) => m.name === header,
            );
            if (mapping) {
              value = this.convertValueByType(value, mapping.type);
            }

            rowData[header] = value;
          });

          processedRows.push(rowData);
        } catch (error) {
          continue;
        }
      }

      const preview = processedRows.slice(0, previewRows);

      return {
        headers,
        rowCount: processedRows.length,
        preview,
        processedData: processedRows,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process CSV file: ${error.message}`,
      );
    }
  }

  async previewCsvData(filePath: string, limit = 100) {
    try {
      return [
        { region: 'North America', rating: 4.5, feedback: 'Great app!' },
        { region: 'Europe', rating: 4.2, feedback: 'Good functionality' },
        { region: 'Asia', rating: 4.7, feedback: 'Excellent features' },
      ].slice(0, limit);
    } catch (error) {
      throw new BadRequestException(
        `Failed to preview CSV data: ${error.message}`,
      );
    }
  }

  generateSampleCsv(): string {
    return `region,rating,feedback,timestamp,satisfaction_score
North America,4.5,"Great app, very useful",2024-08-01T10:00:00Z,9
Europe,4.2,"Good but could be better",2024-08-01T11:15:00Z,7
Asia,4.7,"Excellent features",2024-08-01T12:30:00Z,9
South America,3.8,"Average experience",2024-08-01T13:45:00Z,6
Africa,4.1,"Very satisfied",2024-08-01T14:00:00Z,8
North America,4.0,"User-friendly interface",2024-08-02T09:30:00Z,8
Europe,3.9,"Fast and reliable",2024-08-02T10:45:00Z,7
Asia,4.3,"Love the new features",2024-08-02T11:20:00Z,9
South America,3.7,"Could use improvements",2024-08-02T12:15:00Z,7
Africa,4.4,"Outstanding performance",2024-08-02T13:30:00Z,9`;
  }

  private convertValueByType(value: string, type: string): any {
    if (!value || value.trim() === '') {
      return null;
    }

    switch (type) {
      case 'number':
        const numValue = parseFloat(value);
        return isNaN(numValue) ? null : numValue;

      case 'boolean':
        const lowerValue = value.toLowerCase();
        if (['true', 'yes', '1', 'on'].includes(lowerValue)) return true;
        if (['false', 'no', '0', 'off'].includes(lowerValue)) return false;
        return null;

      case 'date':
        try {
          const dateValue = new Date(value);
          return isNaN(dateValue.getTime()) ? null : dateValue;
        } catch {
          return null;
        }

      default:
        return value.toString();
    }
  }
}
