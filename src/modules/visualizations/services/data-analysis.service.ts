/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class DataAnalysisService {
  async extractReportData(
    report: any,
    selectedFields?: string[],
    dateRange?: string,
  ) {
    try {
      if (!report || !report.questions) {
        throw new BadRequestException('Invalid report data');
      }

      // Filter and validate questions/fields
      const validQuestions = report.questions.filter(
        (question: any) => question && question.id && question.title,
      );

      if (validQuestions.length === 0) {
        throw new BadRequestException('No valid questions found in report');
      }

      // Map questions to columns with proper validation
      const mockColumns = validQuestions.map((question: any) => {
        const fieldName = question.id || `field_${Date.now()}`;
        const displayName = question.title || 'Untitled Field';

        return {
          name: fieldName,
          displayName: displayName,
          type: this.mapQuestionTypeToDataType(question.type),
          nullable: true,
        };
      });

      // Filter by selected fields if provided
      const finalColumns =
        selectedFields && selectedFields.length > 0
          ? mockColumns.filter((col) => selectedFields.includes(col.name))
          : mockColumns;

      if (finalColumns.length === 0) {
        throw new BadRequestException('No valid fields selected');
      }

      // Generate mock preview data based on actual report structure
      const mockPreview = this.generateMockPreviewData(
        finalColumns,
        report.responseCount || 0,
      );

      return {
        columns: finalColumns,
        rowCount: report.responseCount || 0,
        preview: mockPreview,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to extract report data: ${error.message}`,
      );
    }
  }

  async previewReportData(reportId: string, limit = 100) {
    try {
      return [
        { region: 'North America', rating: 4.5, feedback: 'Great app!' },
        { region: 'Europe', rating: 4.2, feedback: 'Good functionality' },
        { region: 'Asia', rating: 4.7, feedback: 'Excellent features' },
      ].slice(0, limit);
    } catch (error) {
      throw new BadRequestException(
        `Failed to preview report data: ${error.message}`,
      );
    }
  }

  async generateChartData(chart: any, dataSource: any) {
    try {
      const mockData = [
        { [chart.xAxis]: 'North America', [chart.yAxis || 'value']: 4.5 },
        { [chart.xAxis]: 'Europe', [chart.yAxis || 'value']: 4.2 },
        { [chart.xAxis]: 'Asia', [chart.yAxis || 'value']: 4.7 },
        { [chart.xAxis]: 'South America', [chart.yAxis || 'value']: 3.8 },
        { [chart.xAxis]: 'Africa', [chart.yAxis || 'value']: 4.1 },
      ];

      return mockData;
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate chart data: ${error.message}`,
      );
    }
  }

  async exportChartData(chart: any, chartData: any, format: string) {
    try {
      if (format === 'csv') {
        const headers = Object.keys(chartData[0] || {});
        const csvRows = chartData.map((row: any) =>
          headers.map((header) => row[header] || '').join(','),
        );
        return [headers.join(','), ...csvRows].join('\n');
      } else {
        return JSON.stringify(
          {
            chart: { id: chart._id, name: chart.name, type: chart.type },
            data: chartData,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        );
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to export chart data: ${error.message}`,
      );
    }
  }

  private generateMockPreviewData(columns: any[], responseCount: number) {
    if (responseCount === 0) {
      return [];
    }

    // Generate up to 5 preview rows
    const previewRowCount = Math.min(5, responseCount);
    const previewData = [];

    for (let i = 0; i < previewRowCount; i++) {
      const row: any = {};

      columns.forEach((column) => {
        switch (column.type) {
          case 'number':
            row[column.name] = Math.floor(Math.random() * 100) + 1;
            break;
          case 'boolean':
            row[column.name] = Math.random() > 0.5;
            break;
          case 'date':
            row[column.name] = new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
            ).toISOString();
            break;
          default:
            row[column.name] = `Sample ${column.displayName} ${i + 1}`;
        }
      });

      previewData.push(row);
    }

    return previewData;
  }

  private mapQuestionTypeToDataType(questionType: string): string {
    if (!questionType) return 'string';

    switch (questionType.toLowerCase()) {
      case 'impact_metric':
      case 'linear_scale':
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      case 'checkboxes':
        return 'boolean';
      case 'multiple_choice':
      case 'short_answer':
      case 'long_answer':
      default:
        return 'string';
    }
  }
}
