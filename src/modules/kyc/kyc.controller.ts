/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  Delete,
  Put,
  Request,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { KYCService } from './kyc.service';
import { CreateKYCUserDto } from './dto/create-kyc-user.dto';
import { UpdateKYCUserDto } from './dto/update-kyc-user.dto';
import { VerificationDecisionDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { File as MulterFile } from 'multer';

@Controller('kyc')
export class KYCController {
  constructor(private readonly kycService: KYCService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createKYCUser(@Body() kycUserDto: CreateKYCUserDto, @Request() req) {
    try {
      const createdUser = await this.kycService.createKYCUser(
        kycUserDto,
        req.user,
      );
      return createdUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async findAllKYCUsers(
    @Query('pageSize') pageSize: string,
    @Query('currentPage') currentPage: string,
    @Query('status') status: string,
    @Query('search') search: string,
    @Request() req,
  ) {
    try {
      const paginationParams = {
        pageSize: parseInt(pageSize, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
      };

      const filters = { status, search };

      const kycUsers = await this.kycService.findAllKYCUsers(
        paginationParams,
        filters,
        req.user,
      );
      return kycUsers;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req) {
    try {
      const stats = await this.kycService.getDashboardStats(req.user);
      return stats;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('details/:id')
  @UseGuards(JwtAuthGuard)
  async getKYCUserDetails(@Param('id') id: string, @Request() req) {
    try {
      const kycUser = await this.kycService.getKYCUserById(id, req.user);
      return kycUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  async updateKYCUser(
    @Param('id') id: string,
    @Body() updateData: UpdateKYCUserDto,
    @Request() req,
  ) {
    try {
      const updatedUser = await this.kycService.updateKYCUser(
        id,
        updateData,
        req.user,
      );
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  async patchKYCUser(
    @Param('id') id: string,
    @Body() updateData: UpdateKYCUserDto,
    @Request() req,
  ) {
    try {
      const updatedUser = await this.kycService.updateKYCUser(
        id,
        updateData,
        req.user,
      );
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateKYCUserStatus(
    @Param('id') id: string,
    @Body() statusData: { status: string },
    @Request() req,
  ) {
    try {
      const updatedUser = await this.kycService.updateStatus(
        id,
        statusData.status,
        req.user,
      );
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/verify-decision')
  @UseGuards(JwtAuthGuard)
  async makeVerificationDecision(
    @Param('id') id: string,
    @Body() data: VerificationDecisionDto,
    @Request() req,
  ) {
    try {
      const approved = data.approved === 'true';

      const result = await this.kycService.makeVerificationDecision(
        id,
        approved,
        data.rejectionReason,
        req.user,
        data.addressIndex,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteKYCUser(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.kycService.deleteKYCUser(id, req.user);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Body('documentType') documentType: string,
    @Request() req,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      const fileUrl = `https://storage.example.com/${file.originalname}`;

      const documentData = {
        fileName: file.originalname,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        documentType: documentType,
      };

      const updatedUser = await this.kycService.addDocument(
        id,
        documentData,
        req.user,
      );
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id/documents/:docId')
  @UseGuards(JwtAuthGuard)
  async deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Request() req,
  ) {
    try {
      const updatedUser = await this.kycService.removeDocument(
        id,
        docId,
        req.user,
      );
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportKYCData(
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    try {
      return {
        message: 'Export functionality coming soon',
        filters: { status, startDate, endDate },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/assign-agent')
  @UseGuards(JwtAuthGuard)
  async assignAgent(
    @Param('id') id: string,
    @Body() agentData: { agentId: string },
    @Request() req,
  ) {
    try {
      return {
        message: 'Agent assignment functionality coming soon',
        userId: id,
        agentId: agentData.agentId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/audit-logs')
  @UseGuards(JwtAuthGuard)
  async getAuditLogs(@Param('id') id: string, @Request() req) {
    try {
      return {
        message: 'Audit logs functionality coming soon',
        userId: id,
        logs: [],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/report')
  @UseGuards(JwtAuthGuard)
  async downloadKYCReport(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.kycService.generateKYCReport(id, req.user);

      // Get user details for filename
      const kycUser = await this.kycService.getKYCUserById(id, req.user);
      const filename = `KYC-Report-${kycUser.firstName}-${kycUser.lastName}-${id}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
