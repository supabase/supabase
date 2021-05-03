import { newE2EPage } from '@stencil/core/testing';

describe('app-auth-login', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<app-auth-login></app-auth-login>');

    const element = await page.find('app-auth-login');
    expect(element).toHaveClass('hydrated');
  });
});
