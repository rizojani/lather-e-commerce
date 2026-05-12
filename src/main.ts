import * as nodeCrypto from 'node:crypto';
import { join } from 'path';
import { readFileSync } from 'fs';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = nodeCrypto;
}

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'server';
  let httpsOptions: HttpsOptions | undefined;

  if (isProduction) {
    const sslBase = '/home/customdevnewonli/public_html/ssl';
    try {
      httpsOptions = {
        key: readFileSync(`${sslBase}/customdevnewonli.key`),
        cert: readFileSync(`${sslBase}/customdevnewonli.crt`),
        ca: readFileSync(`${sslBase}/customdevnewonli.ca`),
      };
      console.log('HTTPS enabled for production environment');
    } catch (_error) {
      console.warn('SSL certificates not found, falling back to HTTP');
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
    logger: isProduction ? ['error', 'warn', 'log'] : ['debug', 'error', 'warn', 'log'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  const expressInstance = app.getHttpAdapter().getInstance();
  if (expressInstance && typeof expressInstance.use === 'function') {
    const express = require('express');
    expressInstance.use(express.urlencoded({ extended: true, limit: '10mb' }));
    expressInstance.use(express.json({ limit: '10mb' }));
  }

  const reflector = app.get(Reflector);

  if (isProduction) {
    const proxyAwareInstance = app.getHttpAdapter().getInstance();
    if (proxyAwareInstance.set) {
      proxyAwareInstance.set('trust proxy', 1);
    }
  }

  app.enableCors({
    origin: isProduction
      ? [
        'https://custom-dev.onlinetestingserver.com',
        'https://custom-dev.onlinetestingserver.com:1807',
        'http://custom-dev.onlinetestingserver.com',
        'http://custom-dev.onlinetestingserver.com:1807',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Expose uploaded files via /uploads/*
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('File Management API')
    .setDescription('File management system with user authentication')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8858;
  await app.listen(port);

  const protocol = isProduction && httpsOptions ? 'https' : 'http';
  const domain = isProduction ? 'custom-dev.onlinetestingserver.com' : 'localhost';
  console.log(`Application is running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server: ${protocol}://${domain}:${port}/api/v1`);
  console.log(`Swagger: ${protocol}://${domain}:${port}/api-docs`);
}

bootstrap();
