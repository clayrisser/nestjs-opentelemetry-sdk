/**
 * File: /src/opentelemetrySdk.provider.ts
 * Project: opentelemetry-nestjs
 * File Created: 24-07-2021 03:55:06
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 24-07-2021 03:55:06
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

import process from 'process';
import { FactoryProvider, Logger } from '@nestjs/common';
import { NodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { SDK_CONFIGURATION } from './types';

const logger = new Logger('OpenTelemetryModule');
export const OPENTELEMETRY_SDK = 'OPENTELEMETRY_SDK';

const OpenTelemetrySdkProvider: FactoryProvider<NodeSDK> = {
  provide: OPENTELEMETRY_SDK,
  inject: [SDK_CONFIGURATION],
  useFactory: (options: Partial<NodeSDKConfiguration>) => {
    const sdk = new NodeSDK(options || {});
    process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
      } catch (err) {
        logger.error(err);
      }
      process.exit(0);
    });
    return sdk;
  }
};

export default OpenTelemetrySdkProvider;
