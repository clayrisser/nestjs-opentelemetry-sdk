/**
 * File: /src/index.ts
 * Project: nestjs-opentelemetry-sdk
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

import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node';
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
import { OpenTelemetryAsyncOptions, SDK_CONFIGURATION } from './types';

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

  public static register(
    configuration: Partial<NodeSDKConfiguration>
  ): DynamicModule {
    return {
      module: OpenTelemetryModule,
      global: true,
      imports: OpenTelemetryModule.imports,
      providers: [
        ...OpenTelemetryModule.providersAndExports,
        {
          provide: SDK_CONFIGURATION,
          useValue: {
            ...configuration
          }
        }
      ],
      exports: [...OpenTelemetryModule.providersAndExports, SDK_CONFIGURATION]
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
        OpenTelemetryModule.createSdkConfigurationProvider(asyncOptions)
      ],
      exports: [...OpenTelemetryModule.providersAndExports, SDK_CONFIGURATION]
    };
  }

  private static createSdkConfigurationProvider(
    asyncOptions: OpenTelemetryAsyncOptions
  ) {
    if (!asyncOptions.useFactory) {
      throw new Error("registerAsync must have 'useFactory'");
    }
    return {
      inject: asyncOptions.inject || [],
      provide: SDK_CONFIGURATION,
      useFactory: async (
        ...args: any[]
      ): Promise<Partial<NodeSDKConfiguration>> => {
        let configuration: Partial<NodeSDKConfiguration> = {};
        if (asyncOptions?.useFactory) {
          configuration = await asyncOptions.useFactory(...args);
        }
        return {
          ...(configuration || {}),
          instrumentations: [
            ...(configuration.instrumentations || []),
            new HttpInstrumentation(),
            new ExpressInstrumentation()
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
