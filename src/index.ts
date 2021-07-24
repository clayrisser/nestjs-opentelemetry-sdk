/**
 * File: /src/index.ts
 * Project: opentelemetry-nestjs
 * File Created: 14-07-2021 11:43:59
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 19-07-2021 23:51:51
 * Modified By: Clay Risser <email@clayrisser.com>
 * -----
 * Silicon Hills LLC (c) Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  DynamicModule,
  Global,
  Logger,
  Module,
  OnModuleDestroy,
  Inject,
  OnModuleInit
} from '@nestjs/common';
import OpenTelemetrySdkProvider from './opentelemetrySdk.provider';
import {
  OPENTELEMETRY_OPTIONS,
  OpenTelemetryAsyncOptions,
  OpenTelemetryOptions
} from './types';

@Global()
@Module({})
export default class OpenTelemetryModule
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OpenTelemetryModule.name);

  private static imports = [];

  private static providersAndExports = [OpenTelemetrySdkProvider];

  constructor(
    @Inject(OpenTelemetrySdkProvider) private readonly sdk: NodeSDK
  ) {}

  public static register(options: OpenTelemetryOptions = {}): DynamicModule {
    return {
      module: OpenTelemetryModule,
      global: true,
      imports: OpenTelemetryModule.imports,
      providers: [
        ...OpenTelemetryModule.providersAndExports,
        {
          provide: OPENTELEMETRY_OPTIONS,
          useValue: {
            autoInstrumentations: true,
            ...options,
            ...(options.autoInstrumentations
              ? [getNodeAutoInstrumentations()]
              : [])
          }
        }
      ],
      exports: [
        ...OpenTelemetryModule.providersAndExports,
        OPENTELEMETRY_OPTIONS
      ]
    };
  }

  public static registerAsync(
    asyncOptions: OpenTelemetryAsyncOptions
  ): DynamicModule {
    return {
      module: OpenTelemetryModule,
      global: true,
      imports: [
        ...OpenTelemetryModule.imports,
        ...(asyncOptions.imports || [])
      ],
      providers: [
        ...OpenTelemetryModule.providersAndExports,
        OpenTelemetryModule.createOpenTelemetryOptionsProvider(asyncOptions)
      ],
      exports: [
        ...OpenTelemetryModule.providersAndExports,
        OPENTELEMETRY_OPTIONS
      ]
    };
  }

  private static createOpenTelemetryOptionsProvider(
    asyncOptions: OpenTelemetryAsyncOptions
  ) {
    if (!asyncOptions.useFactory) {
      throw new Error("registerAsync must have 'useFactory'");
    }
    return {
      inject: asyncOptions.inject || [],
      provide: OPENTELEMETRY_OPTIONS,
      useFactory: async (...args: any[]): Promise<OpenTelemetryOptions> => {
        let options: OpenTelemetryOptions = {};
        if (asyncOptions?.useFactory) {
          options = await asyncOptions.useFactory(...args);
        }
        return {
          autoInstrumentations: true,
          ...(options || {}),
          instrumentations: [
            ...(options.instrumentations || []),
            ...(options.autoInstrumentations
              ? [getNodeAutoInstrumentations()]
              : [])
          ]
        };
      }
    };
  }

  async onModuleInit() {
    await this.sdk.start();
  }

  async onModuleDestroy() {
    try {
      await this.sdk.shutdown();
    } catch (err) {
      this.logger.error(err);
    }
  }
}

export * from './types';
