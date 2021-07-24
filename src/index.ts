/**
 * File: /src/index.ts
 * Project: nestjs-tracing
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

import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { TracingOptions, TracingAsyncOptions, TRACING_OPTIONS } from './types';

@Global()
@Module({})
export default class TracingModule {
  private readonly logger = new Logger(TracingModule.name);

  private static imports = [];

  public static register(options: TracingOptions): DynamicModule {
    return {
      module: TracingModule,
      global: true,
      imports: TracingModule.imports,
      providers: [
        {
          provide: TRACING_OPTIONS,
          useValue: options
        }
      ],
      exports: [TRACING_OPTIONS]
    };
  }

  public static registerAsync(
    asyncOptions: TracingAsyncOptions
  ): DynamicModule {
    return {
      module: TracingModule,
      global: true,
      imports: [...TracingModule.imports, ...(asyncOptions.imports || [])],
      providers: [TracingModule.createOptionsProvider(asyncOptions)],
      exports: [TRACING_OPTIONS]
    };
  }

  private static createOptionsProvider(asyncOptions: TracingAsyncOptions) {
    if (!asyncOptions.useFactory) {
      throw new Error("registerAsync must have 'useFactory'");
    }
    return {
      inject: asyncOptions.inject || [],
      provide: TRACING_OPTIONS,
      useFactory: asyncOptions.useFactory
    };
  }
}

export * from './decorators';
export * from './types';
