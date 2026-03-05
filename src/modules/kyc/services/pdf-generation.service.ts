/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { KYCUser } from '../model/kyc-user.model';
import { format } from 'date-fns';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PDFGenerationService {
  private readonly logger = new Logger(PDFGenerationService.name);
  private readonly PRIMARY_COLOR = '#5B94E5';
  private readonly SUCCESS_COLOR = '#10B981';
  private readonly WARNING_COLOR = '#F59E0B';
  private readonly ERROR_COLOR = '#EF4444';
  private readonly DARK = '#1F2937';
  private readonly MEDIUM_GRAY = '#6B7280';
  private readonly LIGHT_GRAY = '#F9FAFB';
  private readonly BORDER_GRAY = '#E5E7EB';

  async generateKYCReport(kycUser: KYCUser): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({
          size: 'A4',
          margins: { top: 0, bottom: 50, left: 50, right: 50 },
          bufferPages: true,
        });

        const buffers: Uint8Array[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        this.addBrandedHeader(doc, kycUser);
        this.addHeaderInfo(doc, kycUser);
        this.addStatusTable(doc, kycUser);
        this.addUserInfoTable(doc, kycUser);

        const hasMultipleAddresses =
          kycUser.addresses && kycUser.addresses.length > 0;

        if (hasMultipleAddresses) {
          for (let i = 0; i < kycUser.addresses.length; i++) {
            const address = kycUser.addresses[i];
            await this.addAddressSection(
              doc,
              address,
              i + 1,
              kycUser.addresses.length,
            );
          }
        } else {
          await this.addSingleAddressSection(doc, kycUser);
        }

        this.addFooterToAllPages(doc, kycUser);

        doc.end();
      } catch (error) {
        this.logger.error('PDF generation error:', error);
        reject(error);
      }
    });
  }

  private addBrandedHeader(
    doc: InstanceType<typeof PDFDocument>,
    kycUser: KYCUser,
  ) {
    doc.rect(0, 0, 595.28, 90).fill(this.PRIMARY_COLOR);

    const logoPath = path.join(
      process.cwd(),
      'dist',
      'assets',
      'melon-logo.png',
    );
    const altLogoPath = path.join(
      process.cwd(),
      'src',
      'assets',
      'melon-logo.png',
    );

    let logoLoaded = false;

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 30, { width: 130 });
        logoLoaded = true;
      } catch (e) {
        this.logger.warn('Failed to load logo from dist');
      }
    }

    if (!logoLoaded && fs.existsSync(altLogoPath)) {
      try {
        doc.image(altLogoPath, 50, 30, { width: 130 });
        logoLoaded = true;
      } catch (e) {
        this.logger.warn('Failed to load logo from src');
      }
    }

    if (!logoLoaded) {
      doc
        .fontSize(32)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('melon', 50, 35);
    }

    doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .font('Helvetica')
      .text(`Request ID: ${kycUser._id}`, 400, 50, {
        width: 145,
        align: 'right',
      });

    doc.y = 110;
  }

  private addHeaderInfo(
    doc: InstanceType<typeof PDFDocument>,
    kycUser: KYCUser,
  ) {
    const y = 110;

    doc.rect(50, y, 495, 50).fillAndStroke(this.LIGHT_GRAY, this.BORDER_GRAY);

    doc
      .fontSize(9)
      .fillColor(this.MEDIUM_GRAY)
      .font('Helvetica')
      .text('Organization', 70, y + 12);
    doc
      .fontSize(11)
      .fillColor(this.DARK)
      .font('Helvetica-Bold')
      .text('Melon Solutions', 70, y + 28);

    doc
      .fontSize(9)
      .fillColor(this.MEDIUM_GRAY)
      .font('Helvetica')
      .text('Integrated', 220, y + 28);

    doc
      .fontSize(9)
      .fillColor(this.MEDIUM_GRAY)
      .font('Helvetica')
      .text('API Service', 350, y + 12);
    doc
      .fontSize(11)
      .fillColor(this.DARK)
      .font('Helvetica-Bold')
      .text('Physical Address', 350, y + 28);

    doc.y = y + 70;
  }

  private addStatusTable(
    doc: InstanceType<typeof PDFDocument>,
    kycUser: KYCUser,
  ) {
    const startY = doc.y;

    doc
      .fontSize(14)
      .fillColor(this.DARK)
      .font('Helvetica-Bold')
      .text('Status', 50, startY);

    doc
      .moveTo(50, startY + 20)
      .lineTo(545, startY + 20)
      .stroke(this.BORDER_GRAY);

    const rows = [
      { label: 'State', value: 'Complete' },
      {
        label: 'Overall Status',
        value: this.getStatusDisplayName(kycUser.status),
      },
      {
        label: 'Created At',
        value: format(new Date(kycUser.createdAt), 'dd MMMM yyyy'),
      },
    ];

    if (kycUser.verificationDate) {
      rows.push({
        label: 'Approved At',
        value: format(new Date(kycUser.verificationDate), 'dd MMMM yyyy'),
      });
    }

    let yPos = startY + 30;
    rows.forEach((row) => {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.label, 70, yPos);

      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.value, 450, yPos, { width: 95, align: 'right' });

      yPos += 20;
    });

    doc.y = yPos + 20;
  }

  private addUserInfoTable(
    doc: InstanceType<typeof PDFDocument>,
    kycUser: KYCUser,
  ) {
    const startY = doc.y;

    doc
      .fontSize(14)
      .fillColor(this.DARK)
      .font('Helvetica-Bold')
      .text('User Information', 50, startY);
    doc
      .moveTo(50, startY + 20)
      .lineTo(545, startY + 20)
      .stroke(this.BORDER_GRAY);

    const rows = [
      { label: 'Firstname', value: kycUser.firstName },
      { label: 'Lastname', value: kycUser.lastName },
      { label: 'Email', value: kycUser.email },
      { label: 'Phone number', value: kycUser.phone },
    ];

    if (kycUser.bvn) {
      rows.push({ label: 'BVN', value: kycUser.bvn });
    }
    if (kycUser.nin) {
      rows.push({ label: 'NIN', value: kycUser.nin });
    }

    let yPos = startY + 30;
    rows.forEach((row) => {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.label, 70, yPos);
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.value, 450, yPos, { width: 95, align: 'right' });
      yPos += 20;
    });

    doc.y = yPos + 20;
  }

  private async addAddressSection(
    doc: InstanceType<typeof PDFDocument>,
    address: any,
    addressNumber: number,
    totalAddresses: number,
  ) {
    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }

    const startY = doc.y;

    doc
      .fontSize(14)
      .fillColor(this.DARK)
      .font('Helvetica-Bold')
      .text(
        `${
          address.label || `Address ${addressNumber}`
        } (${addressNumber}/${totalAddresses})`,
        50,
        startY,
      );

    if (address.status) {
      const statusColor = this.getStatusColor(address.status);
      doc
        .fontSize(10)
        .fillColor(statusColor)
        .font('Helvetica-Bold')
        .text(this.getStatusDisplayName(address.status), 450, startY, {
          width: 95,
          align: 'right',
        });
    }

    doc
      .moveTo(50, startY + 20)
      .lineTo(545, startY + 20)
      .stroke(this.BORDER_GRAY);

    const addressParts = [
      address.streetNumber,
      address.streetName,
      address.landmark,
      address.city,
      address.lga,
      address.state,
      address.country,
    ].filter(Boolean);

    const rows = [
      {
        label: 'Full Address',
        value: addressParts.join(', ') || 'N/A',
      },
      { label: 'City', value: address.city || 'N/A' },
      { label: 'LGA', value: address.lga || 'N/A' },
      { label: 'State', value: address.state || 'N/A' },
      { label: 'Landmark', value: address.landmark || 'N/A' },
    ];

    if (address.latitude && address.longitude) {
      rows.push({
        label: 'GPS Coordinates',
        value: `${address.latitude.toFixed(6)}, ${address.longitude.toFixed(
          6,
        )}`,
      });
    }

    let yPos = startY + 30;
    rows.forEach((row) => {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.label, 70, yPos);
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.value, 280, yPos, { width: 265, align: 'left' });
      yPos += 20;
    });

    doc.y = yPos + 20;

    if (address.verificationData) {
      await this.addVerificationData(doc, address);
    }

    if (address.rejectionReason) {
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      doc
        .fontSize(11)
        .fillColor(this.ERROR_COLOR)
        .font('Helvetica-Bold')
        .text('Rejection Reason', 70, doc.y);

      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(address.rejectionReason, 70, doc.y + 15, { width: 475 });

      doc.y += 50;
    }

    doc.y += 10;
  }

  private async addSingleAddressSection(
    doc: InstanceType<typeof PDFDocument>,
    kycUser: KYCUser,
  ) {
    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }

    const startY = doc.y;

    doc
      .fontSize(14)
      .fillColor(this.DARK)
      .font('Helvetica-Bold')
      .text('Address Information', 50, startY);
    doc
      .moveTo(50, startY + 20)
      .lineTo(545, startY + 20)
      .stroke(this.BORDER_GRAY);

    const addressParts = [
      kycUser.streetNumber,
      kycUser.streetName,
      kycUser.landmark,
      kycUser.city,
      kycUser.lga,
      kycUser.state,
      kycUser.country,
    ].filter(Boolean);

    const rows = [
      {
        label: 'Full Address',
        value: addressParts.join(', ') || 'N/A',
      },
      { label: 'City', value: kycUser.city || 'N/A' },
      { label: 'LGA', value: kycUser.lga || 'N/A' },
      { label: 'State', value: kycUser.state || 'N/A' },
      { label: 'Landmark', value: kycUser.landmark || 'N/A' },
    ];

    if (kycUser.latitude && kycUser.longitude) {
      rows.push({
        label: 'GPS Coordinates',
        value: `${kycUser.latitude.toFixed(6)}, ${kycUser.longitude.toFixed(
          6,
        )}`,
      });
    }

    let yPos = startY + 30;
    rows.forEach((row) => {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.label, 70, yPos);
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(row.value, 280, yPos, { width: 265, align: 'left' });
      yPos += 20;
    });

    doc.y = yPos + 20;

    if (kycUser.verificationData) {
      await this.addVerificationData(doc, kycUser);
    }
  }

  private async addVerificationData(
    doc: InstanceType<typeof PDFDocument>,
    data: any,
  ) {
    if (!data.verificationData) return;

    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }

    const startY = doc.y;

    doc
      .fontSize(12)
      .fillColor(this.SUCCESS_COLOR)
      .font('Helvetica-Bold')
      .text('✓ Agent Verification', 70, startY);

    let yPos = startY + 25;

    if (
      data.verificationData.verifiedLatitude &&
      data.verificationData.verifiedLongitude
    ) {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text('Verified GPS Coordinates', 70, yPos);
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(
          `${data.verificationData.verifiedLatitude.toFixed(
            6,
          )}, ${data.verificationData.verifiedLongitude.toFixed(6)}`,
          280,
          yPos,
        );
      yPos += 20;

      if (data.latitude && data.longitude) {
        const distance = this.calculateDistance(
          data.latitude,
          data.longitude,
          data.verificationData.verifiedLatitude,
          data.verificationData.verifiedLongitude,
        );
        const distText =
          distance < 1
            ? `${(distance * 1000).toFixed(0)} meters`
            : `${distance.toFixed(2)} km`;

        doc
          .fontSize(10)
          .fillColor(this.DARK)
          .font('Helvetica')
          .text('Distance from Original', 70, yPos);
        doc
          .fontSize(10)
          .fillColor(distance < 0.5 ? this.SUCCESS_COLOR : this.WARNING_COLOR)
          .font('Helvetica-Bold')
          .text(distText, 280, yPos);
        yPos += 20;
      }
    }

    if (data.verificationData.verifiedAddress) {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text('Verified Address', 70, yPos);
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(data.verificationData.verifiedAddress, 70, yPos + 15, {
          width: 475,
        });
      yPos += 50;
    }

    if (data.verificationData.agentNotes) {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica-Bold')
        .text("Agent's Comment", 70, yPos);
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica')
        .text(data.verificationData.agentNotes, 70, yPos + 15, {
          width: 475,
        });
      yPos += 50;
    }

    if (data.verificationData.verificationPhotos?.length > 0) {
      doc
        .fontSize(10)
        .fillColor(this.DARK)
        .font('Helvetica-Bold')
        .text(
          `Verification Photos (${data.verificationData.verificationPhotos.length})`,
          70,
          yPos,
        );
      yPos += 20;

      const photos = data.verificationData.verificationPhotos.slice(0, 6);
      const photoWidth = 150;
      const photoHeight = 110;
      const spacing = 15;

      for (let i = 0; i < photos.length; i++) {
        try {
          const response = await axios.get(photos[i], {
            responseType: 'arraybuffer',
            timeout: 10000,
          });
          const buffer = Buffer.from(response.data);

          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 70 + col * (photoWidth + spacing);
          const y = yPos + row * (photoHeight + spacing);

          if (y + photoHeight > 750) {
            doc.addPage();
            doc.image(buffer, x, 50, {
              width: photoWidth,
              height: photoHeight,
              fit: [photoWidth, photoHeight],
            });
          } else {
            doc.image(buffer, x, y, {
              width: photoWidth,
              height: photoHeight,
              fit: [photoWidth, photoHeight],
            });
          }
        } catch (e) {
          this.logger.error(`Failed to load photo ${i}:`, e.message);
        }
      }

      const rows = Math.ceil(photos.length / 3);
      doc.y = yPos + rows * (photoHeight + spacing) + 20;
    } else {
      doc.y = yPos + 10;
    }
  }

  private addFooterToAllPages(
    doc: InstanceType<typeof PDFDocument>,
    kycUser: KYCUser,
  ) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .moveTo(50, 792 - 40)
        .lineTo(545, 792 - 40)
        .stroke(this.BORDER_GRAY);
      doc
        .fontSize(8)
        .fillColor(this.MEDIUM_GRAY)
        .font('Helvetica')
        .text(
          `Generated: ${format(
            new Date(),
            'dd MMM yyyy, HH:mm a',
          )} | Request ID: ${kycUser._id}`,
          50,
          792 - 30,
          { width: 495, align: 'center' },
        );
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private getStatusDisplayName(status: string): string {
    const names = {
      PENDING: 'Pending',
      ASSIGNED: 'Agent Assigned',
      IN_REVIEW: 'In Review',
      VERIFICATION_SUBMITTED: 'Pending Approval',
      VERIFIED: 'Verified',
      REJECTED: 'Rejected',
    };
    return names[status] || status;
  }

  private getStatusColor(status: string): string {
    const colors = {
      PENDING: this.WARNING_COLOR,
      ASSIGNED: this.PRIMARY_COLOR,
      IN_REVIEW: this.PRIMARY_COLOR,
      VERIFICATION_SUBMITTED: this.WARNING_COLOR,
      VERIFIED: this.SUCCESS_COLOR,
      REJECTED: this.ERROR_COLOR,
    };
    return colors[status] || this.DARK;
  }
}
