/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const handleDbErrors = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const fieldName = field === 'organization' ? 'organization' : field;

    if (field === 'email') {
      throw new BadRequestException(
        'A user with this email already exists in your organization',
      );
    } else {
      throw new BadRequestException(
        `Duplicate ${field}: This value already exists`,
      );
    }
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(
      (val: any) => val.message,
    );
    throw new BadRequestException(messages.join(', '));
  }
};

export const handleErrorCatch = (err) => {
  console.log(err);
  const logger = new Logger();
  logger.error(err);
  handleDbErrors(err);

  if (
    err.status === HttpStatus.NOT_FOUND ||
    err.status === HttpStatus.BAD_REQUEST ||
    err.status === HttpStatus.UNAUTHORIZED ||
    err.status === HttpStatus.FORBIDDEN ||
    err.status === HttpStatus.CONFLICT
  ) {
    throw new HttpException(
      {
        status: err.status,
        message: err.response?.message || err.message,
        error: err.response?.error || err.name,
      },
      err.status,
    );
  }

  throw new HttpException(
    {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: `An error occurred: ${err.message}`,
      message: err.message,
      errorType: 'Internal server error',
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
};

export const generateOTP = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export function signToken(userId: string, userData?: any): string {
  const payload = {
    sub: userId,
    id: userId,
    email: userData?.email,
    organizationId: userData?.organizationId,
    role: userData?.role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
}

export function extractDomainFromEmail(email: string): string {
  const domain = email.split('@')[1];
  if (!domain) {
    throw new BadRequestException('Invalid email format');
  }
  return domain.toLowerCase();
}

export function validateBusinessEmail(email: string): boolean {
  const domain = extractDomainFromEmail(email);

  // List of common personal email domains to reject
  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'protonmail.com',
    'mail.com',
  ];

  return !personalDomains.includes(domain);
}
