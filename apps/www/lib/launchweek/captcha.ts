/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export async function validateCaptchaResult(result: string): Promise<boolean> {
  const { success }: { success: boolean } = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${result}`
  }).then(res => res.json());

  return success;
}

export const IS_CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
